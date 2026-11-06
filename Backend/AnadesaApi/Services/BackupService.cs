using System.Data;
using System.Data.SqlClient;
using System.Text.RegularExpressions;
using AnadesaApi.DTOs;
using Microsoft.AspNetCore.Http;

namespace AnadesaApi.Services;

/// <summary>
/// Copias de seguridad de la base de datos: listar, crear (.bak), descargar,
/// eliminar y restaurar. Los archivos se guardan en &lt;proyecto&gt;/Backups
/// (el servicio de SQL tiene permiso de escritura concedido con icacls).
/// </summary>
public class BackupService
{
    private readonly IConfiguration _config;
    private readonly ILogger<BackupService> _logger;

    public BackupService(IConfiguration config, ILogger<BackupService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    private string NombreBaseDeDatos()
    {
        var csb = new SqlConnectionStringBuilder(_config.GetConnectionString("DefaultConnection"));
        return csb.InitialCatalog;
    }

    private static string DirectorioBackups()
    {
        var raiz = RutasArchivos.RaizProyecto;
        var baseDir = !string.IsNullOrWhiteSpace(raiz) ? raiz : AppContext.BaseDirectory;
        var dir = Path.Combine(baseDir, "Backups");
        Directory.CreateDirectory(dir);
        return dir;
    }

    /// <summary>Valida el nombre (sin rutas ni traversal) y devuelve el nombre de archivo.</summary>
    private static string ValidarNombre(string archivo)
    {
        var nombre = Path.GetFileName(archivo ?? string.Empty);
        if (string.IsNullOrWhiteSpace(nombre) ||
            !nombre.EndsWith(".bak", StringComparison.OrdinalIgnoreCase) ||
            nombre.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            throw new InvalidOperationException("Nombre de archivo no válido.");
        return nombre;
    }

    public async Task<List<BackupDto>> ListarAsync()
    {
        var dir = DirectorioBackups();
        var archivos = Directory.GetFiles(dir, "*.bak")
            .Select(p => new FileInfo(p))
            .OrderByDescending(f => f.LastWriteTimeUtc)
            .ToList();

        var historial = await LeerHistorialAsync();
        var porArchivo = historial
            .GroupBy(h => h.archivo, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var resultado = new List<BackupDto>();
        foreach (var f in archivos)
        {
            porArchivo.TryGetValue(f.Name, out var h);
            resultado.Add(new BackupDto
            {
                archivo = f.Name,
                fecha = f.LastWriteTime,
                tamano_bytes = f.Length,
                tipo = h?.tipo ?? "Manual",
                existe = true
            });
        }

        // Registros del historial cuyo archivo ya no existe en disco (eliminado o migrado)
        var nombres = new HashSet<string>(archivos.Select(a => a.Name), StringComparer.OrdinalIgnoreCase);
        foreach (var h in historial.Where(h => !nombres.Contains(h.archivo)))
        {
            resultado.Add(new BackupDto
            {
                archivo = h.archivo,
                fecha = h.fecha,
                tamano_bytes = h.tamano_bytes,
                tipo = h.tipo,
                existe = false
            });
        }

        return resultado.OrderByDescending(b => b.fecha).ToList();
    }

    private sealed record HistorialRow(string archivo, string tipo, DateTime fecha, long tamano_bytes);

    private async Task<List<HistorialRow>> LeerHistorialAsync()
    {
        var filas = new List<HistorialRow>();
        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "EXEC sp_Backup_ObtenerHistorial";
        await using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
            filas.Add(new HistorialRow(r.GetString(0), r.GetString(1), r.GetDateTime(2), r.GetInt64(3)));
        return filas;
    }

    private async Task RegistrarHistorialAsync(string archivo, string tipo, long tamano, int? idUsuario, string resultadoReg)
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "EXEC sp_Backup_RegistrarHistorial @archivo = @a, @tipo = @t, @tamano_bytes = @s, @usuario_id = @u, @resultado = @r";
        cmd.Parameters.Add("@a", SqlDbType.NVarChar, 260).Value = archivo;
        cmd.Parameters.Add("@t", SqlDbType.VarChar, 12).Value = tipo;
        cmd.Parameters.Add("@s", SqlDbType.BigInt).Value = tamano;
        cmd.Parameters.Add("@u", SqlDbType.Int).Value = (object?)idUsuario ?? DBNull.Value;
        cmd.Parameters.Add("@r", SqlDbType.VarChar, 20).Value = resultadoReg;
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<BackupDto> CrearAsync(int? idUsuario, string tipo = "Manual")
    {
        var dir = DirectorioBackups();
        var nombre = $"anadesa_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
        var ruta = Path.Combine(dir, nombre);
        var db = NombreBaseDeDatos();

        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandTimeout = 300;
        cmd.CommandText = $"BACKUP DATABASE [{db.Replace("]", "]]")}] TO DISK = @ruta WITH INIT, FORMAT, STATS = 10;";
        cmd.Parameters.Add("@ruta", SqlDbType.NVarChar, 400).Value = ruta;

        await cmd.ExecuteNonQueryAsync();

        var info = new FileInfo(ruta);
        if (!info.Exists || info.Length == 0)
            throw new InvalidOperationException("El backup no se creó en el servidor.");

        await RegistrarHistorialAsync(nombre, tipo, info.Length, idUsuario, "Exitoso");

        _logger.LogInformation("Backup creado: {Archivo} ({Tamano} bytes) tipo {Tipo} por usuario {Usuario}",
            nombre, info.Length, tipo, idUsuario?.ToString() ?? "sistema");

        return new BackupDto { archivo = nombre, fecha = info.LastWriteTime, tamano_bytes = info.Length, tipo = tipo, existe = true };
    }

