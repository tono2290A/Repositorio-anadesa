using System.Data;
using System.Data.SqlClient;
using System.Text.RegularExpressions;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

/// <summary>ConfiguraciÃ³n de apariencia del sistema: nombre, colores, logo,
/// imagen de inicio de sesiÃ³n y tamaÃ±o de fuente (fila Ãºnica id=1).</summary>
public class ConfiguracionService
{
    private readonly IConfiguration _config;
    private readonly ILogger<ConfiguracionService> _logger;

    private static readonly Regex HexColor = new(@"^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);
    private static readonly string[] TamanosValidos = { "chica", "mediana", "grande" };
    private const int MaxImagenBase64 = 4_000_000; // ~4 MB en caracteres
    // Color por defecto: verde actual del sidebar (sin cambios visibles al cargar).

    public ConfiguracionService(IConfiguration config, ILogger<ConfiguracionService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<AparienciaDto> ObtenerAparienciaAsync()
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "EXEC sp_Configuracion_ObtenerApariencia";
        await using var r = await cmd.ExecuteReaderAsync();
        if (await r.ReadAsync())
        {
            return new AparienciaDto
            {
                nombre_sistema = r.GetString(0),
                color_primario = r.GetString(1),
                color_acento = r.GetString(2),
                tamano_fuente = r.GetString(3),
                logo = r.IsDBNull(4) ? null : r.GetString(4),
                imagen_login = r.IsDBNull(5) ? null : r.GetString(5),
                actualizado_en = r.GetDateTime(6)
            };
        }
        return new AparienciaDto();
    }

    public async Task<AparienciaDto> GuardarAparienciaAsync(AparienciaDto dto, int idUsuario)
    {
        var nombre = (dto.nombre_sistema ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(nombre))
            throw new InvalidOperationException("El nombre mostrado en el sistema es requerido.");
        if (nombre.Length > 100)
            throw new InvalidOperationException("El nombre no puede superar los 100 caracteres.");

        var primario = (dto.color_primario ?? string.Empty).Trim();
        var acento = (dto.color_acento ?? string.Empty).Trim();
        if (!HexColor.IsMatch(primario))
            throw new InvalidOperationException("El color primario debe ser un color hexadecimal vÃ¡lido (#RRGGBB).");
        if (!HexColor.IsMatch(acento))
            throw new InvalidOperationException("El color de acento debe ser un color hexadecimal vÃ¡lido (#RRGGBB).");

        var tamano = (dto.tamano_fuente ?? string.Empty).Trim().ToLowerInvariant();
        if (!TamanosValidos.Contains(tamano))
            throw new InvalidOperationException("El tamaÃ±o de fuente debe ser chica, mediana o grande.");

        ValidarImagen(dto.logo, "logo");
        ValidarImagen(dto.imagen_login, "imagen de inicio de sesiÃ³n");

        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"EXEC sp_Configuracion_GuardarApariencia
            @nombre = @nombre,
            @primario = @primario,
            @acento = @acento,
            @tamano = @tamano,
            @logo = @logo,
            @imagen = @imagen,
            @usuario = @usuario";

        cmd.Parameters.Add("@nombre", SqlDbType.NVarChar, 100).Value = nombre;
        cmd.Parameters.Add("@primario", SqlDbType.NVarChar, 9).Value = primario.ToUpperInvariant();
        cmd.Parameters.Add("@acento", SqlDbType.NVarChar, 9).Value = acento.ToUpperInvariant();
        cmd.Parameters.Add("@tamano", SqlDbType.NVarChar, 10).Value = tamano;
        cmd.Parameters.Add("@logo", SqlDbType.NVarChar, -1).Value = (object?)dto.logo ?? DBNull.Value;
        cmd.Parameters.Add("@imagen", SqlDbType.NVarChar, -1).Value = (object?)dto.imagen_login ?? DBNull.Value;

        await cmd.ExecuteNonQueryAsync();
        _logger.LogInformation("Apariencia actualizada por usuario {Usuario}: {Nombre}", idUsuario, nombre);

        return await ObtenerAparienciaAsync();
    }

    private static void ValidarImagen(string? valor, string campo)
    {
        if (string.IsNullOrEmpty(valor)) return;
        if (!valor.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"La {campo} debe ser una imagen vÃ¡lida.");
        if (valor.Length > MaxImagenBase64)
            throw new InvalidOperationException($"La {campo} supera el tamaÃ±o mÃ¡ximo permitido (aprox. 3 MB).");
    }
}

