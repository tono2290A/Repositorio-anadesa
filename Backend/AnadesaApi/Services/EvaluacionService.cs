using System.Data;
using System.Data.SqlClient;
using System.Text.Json;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class EvaluacionService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EvaluacionService> _logger;

    public EvaluacionService(IConfiguration config, ILogger<EvaluacionService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    private static SqlCommand Sp(SqlConnection conn, string nombre)
    {
        var cmd = conn.CreateCommand();
        cmd.CommandTimeout = 25;
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
        if (msg.Contains("CK_evaluacion_tipo"))
            return "El tipo de evaluacion no es valido.";
        if (msg.Contains("FK_"))
            return "No se puede realizar la operacion porque el registro tiene datos relacionados.";
        if (msg.Contains("String or binary data would be truncated") || msg.Contains("binary data would be truncated"))
            return "Uno de los campos supera la longitud permitida.";
        return msg.Replace("The DELETE statement conflicted with the REFERENCE constraint",
                           "No se puede eliminar: existen registros relacionados.");
    }

    private ResultadoEvaluacion Falla(Exception ex, ILogger logger, string operacion)
    {
        logger.LogError(ex, "Evaluacion - {Operacion}", operacion);
        var mensaje = ex is SqlException sqlEx
            ? LimpiarError(sqlEx)
            : "No se pudo completar la operacion. Intente de nuevo.";
        return new ResultadoEvaluacion { ok = false, mensaje = mensaje };
    }

    /* ------------------------------- LECTURAS ------------------------------- */

    public async Task<List<EvaluacionDto>> ObtenerTodosAsync(string? programa)
    {
        var list = new List<EvaluacionDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_ObtenerTodos");
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapEvaluacion(r));
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Evaluacion - ObtenerTodos");
            return list;
        }
    }

    public async Task<List<EvaluacionDto>> ObtenerPorParticipanteAsync(int idParticipante)
    {
        var list = new List<EvaluacionDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_ObtenerPorParticipante");
            cmd.Parameters.Add("@id_participante", SqlDbType.Int).Value = idParticipante;
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync()) list.Add(MapEvaluacion(r));
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Evaluacion - ObtenerPorParticipante {Id}", idParticipante);
            return list;
        }
    }

    public async Task<EvaluacionDto?> ObtenerPorIdAsync(int id)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_ObtenerPorId");
            cmd.Parameters.Add("@id_evaluacion", SqlDbType.Int).Value = id;

            EvaluacionDto? dto = null;
            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync()) dto = MapEvaluacion(r);

            if (dto != null && await r.NextResultAsync())
            {
                while (await r.ReadAsync())
                {
                    dto.detalle.Add(new DetalleEvaluacionDto
                    {
                        id_resultado = r.GetInt32(r.GetOrdinal("id_resultado")),
                        id_criterio = r.GetInt32(r.GetOrdinal("id_criterio")),
                        criterio = r.GetString(r.GetOrdinal("criterio")),
                        puntuacion = r.IsDBNull(r.GetOrdinal("puntuacion")) ? null : r.GetDecimal(r.GetOrdinal("puntuacion")),
                        resultado = r.GetString(r.GetOrdinal("resultado")),
                        observaciones = r.GetString(r.GetOrdinal("observaciones"))
                    });
                }
            }
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Evaluacion - ObtenerPorId {Id}", id);
            return null;
        }
    }

    private static EvaluacionDto MapEvaluacion(SqlDataReader r) => new()
    {
        id_evaluacion = r.GetInt32(r.GetOrdinal("id_evaluacion")),
        id_participante = r.GetInt32(r.GetOrdinal("id_participante")),
        participante = r.GetString(r.GetOrdinal("participante")),
        fecha = r.GetString(r.GetOrdinal("fecha")),
        programa = r.GetString(r.GetOrdinal("programa")),
        tipo_evaluacion = r.GetString(r.GetOrdinal("tipo_evaluacion")),
        resultado_general = r.GetString(r.GetOrdinal("resultado_general")),
        observaciones = r.GetString(r.GetOrdinal("observaciones")),
        estado = r.GetString(r.GetOrdinal("estado")),
        nivel = r.IsDBNull(r.GetOrdinal("nivel")) ? null : r.GetInt32(r.GetOrdinal("nivel")),
        nivel_texto = r.GetString(r.GetOrdinal("nivel_texto")),
        promedio = r.GetDecimal(r.GetOrdinal("promedio")),
        criterios = r.GetInt32(r.GetOrdinal("criterios")),
        evaluado_por = r.GetString(r.GetOrdinal("evaluado_por")),
        id_grupo = r.GetInt32(r.GetOrdinal("id_grupo")),
        grupo = r.GetString(r.GetOrdinal("grupo")),
        id_programacion = r.GetInt32(r.GetOrdinal("id_programacion")),
        actividad = r.GetString(r.GetOrdinal("actividad")),
        origen = ColumnaExiste(r, "origen") ? r.GetString(r.GetOrdinal("origen")) : "Individual"
    };

    private static bool ColumnaExiste(SqlDataReader r, string columna)
    {
        for (var i = 0; i < r.FieldCount; i++)
            if (string.Equals(r.GetName(i), columna, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    public async Task<List<ParticipanteEvaluacionDto>> ObtenerParticipantesAsync(
        int? idPrograma, int? idCategoria, int? idGrupo, int? idProgramacion, string? programa)
    {
        var list = new List<ParticipanteEvaluacionDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_Participantes");
            PInt(cmd, "@id_programa", idPrograma);
            PInt(cmd, "@id_categoria", idCategoria);
            PInt(cmd, "@id_grupo", idGrupo);
            PInt(cmd, "@id_programacion", idProgramacion);
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new ParticipanteEvaluacionDto
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
            _logger.LogError(ex, "Evaluacion - ObtenerParticipantes");
            return list;
        }
    }

    public async Task<List<GrupoEvaluacionDto>> ObtenerGruposAsync(string? programa)
    {
        var list = new List<GrupoEvaluacionDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_ObtenerGrupos");
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new GrupoEvaluacionDto
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
            _logger.LogError(ex, "Evaluacion - ObtenerGrupos");
            return list;
        }
    }

    public async Task<List<ActividadEvaluacionDto>> ObtenerActividadesAsync(string? programa)
    {
        var list = new List<ActividadEvaluacionDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_ObtenerActividades");
            PStr(cmd, "@programa", programa, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new ActividadEvaluacionDto
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
            _logger.LogError(ex, "Evaluacion - ObtenerActividades");
            return list;
        }
    }

    public async Task<List<CriterioEvaluacionDto>> ObtenerCriteriosAsync(string? tipoPrograma)
    {
        var list = new List<CriterioEvaluacionDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_ObtenerCriterios");
            PStr(cmd, "@tipo_programa", tipoPrograma, 50);
            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                list.Add(new CriterioEvaluacionDto
                {
                    id_criterio = r.GetInt32(r.GetOrdinal("id_criterio")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    descripcion = r.GetString(r.GetOrdinal("descripcion")),
                    tipo_programa = r.GetString(r.GetOrdinal("tipo_programa")),
                    puntuacion_maxima = r.GetDecimal(r.GetOrdinal("puntuacion_maxima"))
                });
            }
            return list;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Evaluacion - ObtenerCriterios");
            return list;
        }
    }

    /* ------------------------------- ESCRITURAS ----------------------------- */

    public async Task<ResultadoEvaluacion> CrearAsync(CrearEvaluacionRequest req, int idUsuario, string? programa)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_Crear");
            cmd.Parameters.Add("@id_participante", SqlDbType.Int).Value = req.id_participante;
            PStr(cmd, "@fecha", req.fecha, 10);
            PStr(cmd, "@tipo_evaluacion", req.tipo_evaluacion, 50);
            PInt(cmd, "@id_programacion", req.id_programacion);
            PInt(cmd, "@id_grupo", req.id_grupo);
            PInt(cmd, "@nivel", req.nivel);
            PStr(cmd, "@resultado", req.resultado, 500);
            PStr(cmd, "@observaciones", req.observaciones, 500);
            PInt(cmd, "@id_usuario", idUsuario);
            PStr(cmd, "@programa", programa, 50);

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new ResultadoEvaluacion
                {
                    ok = true,
                    id = r.GetInt32(r.GetOrdinal("id_evaluacion")),
                    mensaje = "Evaluacion registrada correctamente."
                };
            }
            return new ResultadoEvaluacion { ok = false, mensaje = "No se pudo registrar la evaluacion." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "Crear");
        }
    }

    public async Task<ResultadoEvaluacion> ActualizarAsync(int id, ActualizarEvaluacionRequest req, string? programa)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_Actualizar");
            cmd.Parameters.Add("@id_evaluacion", SqlDbType.Int).Value = id;
            cmd.Parameters.Add("@id_participante", SqlDbType.Int).Value = req.id_participante;
            PStr(cmd, "@fecha", req.fecha, 10);
            PStr(cmd, "@tipo_evaluacion", req.tipo_evaluacion, 50);
            PInt(cmd, "@id_programacion", req.id_programacion);
            PInt(cmd, "@id_grupo", req.id_grupo);
            PInt(cmd, "@nivel", req.nivel);
            PStr(cmd, "@resultado", req.resultado, 500);
            PStr(cmd, "@observaciones", req.observaciones, 500);
            PStr(cmd, "@programa", programa, 50);

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new ResultadoEvaluacion { ok = true, id = id, mensaje = "Evaluacion actualizada correctamente." };
            }
            return new ResultadoEvaluacion { ok = false, mensaje = "No se pudo actualizar la evaluacion." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "Actualizar");
        }
    }

    public async Task<ResultadoEvaluacion> EliminarAsync(int id)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_Eliminar");
            cmd.Parameters.Add("@id_evaluacion", SqlDbType.Int).Value = id;

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new ResultadoEvaluacion { ok = true, id = id, mensaje = "Evaluacion eliminada." };
            }
            return new ResultadoEvaluacion { ok = false, mensaje = "No se pudo eliminar la evaluacion." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "Eliminar");
        }
    }

    public async Task<ResultadoEvaluacion> CrearLoteAsync(CrearLoteEvaluacionRequest req, int idUsuario, string? programa)
    {
        try
        {
            if (req.participantes == null || req.participantes.Count == 0)
                return new ResultadoEvaluacion { ok = false, mensaje = "Debe seleccionar al menos un participante." };

            var filas = req.participantes
                .GroupBy(p => p.id_participante)
                .Select(g => g.First())
                .Select(p => new
                {
                    id_participante = p.id_participante,
                    nivel = p.nivel,
                    resultado = p.resultado,
                    observaciones = p.observaciones
                });
            var json = JsonSerializer.Serialize(filas);

            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = Sp(conn, "sp_Evaluacion_CrearLote");
            var pJson = cmd.Parameters.Add("@filas", SqlDbType.NVarChar, -1);
            pJson.Value = json;
            PStr(cmd, "@fecha", req.fecha, 10);
            PStr(cmd, "@tipo_evaluacion", req.tipo_evaluacion, 50);
            PInt(cmd, "@id_programacion", req.id_programacion);
            PInt(cmd, "@id_grupo", req.id_grupo);
            PInt(cmd, "@id_usuario", idUsuario);
            PStr(cmd, "@programa", programa, 50);

            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                var creados = r.GetInt32(r.GetOrdinal("creados"));
                return new ResultadoEvaluacion
                {
                    ok = creados > 0,
                    creados = creados,
                    mensaje = creados > 0
                        ? $"{creados} evaluaciones guardadas correctamente."
                        : "No se creo ninguna evaluacion. Verifique los participantes seleccionados."
                };
            }
            return new ResultadoEvaluacion { ok = false, mensaje = "No se pudieron crear las evaluaciones." };
        }
        catch (Exception ex)
        {
            return Falla(ex, _logger, "CrearLote");
        }
    }
}