    public FileStream AbrirArchivo(string archivo)
    {
        var nombre = ValidarNombre(archivo);
        var ruta = Path.Combine(DirectorioBackups(), nombre);
        if (!File.Exists(ruta))
            throw new FileNotFoundException("La copia de seguridad no existe.", nombre);
        return new FileStream(ruta, FileMode.Open, FileAccess.Read, FileShare.Read);
    }

    /// <summary>Tamaño máximo para cargar un respaldo desde el equipo del usuario.</summary>
    public const long MaxCargaBytes = 1_073_741_824; // 1 GB

    /// <summary>
    /// Recibe un archivo .bak desde el navegador (recuperación si el servidor cae),
    /// valida firma SQL Server y lo guarda en la carpeta Backups con nombre seguro.
    /// </summary>
    public async Task<BackupDto> CargarAsync(IFormFile? archivo, int? idUsuario)
    {
        if (archivo is null || archivo.Length == 0)
            throw new InvalidOperationException("Debe seleccionar un archivo .bak.");
        if (archivo.Length > MaxCargaBytes)
            throw new InvalidOperationException("El archivo supera el tamaño máximo de 1 GB.");

        var original = Path.GetFileName(archivo.FileName ?? string.Empty);
        if (!original.EndsWith(".bak", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("El archivo debe tener extensión .bak.");
        if (archivo.Length < 1024)
            throw new InvalidOperationException("El archivo no parece un respaldo de SQL Server válido.");

        // Nombre seguro sin colisiones
        var baseNombre = new string(Path.GetFileNameWithoutExtension(original)
            .Where(c => c != '.' && Array.IndexOf(Path.GetInvalidFileNameChars(), c) < 0)
            .ToArray()).Trim('_');
        if (string.IsNullOrWhiteSpace(baseNombre))
            baseNombre = "respaldo_cargado";
        var nombre = baseNombre + ".bak";
        var contador = 2;
        while (File.Exists(Path.Combine(DirectorioBackups(), nombre)))
            nombre = $"{baseNombre}_{contador++}.bak";

        var ruta = Path.Combine(DirectorioBackups(), nombre);
        await using (var salida = new FileStream(ruta, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await archivo.CopyToAsync(salida);
        }

        // Validación de firma: un respaldo nativo de SQL Server inicia con "TAPE" (o cabecera 0x01)
        var valido = false;
        await using (var lector = File.OpenRead(ruta))
        {
            var magic = new byte[4];
            var leidos = await lector.ReadAsync(magic, 0, 4);
            valido = leidos == 4 &&
                     (magic[0] == (byte)'T' && magic[1] == (byte)'A' && magic[2] == (byte)'P' && magic[3] == (byte)'E' ||
                      magic[0] == 0x01 && magic[1] == 0x00 && magic[2] == 0x00 && magic[3] == 0x00);
        }
        if (!valido)
        {
            File.Delete(ruta);
            throw new InvalidOperationException("El archivo no es un respaldo válido de SQL Server (firma incorrecta).");
        }

        var info = new FileInfo(ruta);
        await RegistrarHistorialAsync(nombre, "Cargado", info.Length, idUsuario, "Exitoso");
        _logger.LogInformation("Respaldo cargado desde el cliente: {Archivo} ({Tamano} bytes) por usuario {Usuario}",
            nombre, info.Length, idUsuario?.ToString() ?? "desconocido");

        return new BackupDto { archivo = nombre, fecha = info.LastWriteTime, tamano_bytes = info.Length, tipo = "Cargado", existe = true };
    }

    public void Eliminar(string archivo)
    {
        var nombre = ValidarNombre(archivo);
        var ruta = Path.Combine(DirectorioBackups(), nombre);
        if (!File.Exists(ruta))
            throw new FileNotFoundException("La copia de seguridad no existe.", nombre);
        File.Delete(ruta);
        _logger.LogInformation("Backup eliminado: {Archivo}", nombre);
    }

    public async Task RestaurarAsync(string archivo)
    {
        var nombre = ValidarNombre(archivo);
        var ruta = Path.Combine(DirectorioBackups(), nombre);
        if (!File.Exists(ruta))
            throw new FileNotFoundException("La copia de seguridad no existe.", nombre);

        var db = NombreBaseDeDatos().Replace("]", "]]");
        var csb = new SqlConnectionStringBuilder(_config.GetConnectionString("DefaultConnection"))
        {
            InitialCatalog = "master"
        };

        using var conn = new SqlConnection(csb.ConnectionString);
        await conn.OpenAsync();

        try
        {
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandTimeout = 120;
                cmd.CommandText = $"ALTER DATABASE [{db}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;";
                await cmd.ExecuteNonQueryAsync();
            }

            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandTimeout = 600;
                cmd.CommandText = $"RESTORE DATABASE [{db}] FROM DISK = @ruta WITH REPLACE, RECOVERY;";
                cmd.Parameters.Add("@ruta", SqlDbType.NVarChar, 400).Value = ruta;
                await cmd.ExecuteNonQueryAsync();
            }
        }
        finally
        {
            try
            {
                await using var cmd = conn.CreateCommand();
                cmd.CommandTimeout = 60;
                cmd.CommandText = $"ALTER DATABASE [{db}] SET MULTI_USER;";
                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo volver a MULTI_USER tras la restauración");
            }
        }

        _logger.LogInformation("Backup restaurado: {Archivo}", nombre);
    }

    // ===== Configuración de respaldo automático =====

    private static readonly string[] IntervalosValidos = { "horario", "diario", "semanal", "mensual", "anual" };

    public async Task<BackupConfigDto?> ObtenerConfigAsync()
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "EXEC sp_Backup_ObtenerConfig";
        await using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return null;
        return new BackupConfigDto
        {
            activo = r.GetBoolean(0),
            intervalo = r.GetString(1),
            hora = r.GetString(2),
            proxima_ejecucion = r.IsDBNull(3) ? null : r.GetDateTime(3),
            ultimo_respaldo = r.IsDBNull(4) ? null : r.GetDateTime(4),
            actualizado_en = r.IsDBNull(5) ? null : r.GetDateTime(5)
        };
    }

