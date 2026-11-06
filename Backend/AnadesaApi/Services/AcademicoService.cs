using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class AcademicoService
{
    private readonly IConfiguration _config;

    public AcademicoService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<List<InscripcionAcademicaDto>> ObtenerInscripcionesPorParticipanteAsync(int idParticipante)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_ObtenerInscripcionesPorParticipante";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_participante", idParticipante);
            using var r = cmd.ExecuteReader();
            var list = new List<InscripcionAcademicaDto>();
            while (r.Read())
            {
                list.Add(new InscripcionAcademicaDto
                {
                    id_inscripcion = r.GetInt32(r.GetOrdinal("id_inscripcion")),
                    id_participante = r.GetInt32(r.GetOrdinal("id_participante")),
                    id_grado = r.GetInt32(r.GetOrdinal("id_grado")),
                    id_ciclo = r.GetInt32(r.GetOrdinal("id_ciclo")),
                    fecha_inscripcion = r.GetDateTime(r.GetOrdinal("fecha_inscripcion")),
                    estado = r.GetString(r.GetOrdinal("estado")),
                    observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones")),
                    grado_nombre = r.IsDBNull(r.GetOrdinal("grado_nombre")) ? null : r.GetString(r.GetOrdinal("grado_nombre")),
                    ciclo_anio = r.IsDBNull(r.GetOrdinal("ciclo_anio")) ? null : r.GetInt32(r.GetOrdinal("ciclo_anio")).ToString(),
                    participante_nombre = r.IsDBNull(r.GetOrdinal("participante_nombre")) ? null : r.GetString(r.GetOrdinal("participante_nombre"))
                });
            }
            return list;
        });
    }

    public async Task<InscripcionAcademicaDto> CrearInscripcionAsync(CrearInscripcionRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_CrearInscripcion";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_participante", request.id_participante);
            cmd.Parameters.AddWithValue("@id_grado", request.id_grado);
            cmd.Parameters.AddWithValue("@id_ciclo", (object?)request.id_ciclo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@anio", (object?)request.anio ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@observaciones", (object?)request.observaciones ?? DBNull.Value);
            using var r = cmd.ExecuteReader();
            r.Read();
            return new InscripcionAcademicaDto
            {
                id_inscripcion = r.GetInt32(r.GetOrdinal("id_inscripcion")),
                id_participante = r.GetInt32(r.GetOrdinal("id_participante")),
                id_grado = r.GetInt32(r.GetOrdinal("id_grado")),
                id_ciclo = r.GetInt32(r.GetOrdinal("id_ciclo")),
                fecha_inscripcion = r.GetDateTime(r.GetOrdinal("fecha_inscripcion")),
                estado = r.GetString(r.GetOrdinal("estado")),
                observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones")),
                grado_nombre = r.IsDBNull(r.GetOrdinal("grado_nombre")) ? null : r.GetString(r.GetOrdinal("grado_nombre")),
                ciclo_anio = r.IsDBNull(r.GetOrdinal("ciclo_anio")) ? null : r.GetInt32(r.GetOrdinal("ciclo_anio")).ToString(),
                participante_nombre = r.IsDBNull(r.GetOrdinal("participante_nombre")) ? null : r.GetString(r.GetOrdinal("participante_nombre"))
            };
        });
    }

    public async Task<List<HistorialAcademicoDto>> ObtenerHistorialPorParticipanteAsync(int idParticipante)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_ObtenerHistorialPorParticipante";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_participante", idParticipante);
            using var r = cmd.ExecuteReader();
            var list = new List<HistorialAcademicoDto>();
            while (r.Read())
            {
                list.Add(new HistorialAcademicoDto
                {
                    id_historial = r.GetInt32(r.GetOrdinal("id_historial")),
                    id_participante = r.GetInt32(r.GetOrdinal("id_participante")),
                    id_grado = r.GetInt32(r.GetOrdinal("id_grado")),
                    id_ciclo = r.GetInt32(r.GetOrdinal("id_ciclo")),
                    promedio_final = r.IsDBNull(r.GetOrdinal("promedio_final")) ? null : r.GetDecimal(r.GetOrdinal("promedio_final")),
                    resultado = r.IsDBNull(r.GetOrdinal("resultado")) ? null : r.GetString(r.GetOrdinal("resultado")),
                    observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones")),
                    fecha_registro = r.GetDateTime(r.GetOrdinal("fecha_registro")),
                    grado_nombre = r.IsDBNull(r.GetOrdinal("grado_nombre")) ? null : r.GetString(r.GetOrdinal("grado_nombre")),
                    ciclo_anio = r.IsDBNull(r.GetOrdinal("ciclo_anio")) ? null : r.GetInt32(r.GetOrdinal("ciclo_anio")).ToString()
                });
            }
            return list;
        });
    }

    public async Task<HistorialAcademicoDto> CrearHistorialAsync(CrearHistorialRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_CrearHistorial";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_participante", request.id_participante);
            cmd.Parameters.AddWithValue("@id_grado", request.id_grado);
            cmd.Parameters.AddWithValue("@id_ciclo", request.id_ciclo);
            cmd.Parameters.AddWithValue("@promedio_final", (object?)request.promedio_final ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@resultado", (object?)request.resultado ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@observaciones", (object?)request.observaciones ?? DBNull.Value);
            using var r = cmd.ExecuteReader();
            r.Read();
            return new HistorialAcademicoDto
            {
                id_historial = r.GetInt32(r.GetOrdinal("id_historial")),
                id_participante = r.GetInt32(r.GetOrdinal("id_participante")),
                id_grado = r.GetInt32(r.GetOrdinal("id_grado")),
                id_ciclo = r.GetInt32(r.GetOrdinal("id_ciclo")),
                promedio_final = r.IsDBNull(r.GetOrdinal("promedio_final")) ? null : r.GetDecimal(r.GetOrdinal("promedio_final")),
                resultado = r.IsDBNull(r.GetOrdinal("resultado")) ? null : r.GetString(r.GetOrdinal("resultado")),
                observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones")),
                fecha_registro = r.GetDateTime(r.GetOrdinal("fecha_registro")),
                grado_nombre = r.IsDBNull(r.GetOrdinal("grado_nombre")) ? null : r.GetString(r.GetOrdinal("grado_nombre")),
                ciclo_anio = r.IsDBNull(r.GetOrdinal("ciclo_anio")) ? null : r.GetInt32(r.GetOrdinal("ciclo_anio")).ToString()
            };
        });
    }

    public async Task<List<PromedioDto>> ObtenerPromediosPorInscripcionAsync(int idInscripcion)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_ObtenerPromediosPorInscripcion";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_inscripcion", idInscripcion);
            using var r = cmd.ExecuteReader();
            var list = new List<PromedioDto>();
            while (r.Read())
            {
                list.Add(new PromedioDto
                {
                    id_promedio = r.GetInt32(r.GetOrdinal("id_promedio")),
                    id_inscripcion = r.GetInt32(r.GetOrdinal("id_inscripcion")),
                    id_bloque = r.GetInt32(r.GetOrdinal("id_bloque")),
                    promedio = r.GetDecimal(r.GetOrdinal("promedio")),
                    observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones")),
                    fecha_registro = r.GetDateTime(r.GetOrdinal("fecha_registro")),
                    bloque_nombre = r.IsDBNull(r.GetOrdinal("bloque_nombre")) ? null : r.GetString(r.GetOrdinal("bloque_nombre"))
                });
            }
            return list;
        });
    }

    public async Task<PromedioDto> CrearPromedioAsync(CrearPromedioRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_CrearPromedio";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@id_inscripcion", request.id_inscripcion);
            cmd.Parameters.AddWithValue("@id_bloque", request.id_bloque);
            cmd.Parameters.AddWithValue("@promedio", request.promedio);
            cmd.Parameters.AddWithValue("@observaciones", (object?)request.observaciones ?? DBNull.Value);
            using var r = cmd.ExecuteReader();
            r.Read();
            return new PromedioDto
            {
                id_promedio = r.GetInt32(r.GetOrdinal("id_promedio")),
                id_inscripcion = r.GetInt32(r.GetOrdinal("id_inscripcion")),
                id_bloque = r.GetInt32(r.GetOrdinal("id_bloque")),
                promedio = r.GetDecimal(r.GetOrdinal("promedio")),
                observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones")),
                fecha_registro = r.GetDateTime(r.GetOrdinal("fecha_registro")),
                bloque_nombre = r.IsDBNull(r.GetOrdinal("bloque_nombre")) ? null : r.GetString(r.GetOrdinal("bloque_nombre"))
            };
        });
    }

    public async Task<List<CicloEscolarDto>> ObtenerCiclosAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_ObtenerCiclos";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            using var r = cmd.ExecuteReader();
            var list = new List<CicloEscolarDto>();
            while (r.Read())
            {
                list.Add(new CicloEscolarDto
                {
                    id_ciclo = r.GetInt32(r.GetOrdinal("id_ciclo")),
                    anio = r.GetInt32(r.GetOrdinal("anio")),
                    fecha_inicio = r.IsDBNull(r.GetOrdinal("fecha_inicio")) ? null : r.GetDateTime(r.GetOrdinal("fecha_inicio")),
                    fecha_fin = r.IsDBNull(r.GetOrdinal("fecha_fin")) ? null : r.GetDateTime(r.GetOrdinal("fecha_fin")),
                    estado = r.GetBoolean(r.GetOrdinal("estado"))
                });
            }
            return list;
        });
    }

    public async Task<List<GradoDto>> ObtenerGradosAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_ObtenerGrados";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            using var r = cmd.ExecuteReader();
            var list = new List<GradoDto>();
            while (r.Read())
            {
                list.Add(new GradoDto
                {
                    id_grado = r.GetInt32(r.GetOrdinal("id_grado")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    nivel = r.IsDBNull(r.GetOrdinal("nivel")) ? null : r.GetString(r.GetOrdinal("nivel")),
                    descripcion = r.IsDBNull(r.GetOrdinal("descripcion")) ? null : r.GetString(r.GetOrdinal("descripcion")),
                    estado = r.GetBoolean(r.GetOrdinal("estado"))
                });
            }
            return list;
        });
    }

    public async Task<List<BloqueAcademicoDto>> ObtenerBloquesAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "sp_Academico_ObtenerBloques";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            using var r = cmd.ExecuteReader();
            var list = new List<BloqueAcademicoDto>();
            while (r.Read())
            {
                list.Add(new BloqueAcademicoDto
                {
                    id_bloque = r.GetInt32(r.GetOrdinal("id_bloque")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    numero_bloque = r.GetInt32(r.GetOrdinal("numero_bloque")),
                    descripcion = r.IsDBNull(r.GetOrdinal("descripcion")) ? null : r.GetString(r.GetOrdinal("descripcion")),
                    estado = r.GetBoolean(r.GetOrdinal("estado"))
                });
            }
            return list;
        });
    }
}
