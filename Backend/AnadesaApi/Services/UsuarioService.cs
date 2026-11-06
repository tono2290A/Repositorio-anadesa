using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class UsuarioService
{
    private readonly IConfiguration _config;
    private readonly EmailService _emailService;
    private readonly ILogger<UsuarioService> _logger;

    public UsuarioService(IConfiguration config, EmailService emailService, ILogger<UsuarioService> logger)
    {
        _config = config;
        _emailService = emailService;
        _logger = logger;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<List<UsuarioDto>> ObtenerTodosAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_ListarUsuarios";
            using var r = cmd.ExecuteReader();
            var list = new List<UsuarioDto>();
            while (r.Read())
            {
                list.Add(new UsuarioDto
                {
                    id_usuario = r.GetInt32(r.GetOrdinal("id_usuario")),
                    id_tipo_usuario = r.GetInt32(r.GetOrdinal("id_tipo_usuario")),
                    primer_nombre = r.GetString(r.GetOrdinal("primer_nombre")),
                    segundo_nombre = r.IsDBNull(r.GetOrdinal("segundo_nombre")) ? null : r.GetString(r.GetOrdinal("segundo_nombre")),
                    primer_apellido = r.GetString(r.GetOrdinal("primer_apellido")),
                    segundo_apellido = r.IsDBNull(r.GetOrdinal("segundo_apellido")) ? null : r.GetString(r.GetOrdinal("segundo_apellido")),
                    usuario = r.GetString(r.GetOrdinal("usuario")),
                    correo = r.IsDBNull(r.GetOrdinal("correo")) ? null : r.GetString(r.GetOrdinal("correo")),
                    telefono = r.IsDBNull(r.GetOrdinal("telefono")) ? null : r.GetString(r.GetOrdinal("telefono")),
                    estado = r.GetBoolean(r.GetOrdinal("estado")),
                    ultimo_acceso = r.IsDBNull(r.GetOrdinal("ultimo_acceso")) ? null : r.GetDateTime(r.GetOrdinal("ultimo_acceso")),
                    fecha_creacion = r.GetDateTime(r.GetOrdinal("fecha_creacion")),
                    tipo_usuario_nombre = r.IsDBNull(r.GetOrdinal("tipo_usuario_nombre")) ? null : r.GetString(r.GetOrdinal("tipo_usuario_nombre"))
                });
            }
            r.Close();

            // Cargar los roles de cada usuario (sp_ListarUsuarios no los trae).
            if (list.Count > 0)
            {
                var ids = string.Join(",", list.Select(u => u.id_usuario));
                using var cmdRoles = conn.CreateCommand();
                cmdRoles.CommandText = "EXEC sp_Usuario_ObtenerRolesPorIds @ids";
                cmdRoles.Parameters.AddWithValue("@ids", ids);
                using var rr = cmdRoles.ExecuteReader();
                while (rr.Read())
                {
                    var idUsuario = rr.GetInt32(0);
                    var dto = list.FirstOrDefault(x => x.id_usuario == idUsuario);
                    if (dto == null) continue;
                    dto.Roles ??= new List<RolDto>();
                    dto.Roles.Add(new RolDto
                    {
                        id_rol = rr.GetInt32(1),
                        nombre = rr.GetString(2),
                        estado = rr.GetBoolean(3)
                    });
                }
            }
            return list;
        });
    }

    public async Task<UsuarioDto?> ObtenerPorIdAsync(int id)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var conn = CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "EXEC sp_ObtenerUsuarioPorId @id_usuario";
                cmd.Parameters.AddWithValue("@id_usuario", id);
                using var r = cmd.ExecuteReader();
                if (!r.Read()) return null;

                var dto = new UsuarioDto
                {
                    id_usuario = r.GetInt32(r.GetOrdinal("id_usuario")),
                    id_tipo_usuario = r.GetInt32(r.GetOrdinal("id_tipo_usuario")),
                    primer_nombre = r.GetString(r.GetOrdinal("primer_nombre")),
                    segundo_nombre = r.IsDBNull(r.GetOrdinal("segundo_nombre")) ? null : r.GetString(r.GetOrdinal("segundo_nombre")),
                    primer_apellido = r.GetString(r.GetOrdinal("primer_apellido")),
                    segundo_apellido = r.IsDBNull(r.GetOrdinal("segundo_apellido")) ? null : r.GetString(r.GetOrdinal("segundo_apellido")),
                    usuario = r.GetString(r.GetOrdinal("usuario")),
                    correo = r.IsDBNull(r.GetOrdinal("correo")) ? null : r.GetString(r.GetOrdinal("correo")),
                    telefono = r.IsDBNull(r.GetOrdinal("telefono")) ? null : r.GetString(r.GetOrdinal("telefono")),
                    estado = r.GetBoolean(r.GetOrdinal("estado")),
                    ultimo_acceso = r.IsDBNull(r.GetOrdinal("ultimo_acceso")) ? null : r.GetDateTime(r.GetOrdinal("ultimo_acceso")),
                    fecha_creacion = r.GetDateTime(r.GetOrdinal("fecha_creacion")),
                    tipo_usuario_nombre = r.IsDBNull(r.GetOrdinal("tipo_usuario_nombre")) ? null : r.GetString(r.GetOrdinal("tipo_usuario_nombre"))
                };

                if (!r.IsDBNull(r.GetOrdinal("id_rol")))
                {
                    dto.Roles = new List<RolDto>();
                    do
                    {
                        dto.Roles.Add(new RolDto
                        {
                            id_rol = r.GetInt32(r.GetOrdinal("id_rol")),
                            nombre = r.GetString(r.GetOrdinal("nombreRol")),
                            estado = r.GetBoolean(r.GetOrdinal("estadoRol"))
                        });
                    } while (r.Read());
                }

                return dto;
            }
            catch { return null; }
        });
    }

    public async Task<UsuarioDto> CrearAsync(CrearUsuarioRequest request)
    {
        return await Task.Run(async () =>
        {
            if (request.Roles == null || request.Roles.Count == 0)
                throw new InvalidOperationException("Debe asignar al menos un rol al usuario.");
            var hash = BCrypt.Net.BCrypt.HashPassword(request.contrasena);
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_CrearUsuario @primer_nombre, @segundo_nombre, @primer_apellido, @segundo_apellido, @usuario, @contrasena, @correo, @telefono, @fotografia, @estado, @id_tipo_usuario, @id_rol, @nuevo_id_usuario OUTPUT, @nombre_rol OUTPUT";
            cmd.Parameters.AddWithValue("@primer_nombre", request.primer_nombre);
            cmd.Parameters.AddWithValue("@segundo_nombre", (object?)request.segundo_nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@primer_apellido", request.primer_apellido);
            cmd.Parameters.AddWithValue("@segundo_apellido", (object?)request.segundo_apellido ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@usuario", request.usuario);
            cmd.Parameters.AddWithValue("@contrasena", hash);
            cmd.Parameters.AddWithValue("@correo", (object?)request.correo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@telefono", (object?)request.telefono ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fotografia", DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", request.estado);
            cmd.Parameters.AddWithValue("@id_tipo_usuario", request.id_tipo_usuario);
            cmd.Parameters.AddWithValue("@id_rol", request.Roles != null && request.Roles.Any() ? request.Roles[0] : (object)DBNull.Value);
            var outId = cmd.Parameters.Add("@nuevo_id_usuario", System.Data.SqlDbType.Int);
            outId.Direction = System.Data.ParameterDirection.Output;
            var outNombre = cmd.Parameters.Add("@nombre_rol", System.Data.SqlDbType.NVarChar, 160);
            outNombre.Direction = System.Data.ParameterDirection.Output;
            cmd.ExecuteNonQuery();

            var newId = (int)outId.Value;

            if (!string.IsNullOrEmpty(request.correo))
            {
                try
                {
                    await _emailService.EnviarCredencialesUsuarioAsync(
                        request.correo,
                        $"{request.primer_nombre} {request.primer_apellido}",
                        request.usuario, request.contrasena,
                        outNombre.Value?.ToString() ?? "");
                }
                catch (Exception ex) { _logger.LogError(ex, "Error al enviar credenciales"); }
            }

            return (await ObtenerPorIdAsync(newId))!;
        });
    }

    public async Task<UsuarioDto?> ActualizarAsync(int id, ActualizarUsuarioRequest request)
    {
        return await Task.Run(() =>
        {
            if (request.Roles == null || request.Roles.Count == 0)
                throw new InvalidOperationException("Debe asignar al menos un rol al usuario.");
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            var hash = !string.IsNullOrEmpty(request.contrasena) ? BCrypt.Net.BCrypt.HashPassword(request.contrasena) : "";
            cmd.CommandText = "EXEC sp_ActualizarUsuario @id_usuario, @primer_nombre, @segundo_nombre, @primer_apellido, @segundo_apellido, @usuario, @contrasena, @correo, @telefono, @fotografia, @estado, @id_tipo_usuario, @id_rol, @nombre_rol";
            cmd.Parameters.AddWithValue("@id_usuario", id);
            cmd.Parameters.AddWithValue("@primer_nombre", request.primer_nombre);
            cmd.Parameters.AddWithValue("@segundo_nombre", (object?)request.segundo_nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@primer_apellido", request.primer_apellido);
            cmd.Parameters.AddWithValue("@segundo_apellido", (object?)request.segundo_apellido ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@usuario", request.usuario);
            cmd.Parameters.AddWithValue("@contrasena", !string.IsNullOrEmpty(request.contrasena) ? (object)hash : DBNull.Value);
            cmd.Parameters.AddWithValue("@correo", (object?)request.correo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@telefono", (object?)request.telefono ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fotografia", DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", request.estado);
            cmd.Parameters.AddWithValue("@id_tipo_usuario", request.id_tipo_usuario);
            cmd.Parameters.AddWithValue("@id_rol", request.Roles != null && request.Roles.Any() ? request.Roles[0] : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@nombre_rol", DBNull.Value);
            cmd.ExecuteNonQuery();

            if (request.estado)
            {
                using var cmdReset = conn.CreateCommand();
                cmdReset.CommandTimeout = 15;
                cmdReset.CommandText = "EXEC sp_Usuario_ResetearIntentos @id_usuario";
                cmdReset.Parameters.AddWithValue("@id_usuario", id);
                cmdReset.ExecuteNonQuery();
            }

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
            cmd.CommandText = "EXEC sp_EliminarUsuario @id_usuario";
            cmd.Parameters.AddWithValue("@id_usuario", id);
            cmd.ExecuteNonQuery();
            return true;
        });
    }
}