    public async Task<BackupConfigDto> GuardarConfigAsync(GuardarBackupConfigDto dto, int? idUsuario)
    {
        var intervalo = (dto.intervalo ?? string.Empty).Trim().ToLowerInvariant();
        if (!IntervalosValidos.Contains(intervalo))
            throw new InvalidOperationException("La frecuencia no es válida. Use horario, diario, semanal, mensual o anual.");
        if (!Regex.IsMatch(dto.hora ?? string.Empty, @"^([01]\d|2[0-3]):[0-5]\d$"))
            throw new InvalidOperationException("La hora debe tener el formato HH:mm.");
        if (!dto.activo && string.IsNullOrEmpty(dto.hora)) { /* hora se conserva igualmente */ }

        var proxima = dto.activo ? CalcularProxima(intervalo, dto.hora, DateTime.Now) : (DateTime?)null;

        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "EXEC sp_Backup_GuardarConfig @activo = @a, @intervalo = @i, @hora = @h, @proxima_ejecucion = @p, @usuario_id = @u";
        cmd.Parameters.Add("@a", SqlDbType.Bit).Value = dto.activo;
        cmd.Parameters.Add("@i", SqlDbType.VarChar, 10).Value = intervalo;
        cmd.Parameters.Add("@h", SqlDbType.VarChar, 5).Value = dto.hora;
        cmd.Parameters.Add("@p", SqlDbType.DateTime2).Value = (object?)proxima ?? DBNull.Value;
        cmd.Parameters.Add("@u", SqlDbType.Int).Value = (object?)idUsuario ?? DBNull.Value;
        await cmd.ExecuteNonQueryAsync();

        _logger.LogInformation("Configuración de respaldo automático actualizada: activo={Activo} intervalo={Intervalo} hora={Hora} próxima={Proxima}",
            dto.activo, intervalo, dto.hora, proxima);

        return (await ObtenerConfigAsync())!;
    }

