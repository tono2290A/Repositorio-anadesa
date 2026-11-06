using System.Data;
using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class MonitoreoService
{
    private readonly IConfiguration _config;
    private readonly ILogger<MonitoreoService> _logger;

    public MonitoreoService(IConfiguration config, ILogger<MonitoreoService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    private static SqlCommand Sp(SqlConnection conn, string nombre)
    {
        var cmd = conn.CreateCommand();
        cmd.CommandTimeout = 20;
        cmd.CommandText = nombre;
        cmd.CommandType = CommandType.StoredProcedure;
        return cmd;
    }

    private static void PInt(SqlCommand cmd, string name, int? valor)
    {
        cmd.Parameters.Add(name, SqlDbType.Int).Value = valor.HasValue ? valor.Value : DBNull.Value;
    }

    private static void PStr(SqlCommand cmd, string name, string? valor, int size)
    {
        var p = cmd.Parameters.Add(name, SqlDbType.VarChar, size);
        p.Value = string.IsNullOrWhiteSpace(valor) ? DBNull.Value : valor;
    }

    private static string LimpiarError(SqlException ex)
    {
        var msg = ex.Message ?? "Error de base de datos";
        if (msg.Contains("CK_monitoreo_participacion"))
            return "El nivel de participacion no es valido.";
        if (msg.Contains("CK_monitoreo_tipo"))
            return "El tipo de monitoreo no es valido.";
        if (msg.Contains("FK_"))
            return "No se puede realizar la operacion porque el registro tiene datos relacionados.";
        if (msg.Contains("String or binary data would be truncated") || msg.Contains("binary data would be truncated"))
            return "Uno de los campos supera la longitud permitida.";
        return msg.Replace("The DELETE statement conflicted with the REFERENCE constraint", "No se puede eliminar: existen registros relacionados.");
    }

    private static ResultadoMonitoreo Falla(Exception ex, ILogger logger, string operacion)
    {
        logger.LogError(ex, "Monitoreo - {Operacion}", operacion);
        var mensaje = ex is SqlException sqlEx
            ? LimpiarError(sqlEx)
            : "No se pudo completar la operacion. Intente de nuevo.";
        return new ResultadoMonitoreo { ok = false, mensaje = mensaje };
    }

    /* ------------------------------- LECTURAS ------------------------------- */

    public async Task<List<MonitoreoDto>> ObtenerTodosAsync(string? programa)
    {
        var list = new List<MonitoreoDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_ObtenerTodos");
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapMonitoreo(r));
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Monitoreo - ObtenerTodos");
            return list;
        }
    }

    public async Task<MonitoreoDto?> ObtenerPorIdAsync(int id)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_ObtenerPorId");
            cmd.Parameters.Add("@id_monitoreo", SqlDbType.Int).Value = id;
            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync()) return MapMonitoreo(r);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Monitoreo - ObtenerPorId {Id}", id);
            return null;
        }
    }

    private static MonitoreoDto MapMonitoreo(SqlDataReader r) => new()
    {
        id_monitoreo = r.GetInt32(r.GetOrdinal("id_monitoreo")),
        id_participante = r.GetInt32(r.GetOrdinal("id_participante")),
        participante = r.GetString(r.GetOrdinal("participante")),
        fecha = r.GetString(r.GetOrdinal("fecha")),
        id_actividad = r.GetInt32(r.GetOrdinal("id_actividad")),
        actividad = r.GetString(r.GetOrdinal("actividad")),
        participacion = r.GetString(r.GetOrdinal("participacion")),
        observaciones = r.GetString(r.GetOrdinal("observaciones")),
        estado = r.GetString(r.GetOrdinal("estado")),
        registrado_por = r.GetString(r.GetOrdinal("registrado_por")),
        programa = r.GetString(r.GetOrdinal("programa")),
        tipo_monitoreo = r.GetString(r.GetOrdinal("tipo_monitoreo")),
        id_grupo = r.GetInt32(r.GetOrdinal("id_grupo")),
        grupo = r.GetString(r.GetOrdinal("grupo")),
        id_programacion = r.GetInt32(r.GetOrdinal("id_programacion"))
    };

    public async Task<List<ParticipanteMonitoreoDto>> ObtenerParticipantesAsync(
        int? idPrograma, int? idCategoria, int? idGrupo, int? idProgramacion, string? programa)
    {
        var list = new List<ParticipanteMonitoreoDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_Participantes");
            PInt(cmd, "@id_programa", idPrograma);
            PInt(cmd, "@id_categoria", idCategoria);
            PInt(cmd, "@id_grupo", idGrupo);
            PInt(cmd, "@id_programacion", idProgramacion);
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new ParticipanteMonitoreoDto
                {
                    id_participante = r.GetInt32(r.GetOrdinal("id_participante")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    programa = r.GetString(r.GetOrdinal("programa")),
                    categoria = r.GetString(r.GetOrdinal("categoria")),
                    dpi = r.GetString(r.GetOrdinal("dpi")),
                    viene_de_asistencia = r.GetInt32(r.GetOrdinal("viene_de_asistencia")) == 1
                });
            }
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Monitoreo - ObtenerParticipantes");
            return list;
        }
    }

    public async Task<AreasMonitoreoDto> ObtenerAreasAsync(string? programa)
    {
        var result = new AreasMonitoreoDto();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_ObtenerAreas");
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();

            while (await r.ReadAsync()) result.programas.Add(MapArea(r));
            if (await r.NextResultAsync())
            {
                while (await r.ReadAsync()) result.categorias.Add(MapArea(r));
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Monitoreo - ObtenerAreas");
            return result;
        }
    }

    private static AreaMonitoreoDto MapArea(SqlDataReader r) => new()
    {
        tipo = r.GetString(r.GetOrdinal("tipo")),
        id = r.GetInt32(r.GetOrdinal("id")),
        nombre = r.GetString(r.GetOrdinal("nombre")),
        programa = r.GetString(r.GetOrdinal("programa")),
        cantidad = r.GetInt32(r.GetOrdinal("cantidad"))
    };

    public async Task<List<GrupoMonitoreoDto>> ObtenerGruposAsync(string? programa)
    {
        var list = new List<GrupoMonitoreoDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_ObtenerGrupos");
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new GrupoMonitoreoDto
                {
                    id_grupo = r.GetInt32(r.GetOrdinal("id_grupo")),
                    id_programa = r.IsDBNull(r.GetOrdinal("id_programa")) ? null : r.GetInt32(r.GetOrdinal("id_programa")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    descripcion = r.GetString(r.GetOrdinal("descripcion")),
                    programa = r.GetString(r.GetOrdinal("programa")),
                    cantidad = r.GetInt32(r.GetOrdinal("cantidad"))
                });
            }
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Monitoreo - ObtenerGrupos");
            return list;
        }
    }

    public async Task<List<ActividadMonitoreoDto>> ObtenerActividadesAsync(string? programa)
    {
        var list = new List<ActividadMonitoreoDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_ObtenerActividades");
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new ActividadMonitoreoDto
                {
                    id_programacion = r.GetInt32(r.GetOrdinal("id_programacion")),
                    id_actividad = r.GetInt32(r.GetOrdinal("id_actividad")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    programa = r.GetString(r.GetOrdinal("programa")),
                    fecha = r.GetString(r.GetOrdinal("fecha")),
                    lugar = r.GetString(r.GetOrdinal("lugar")),
                    estado = r.GetString(r.GetOrdinal("estado")),
                    tipo_actividad = r.GetString(r.GetOrdinal("tipo_actividad")),
                    asignados = r.GetInt32(r.GetOrdinal("asignados"))
                });
            }
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Monitoreo - ObtenerActividades");
            return list;
        }
    }

    /* ------------------------------- ESCRITURAS ----------------------------- */

    public async Task<ResultadoMonitoreo> CrearAsync(CrearMonitoreoRequest req, int idUsuario, string? programa)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_Crear");
            cmd.Parameters.Add("@id_participante", SqlDbType.Int).Value = req.id_participante;
            PStr(cmd, "@fecha", req.fecha, 10);
            PInt(cmd, "@id_actividad", req.id_actividad);
            PInt(cmd, "@id_programacion", req.id_programacion);
            PStr(cmd, "@participacion", req.participacion, 20);
            PStr(cmd, "@observaciones", req.observaciones, 500);
            PStr(cmd, "@tipo_monitoreo", req.tipo_monitoreo, 30);
            PInt(cmd, "@id_grupo", req.id_grupo);
            PInt(cmd, "@id_usuario", idUsuario);
            PStr(cmd, "@programa", programa, 50);

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new ResultadoMonitoreo
                {
                    ok = true,
                    id = r.GetInt32(r.GetOrdinal("id_monitoreo")),
                    mensaje = "Monitoreo registrado correctamente."
                };
            }
            return new ResultadoMonitoreo { ok = false, mensaje = "No se pudo registrar el monitoreo." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "Crear");
        }
    }

    public async Task<ResultadoMonitoreo> ActualizarAsync(int id, ActualizarMonitoreoRequest req, string? programa)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_Actualizar");
            cmd.Parameters.Add("@id_monitoreo", SqlDbType.Int).Value = id;
            cmd.Parameters.Add("@id_participante", SqlDbType.Int).Value = req.id_participante;
            PStr(cmd, "@fecha", req.fecha, 10);
            PInt(cmd, "@id_actividad", req.id_actividad);
            PInt(cmd, "@id_programacion", req.id_programacion);
            PStr(cmd, "@participacion", req.participacion, 20);
            PStr(cmd, "@observaciones", req.observaciones, 500);
            PStr(cmd, "@tipo_monitoreo", req.tipo_monitoreo, 30);
            PInt(cmd, "@id_grupo", req.id_grupo);
            PStr(cmd, "@programa", programa, 50);

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new ResultadoMonitoreo { ok = true, id = id, mensaje = "Registro de monitoreo actualizado." };
            }
            return new ResultadoMonitoreo { ok = false, mensaje = "No se pudo actualizar el registro." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "Actualizar");
        }
    }

    public async Task<ResultadoMonitoreo> EliminarAsync(int id)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_Eliminar");
            cmd.Parameters.Add("@id_monitoreo", SqlDbType.Int).Value = id;

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new ResultadoMonitoreo { ok = true, id = id, mensaje = "Registro de monitoreo eliminado." };
            }
            return new ResultadoMonitoreo { ok = false, mensaje = "No se pudo eliminar el registro." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "Eliminar");
        }
    }

    public async Task<ResultadoMonitoreo> CrearLoteAsync(CrearLoteMonitoreoRequest req, int idUsuario, string? programa)
    {
        try
        {
            if (req.participantes == null || req.participantes.Count == 0)
                return new ResultadoMonitoreo { ok = false, mensaje = "Debe seleccionar al menos un participante." };

            var csv = string.Join(",", req.participantes.Distinct());

            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Monitoreo_CrearLote");
            PStr(cmd, "@ids_participantes", csv, 4000);
            PStr(cmd, "@fecha", req.fecha, 10);
            PInt(cmd, "@id_actividad", req.id_actividad);
            PInt(cmd, "@id_programacion", req.id_programacion);
            PStr(cmd, "@participacion", req.participacion, 20);
            PStr(cmd, "@observaciones", req.observaciones, 500);
            PStr(cmd, "@tipo_monitoreo", req.tipo_monitoreo, 30);
            PInt(cmd, "@id_grupo", req.id_grupo);
            PInt(cmd, "@id_usuario", idUsuario);
            PStr(cmd, "@programa", programa, 50);

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                var creados = r.GetInt32(r.GetOrdinal("creados"));
                return new ResultadoMonitoreo
                {
                    ok = creados > 0,
                    creados = creados,
                    mensaje = creados > 0
                        ? $"{creados} registros de monitoreo guardados."
                        : "No se creo ningun registro. Verifique los participantes seleccionados."
                };
            }
            return new ResultadoMonitoreo { ok = false, mensaje = "No se pudieron crear los registros." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "CrearLote");
        }
    }
}
