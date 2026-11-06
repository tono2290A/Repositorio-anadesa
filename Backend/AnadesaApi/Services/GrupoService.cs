using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class GrupoService
{
    private readonly IConfiguration _config;

    public GrupoService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<List<GrupoDto>> ObtenerTodosAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Grupo_ObtenerTodos";
            using var r = cmd.ExecuteReader();
            var list = new List<GrupoDto>();
            while (r.Read())
            {
                list.Add(new GrupoDto
                {
                    id_grupo = r.GetInt32(r.GetOrdinal("id_grupo")),
                    id_programa = r.GetInt32(r.GetOrdinal("id_programa")),
                    nombre = r.GetString(r.GetOrdinal("nombre")),
                    descripcion = r.IsDBNull(r.GetOrdinal("descripcion")) ? null : r.GetString(r.GetOrdinal("descripcion")),
                    estado = r.GetBoolean(r.GetOrdinal("estado")),
                    fecha_creacion = r.GetDateTime(r.GetOrdinal("fecha_creacion")),
                    programa_nombre = r.IsDBNull(r.GetOrdinal("programa_nombre")) ? null : r.GetString(r.GetOrdinal("programa_nombre")),
                    cantidad_participantes = r.GetInt32(r.GetOrdinal("cantidad_participantes"))
                });
            }
            return list;
        });
    }

    public async Task<GrupoDto?> ObtenerPorIdAsync(int id)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Grupo_ObtenerPorId @id";
            cmd.Parameters.AddWithValue("@id", id);
            using var r = cmd.ExecuteReader();
            if (!r.Read()) return null;

            var dto = new GrupoDto
            {
                id_grupo = r.GetInt32(r.GetOrdinal("id_grupo")),
                id_programa = r.GetInt32(r.GetOrdinal("id_programa")),
                nombre = r.GetString(r.GetOrdinal("nombre")),
                descripcion = r.IsDBNull(r.GetOrdinal("descripcion")) ? null : r.GetString(r.GetOrdinal("descripcion")),
                estado = r.GetBoolean(r.GetOrdinal("estado")),
                fecha_creacion = r.GetDateTime(r.GetOrdinal("fecha_creacion")),
                programa_nombre = r.IsDBNull(r.GetOrdinal("programa_nombre")) ? null : r.GetString(r.GetOrdinal("programa_nombre")),
                participantes = new List<GrupoParticipanteDto>()
            };

            r.Close();
            using var cmd2 = conn.CreateCommand();
            cmd2.CommandText = "EXEC sp_Grupo_ObtenerParticipantes @id_grupo";
            cmd2.Parameters.AddWithValue("@id_grupo", id);
            using var r2 = cmd2.ExecuteReader();
            while (r2.Read())
            {
                dto.participantes!.Add(new GrupoParticipanteDto
                {
                    id_grupo_participante = r2.GetInt32(r2.GetOrdinal("id_grupo_participante")),
                    id_grupo = r2.GetInt32(r2.GetOrdinal("id_grupo")),
                    id_participante = r2.GetInt32(r2.GetOrdinal("id_participante")),
                    participante_nombre = r2.GetString(r2.GetOrdinal("participante_nombre")),
                    fecha_ingreso = r2.GetDateTime(r2.GetOrdinal("fecha_ingreso")),
                    fecha_salida = r2.IsDBNull(r2.GetOrdinal("fecha_salida")) ? null : r2.GetDateTime(r2.GetOrdinal("fecha_salida")),
                    estado = r2.GetBoolean(r2.GetOrdinal("estado"))
                });
            }

            dto.cantidad_participantes = dto.participantes.Count(p => p.estado);
            return dto;
        });
    }

    public async Task<GrupoDto> CrearAsync(CrearGrupoRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Grupo_Crear @id_programa, @nombre, @descripcion, @estado";
            cmd.Parameters.AddWithValue("@id_programa", request.id_programa);
            cmd.Parameters.AddWithValue("@nombre", request.nombre);
            cmd.Parameters.AddWithValue("@descripcion", (object?)request.descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", request.estado);
            var newId = Convert.ToInt32(cmd.ExecuteScalar());

            return new GrupoDto
            {
                id_grupo = newId,
                id_programa = request.id_programa,
                nombre = request.nombre,
                descripcion = request.descripcion,
                estado = request.estado,
                fecha_creacion = DateTime.Now,
                cantidad_participantes = 0,
                participantes = new List<GrupoParticipanteDto>()
            };
        });
    }

    public async Task<GrupoDto?> ActualizarAsync(int id, ActualizarGrupoRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Grupo_Actualizar @id, @id_programa, @nombre, @descripcion, @estado";
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@id_programa", request.id_programa);
            cmd.Parameters.AddWithValue("@nombre", request.nombre);
            cmd.Parameters.AddWithValue("@descripcion", (object?)request.descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", request.estado);
            cmd.ExecuteNonQuery();
            return ObtenerPorIdAsync(id).Result;
        });
    }

    public async Task<bool> EliminarAsync(int id)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Grupo_Eliminar @id";
            cmd.Parameters.AddWithValue("@id", id);
            cmd.ExecuteNonQuery();
            return true;
        });
    }

    public async Task<GrupoParticipanteDto?> AsignarParticipanteAsync(int idGrupo, AsignarParticipanteGrupoRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();

            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Grupo_AsignarParticipante @id_grupo, @id_participante";
            cmd.Parameters.AddWithValue("@id_grupo", idGrupo);
            cmd.Parameters.AddWithValue("@id_participante", request.id_participante);
            var res = cmd.ExecuteScalar();
            if (res == null || res == DBNull.Value) return null;
            var newId = Convert.ToInt32(res);

            return new GrupoParticipanteDto
            {
                id_grupo_participante = newId,
                id_grupo = idGrupo,
                id_participante = request.id_participante,
                fecha_ingreso = DateTime.Now,
                estado = true
            };
        });
    }

    public async Task<bool> RemoverParticipanteAsync(int idGrupoParticipante)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Grupo_RemoverParticipante @id";
            cmd.Parameters.AddWithValue("@id", idGrupoParticipante);
            cmd.ExecuteNonQuery();
            return true;
        });
    }
}