    /// <summary>Calcula la próxima ejecución según frecuencia y hora.</summary>
    public static DateTime CalcularProxima(string intervalo, string hora, DateTime ahora)
    {
        var partes = hora.Split(':');
        var h = int.Parse(partes[0]);
        var m = int.Parse(partes[1]);

        switch (intervalo)
        {
            case "horario":
                return new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, m, 0).AddHours(1);
            case "diario":
            {
                var d = ahora.Date.AddHours(h).AddMinutes(m);
                return d > ahora ? d : d.AddDays(1);
            }
            case "semanal":
            {
                var d = ahora.Date.AddHours(h).AddMinutes(m);
                while (d <= ahora) d = d.AddDays(7);
                return d;
            }
            case "mensual":
            {
                var d = ahora.Date.AddHours(h).AddMinutes(m);
                while (d <= ahora) d = d.AddMonths(1);
                return d;
            }
            case "anual":
            {
                var d = ahora.Date.AddHours(h).AddMinutes(m);
                while (d <= ahora) d = d.AddYears(1);
                return d;
            }
            default:
                return ahora.AddHours(1);
        }
    }

    /// <summary>Tras una ejecución (automática, exitosa o no) actualiza último respaldo y calcula la siguiente.</summary>
    public async Task MarcarEjecucionAsync(bool exito)
    {
        var cfg = await ObtenerConfigAsync();
        if (cfg is null) return;

        var ahora = DateTime.Now;
        var proxima = cfg.activo ? CalcularProxima(cfg.intervalo, cfg.hora, ahora) : (DateTime?)null;

        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "EXEC sp_Backup_MarcarEjecucion @proxima_ejecucion = @p, @exito = @e";
        cmd.Parameters.Add("@p", SqlDbType.DateTime2).Value = (object?)proxima ?? DBNull.Value;
        cmd.Parameters.Add("@e", SqlDbType.Bit).Value = exito;
        await cmd.ExecuteNonQueryAsync();
    }
}
