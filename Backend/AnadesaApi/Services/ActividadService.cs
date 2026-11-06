using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class ActividadService
{
    private readonly IConfiguration _config;

    public ActividadService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    private static SqlCommand CreateCommand(SqlConnection conn, System.Data.Common.DbTransaction? tx = null)
    {
        var cmd = conn.CreateCommand();
        cmd.CommandTimeout = 15;
        if (tx != null) cmd.Transaction = (SqlTransaction)tx;
        return cmd;
    }

    public async Task<List<ActividadDto>> ObtenerTodasAsync()
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "sp_Actividades_ObtenerTodas";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            await using var r = await cmd.ExecuteReaderAsync();
            var list = new List<ActividadDto>();
            int oIdAct = r.GetOrdinal("id_actividad"), oIdProg = r.GetOrdinal("id_programacion"),
                oIdP = r.GetOrdinal("id_programa"), oIdT = r.GetOrdinal("id_tipo_actividad"),
                oNom = r.GetOrdinal("nombre"), oDesc = r.GetOrdinal("descripcion"),
                oObj = r.GetOrdinal("objetivo"), oProg = r.GetOrdinal("programa"),
                oTipo = r.GetOrdinal("tipo_actividad"), oFecha = r.GetOrdinal("fecha"),
                oHora = r.GetOrdinal("hora"), oHoraFin = r.GetOrdinal("hora_fin"),
                oLugar = r.GetOrdinal("lugar"), oEst = r.GetOrdinal("estado"),
                oObs = r.GetOrdinal("observaciones"), oCant = r.GetOrdinal("cantidad_planificada"),
                oFC = r.GetOrdinal("fecha_creacion"), oEA = r.GetOrdinal("estado_activo"),
                oTot = r.GetOrdinal("totalParticipantes"), oResp = r.GetOrdinal("responsable"),
                oMod = r.GetOrdinal("modalidad");
            while (await r.ReadAsync())
            {
                list.Add(new ActividadDto
                {
                    id_actividad = r.GetInt32(oIdAct),
                    id_programacion = r.GetInt32(oIdProg),
                    id_programa = r.GetInt32(oIdP),
                    id_tipo_actividad = r.GetInt32(oIdT),
                    nombre = r.GetString(oNom),
                    descripcion = r.IsDBNull(oDesc) ? null : r.GetString(oDesc),
                    objetivo = r.IsDBNull(oObj) ? null : r.GetString(oObj),
                    programa = r.IsDBNull(oProg) ? null : r.GetString(oProg),
                    tipo_actividad = r.IsDBNull(oTipo) ? null : r.GetString(oTipo),
                    fecha = r.IsDBNull(oFecha) ? null : r.GetString(oFecha),
                    hora = r.IsDBNull(oHora) ? null : r.GetString(oHora),
                    hora_fin = r.IsDBNull(oHoraFin) ? null : r.GetString(oHoraFin),
                    lugar = r.IsDBNull(oLugar) ? null : r.GetString(oLugar),
                    estado = r.IsDBNull(oEst) ? null : r.GetString(oEst),
                    observaciones = r.IsDBNull(oObs) ? null : r.GetString(oObs),
                    cantidad_planificada = r.IsDBNull(oCant) ? null : r.GetInt32(oCant),
                    fecha_creacion = r.GetDateTime(oFC),
                    estado_activo = r.GetBoolean(oEA),
                    totalParticipantes = r.GetInt32(oTot),
                    responsable = r.IsDBNull(oResp) ? null : r.GetString(oResp),
                    modalidad = r.IsDBNull(oMod) ? null : r.GetString(oMod)
                });
            }
            return list;
        }
        catch (Exception)
        {
            return new List<ActividadDto>();
        }
    }

    public async Task<ActividadDto> CrearAsync(CrearActividadRequest request)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();

            int idActividad;
            int idProgramacion;
            await using (var cmd = CreateCommand(conn))
            {
                cmd.CommandText = @"EXEC sp_Actividades_Crear
                    @id_programa = @id_programa,
                    @id_tipo_actividad = @id_tipo_actividad,
                    @nombre = @nombre,
                    @descripcion = @descripcion,
                    @objetivo = @objetivo,
                    @modalidad = @modalidad,
                    @fecha = @fecha,
                    @hora = @hora,
                    @hora_fin = @hora_fin,
                    @lugar = @lugar,
                    @cantidad_planificada = @cantidad_planificada,
                    @observaciones = @observaciones,
                    @estado = @estado";
                cmd.Parameters.AddWithValue("@id_programa", request.id_programa);
                cmd.Parameters.AddWithValue("@id_tipo_actividad", request.id_tipo_actividad);
                cmd.Parameters.AddWithValue("@nombre", request.nombre);
                cmd.Parameters.AddWithValue("@descripcion", (object?)request.descripcion ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@objetivo", (object?)request.objetivo ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@modalidad", (object?)request.modalidad ?? "Grupal");
                cmd.Parameters.AddWithValue("@fecha", (object?)request.fecha ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@hora", (object?)request.hora ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@hora_fin", (object?)request.hora_fin ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@lugar", (object?)request.lugar ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@cantidad_planificada", (object?)request.cantidad_planificada ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@observaciones", (object?)request.observaciones ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@estado", request.estado ?? "Programada");
                await using var r = await cmd.ExecuteReaderAsync();
                if (!await r.ReadAsync())
                    return new ActividadDto { id_actividad = 0, id_programacion = 0 };
                idActividad = r.GetInt32(r.GetOrdinal("id_actividad"));
                idProgramacion = r.GetInt32(r.GetOrdinal("id_programacion"));
            }

            return await ObtenerPorIdAsync(idActividad, idProgramacion);
        }
        catch (Exception)
        {
            return new ActividadDto { id_actividad = 0, id_programacion = 0 };
        }
    }

    public async Task<ActividadDto?> ActualizarAsync(int idActividad, int idProgramacion, ActualizarActividadRequest request)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();

            int idProgramacionResult;
            await using (var cmd = CreateCommand(conn))
            {
                cmd.CommandText = @"EXEC sp_Actividades_Actualizar
                    @id_actividad = @id_actividad,
                    @id_programacion = @id_programacion,
                    @nombre = @nombre,
                    @descripcion = @descripcion,
                    @objetivo = @objetivo,
                    @id_programa = @id_programa,
                    @id_tipo_actividad = @id_tipo_actividad,
                    @modalidad = @modalidad,
                    @fecha = @fecha,
                    @hora = @hora,
                    @hora_fin = @hora_fin,
                    @lugar = @lugar,
                    @cantidad_planificada = @cantidad_planificada,
                    @observaciones = @observaciones,
                    @estado = @estado";
                cmd.Parameters.AddWithValue("@id_actividad", idActividad);
                cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
                cmd.Parameters.AddWithValue("@nombre", request.nombre);
                cmd.Parameters.AddWithValue("@descripcion", (object?)request.descripcion ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@objetivo", (object?)request.objetivo ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@id_programa", request.id_programa);
                cmd.Parameters.AddWithValue("@id_tipo_actividad", request.id_tipo_actividad);
                cmd.Parameters.AddWithValue("@modalidad", (object?)request.modalidad ?? "Grupal");
                cmd.Parameters.AddWithValue("@fecha", (object?)request.fecha ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@hora", (object?)request.hora ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@hora_fin", (object?)request.hora_fin ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@lugar", (object?)request.lugar ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@cantidad_planificada", (object?)request.cantidad_planificada ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@observaciones", (object?)request.observaciones ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@estado", request.estado ?? "Programada");
                await using var r = await cmd.ExecuteReaderAsync();
                if (!await r.ReadAsync())
                    return null;
                idProgramacionResult = r.GetInt32(r.GetOrdinal("id_programacion"));
            }

            return await ObtenerPorIdAsync(idActividad, idProgramacionResult);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<bool> EliminarAsync(int idActividad, int idProgramacion)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();

            await using var cmd = CreateCommand(conn);
            cmd.CommandText = @"EXEC sp_Actividades_Eliminar
                @id_actividad = @id_actividad,
                @id_programacion = @id_programacion";
            cmd.Parameters.AddWithValue("@id_actividad", idActividad);
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            var result = await cmd.ExecuteScalarAsync();
            return result != null && Convert.ToInt32(result) == 1;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<List<TipoActividadDto>> ObtenerTiposAsync()
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "sp_Actividades_ObtenerTipos";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            await using var r = await cmd.ExecuteReaderAsync();
            var list = new List<TipoActividadDto>();
            int oId = r.GetOrdinal("id_tipo_actividad"), oNom = r.GetOrdinal("nombre"),
                oDesc = r.GetOrdinal("descripcion"), oEst = r.GetOrdinal("estado");
            while (await r.ReadAsync())
            {
                list.Add(new TipoActividadDto
                {
                    id_tipo_actividad = r.GetInt32(oId),
                    nombre = r.GetString(oNom),
                    descripcion = r.IsDBNull(oDesc) ? null : r.GetString(oDesc),
                    estado = r.GetBoolean(oEst)
                });
            }
            return list;
        }
        catch (Exception)
        {
            return new List<TipoActividadDto>();
        }
    }

    public async Task<List<ProgramaDto>> ObtenerProgramasAsync()
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "sp_Actividades_ObtenerProgramas";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            await using var r = await cmd.ExecuteReaderAsync();
            var list = new List<ProgramaDto>();
            int oId = r.GetOrdinal("id_programa"), oNom = r.GetOrdinal("nombre"),
                oTipo = r.GetOrdinal("tipo_programa"), oEst = r.GetOrdinal("estado");
            while (await r.ReadAsync())
            {
                list.Add(new ProgramaDto
                {
                    id_programa = r.GetInt32(oId),
                    nombre = r.GetString(oNom),
                    tipo_programa = r.IsDBNull(oTipo) ? null : r.GetString(oTipo),
                    estado = r.GetBoolean(oEst)
                });
            }
            return list;
        }
        catch (Exception)
        {
            return new List<ProgramaDto>();
        }
    }

    private async Task<ActividadDto> ObtenerPorIdAsync(int idActividad, int idProgramacion)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "sp_Actividades_ObtenerPorId";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_actividad", idActividad);
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            await using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new ActividadDto
                {
                    id_actividad = r.GetInt32(r.GetOrdinal("id_actividad")),
                    id_programacion = r.GetInt32(r.GetOrdinal("id_programacion")),
                    id_programa = r.GetInt32(r.GetOrdinal("id_programa")),
                    id_tipo_actividad = r.GetInt32(r.GetOrdinal("id_tipo_actividad")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    descripcion = r.IsDBNull(r.GetOrdinal("descripcion")) ? null : r.GetString(r.GetOrdinal("descripcion")),
                    objetivo = r.IsDBNull(r.GetOrdinal("objetivo")) ? null : r.GetString(r.GetOrdinal("objetivo")),
                    programa = r.IsDBNull(r.GetOrdinal("programa")) ? null : r.GetString(r.GetOrdinal("programa")),
                    tipo_actividad = r.IsDBNull(r.GetOrdinal("tipo_actividad")) ? null : r.GetString(r.GetOrdinal("tipo_actividad")),
                    fecha = r.IsDBNull(r.GetOrdinal("fecha")) ? null : r.GetString(r.GetOrdinal("fecha")),
                    hora = r.IsDBNull(r.GetOrdinal("hora")) ? null : r.GetString(r.GetOrdinal("hora")),
                    hora_fin = r.IsDBNull(r.GetOrdinal("hora_fin")) ? null : r.GetString(r.GetOrdinal("hora_fin")),
                    lugar = r.IsDBNull(r.GetOrdinal("lugar")) ? null : r.GetString(r.GetOrdinal("lugar")),
                    estado = r.IsDBNull(r.GetOrdinal("estado")) ? null : r.GetString(r.GetOrdinal("estado")),
                    observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones")),
                    cantidad_planificada = r.IsDBNull(r.GetOrdinal("cantidad_planificada")) ? null : r.GetInt32(r.GetOrdinal("cantidad_planificada")),
                    fecha_creacion = r.GetDateTime(r.GetOrdinal("fecha_creacion")),
                    estado_activo = r.GetBoolean(r.GetOrdinal("estado_activo")),
                    totalParticipantes = r.GetInt32(r.GetOrdinal("totalParticipantes")),
                    modalidad = r.IsDBNull(r.GetOrdinal("modalidad")) ? null : r.GetString(r.GetOrdinal("modalidad"))
                };
            }
        }
        catch (Exception)
        {
        }
        return new ActividadDto { id_actividad = idActividad, id_programacion = idProgramacion };
    }

    public async Task<bool> ActualizarEstadoAsync(int idProgramacion, string estado)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "sp_Actividades_ActualizarEstado";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            cmd.Parameters.AddWithValue("@estado", estado);
            var result = await cmd.ExecuteScalarAsync();
            return result != null && Convert.ToInt32(result) == 1;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<List<ParticipanteAsignadoDto>> ObtenerParticipantesDisponiblesAsync(int idProgramacion)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "sp_Actividades_ParticipantesDisponibles";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            await using var r = await cmd.ExecuteReaderAsync();
            var list = new List<ParticipanteAsignadoDto>();
            int ordId = r.GetOrdinal("id_participante");
            int ordNombre = r.GetOrdinal("nombre");
            int ordDpi = r.GetOrdinal("dpi");
            int ordTel = r.GetOrdinal("telefono");
            int ordProg = r.GetOrdinal("programa");
            int ordCat = r.GetOrdinal("categoria");
            int ordPres = r.GetOrdinal("presente");
            while (await r.ReadAsync())
            {
                list.Add(new ParticipanteAsignadoDto
                {
                    id_participante = r.GetInt32(ordId),
                    nombre = r.GetString(ordNombre),
                    dpi = r.IsDBNull(ordDpi) ? null : r.GetString(ordDpi),
                    telefono = r.IsDBNull(ordTel) ? null : r.GetString(ordTel),
                    programa = r.IsDBNull(ordProg) ? null : r.GetString(ordProg),
                    categoria = r.IsDBNull(ordCat) ? null : r.GetString(ordCat),
                    presente = r.GetInt32(ordPres) == 1
                });
            }
            return list;
        }
        catch (Exception)
        {
            return new List<ParticipanteAsignadoDto>();
        }
    }

    public async Task<bool> AsignarParticipantesAsync(int idProgramacion, List<int> participantes)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "sp_Actividades_AsignarParticipantes";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            var ids = participantes.Distinct().ToList();
            cmd.Parameters.AddWithValue("@participantes", string.Join(",", ids));
            await cmd.ExecuteScalarAsync();
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<List<AsistenciaMarcaDto>> ObtenerAsistenciaAsync(int idProgramacion)
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();
        await using var cmd = CreateCommand(conn);
        cmd.CommandText = "EXEC sp_Asistencia_ObtenerPorProgramacion @id_programacion";
        cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
        await using var r = await cmd.ExecuteReaderAsync();
        var list = new List<AsistenciaMarcaDto>();
        int oId = r.GetOrdinal("id_participante"), oPres = r.GetOrdinal("presente"), oHora = r.GetOrdinal("hora_registro");
        while (await r.ReadAsync())
        {
            list.Add(new AsistenciaMarcaDto
            {
                id_participante = r.GetInt32(oId),
                presente = !r.IsDBNull(oPres) && r.GetBoolean(oPres),
                hora_registro = r.IsDBNull(oHora) ? null : r.GetTimeSpan(oHora).ToString(@"hh\:mm")
            });
        }
        return list;
    }

    public async Task<bool> MarcarAsistenciaAsync(int idProgramacion, int idParticipante, bool presente)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "EXEC sp_Asistencia_Marcar @id_programacion, @id_participante, @presente";
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            cmd.Parameters.AddWithValue("@id_participante", idParticipante);
            cmd.Parameters.AddWithValue("@presente", presente);
            await cmd.ExecuteNonQueryAsync();
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<List<FacilitadorDisponibleDto>> ObtenerFacilitadoresDisponiblesAsync(int idProgramacion)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "EXEC sp_Actividades_ObtenerFacilitadoresDisponibles @id_programacion = @id_programacion";
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            await using var r = await cmd.ExecuteReaderAsync();
            var list = new List<FacilitadorDisponibleDto>();
            int oId = r.GetOrdinal("id_usuario"), oNom = r.GetOrdinal("nombre"),
                oUsu = r.GetOrdinal("usuario"), oCor = r.GetOrdinal("correo"),
                oAsig = r.GetOrdinal("asignado");
            while (await r.ReadAsync())
            {
                list.Add(new FacilitadorDisponibleDto
                {
                    id_usuario = r.GetInt32(oId),
                    nombre = r.GetString(oNom),
                    usuario = r.IsDBNull(oUsu) ? null : r.GetString(oUsu),
                    correo = r.IsDBNull(oCor) ? null : r.GetString(oCor),
                    asignado = !r.IsDBNull(oAsig) && r.GetInt32(oAsig) == 1
                });
            }
            return list;
        }
        catch (Exception)
        {
            return new List<FacilitadorDisponibleDto>();
        }
    }

    public async Task<bool> ExisteProgramacionAsync(int idProgramacion)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = CreateCommand(conn);
            cmd.CommandText = "EXEC sp_Actividades_ExisteProgramacion @id_programacion = @id_programacion";
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<bool> AsignarFacilitadoresAsync(int idProgramacion, List<int> usuarios)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();

            await using var cmd = CreateCommand(conn);
            cmd.CommandText = @"EXEC sp_Actividades_AsignarFacilitadores
                @id_programacion = @id_programacion,
                @usuarios = @usuarios";
            cmd.Parameters.AddWithValue("@id_programacion", idProgramacion);
            var ids = usuarios.Distinct().ToList();
            cmd.Parameters.AddWithValue("@usuarios", string.Join(",", ids));
            var result = await cmd.ExecuteScalarAsync();
            return result != null && Convert.ToInt32(result) == 1;
        }
        catch (Exception)
        {
            return false;
        }
    }
}
