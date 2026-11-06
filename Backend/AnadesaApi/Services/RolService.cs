using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class RolService
{
    private readonly IConfiguration _config;

    public RolService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<List<RolDto>> ObtenerTodosAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_ObtenerActivos";
            using var r = cmd.ExecuteReader();
            var list = new List<RolDto>();
            while (r.Read())
            {
                list.Add(new RolDto
                {
                    id_rol = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2),
                    estado = r.GetBoolean(3)
                });
            }
            return list;
        });
    }

    public async Task<RolDto?> ObtenerPorIdAsync(int id)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_ObtenerPorId @id";
            cmd.Parameters.AddWithValue("@id", id);
            using var r = cmd.ExecuteReader();
            if (!r.Read()) return null;
            var dto = new RolDto
            {
                id_rol = r.GetInt32(0),
                nombre = r.GetString(1),
                descripcion = r.IsDBNull(2) ? null : r.GetString(2),
                estado = r.GetBoolean(3)
            };
            r.Close();

            using var cmdM = conn.CreateCommand();
            cmdM.CommandText = "EXEC sp_Rol_ObtenerModulosPorRol @id";
            cmdM.Parameters.AddWithValue("@id", id);
            using var rm = cmdM.ExecuteReader();
            dto.Modulos = new List<ModuloDto>();
            while (rm.Read())
            {
                dto.Modulos.Add(new ModuloDto
                {
                    id_modulo = rm.GetInt32(0),
                    nombre = rm.GetString(1),
                    descripcion = rm.IsDBNull(2) ? null : rm.GetString(2),
                    icono = rm.IsDBNull(3) ? null : rm.GetString(3),
                    ruta = rm.IsDBNull(4) ? null : rm.GetString(4),
                    estado = rm.GetBoolean(5)
                });
            }
            rm.Close();

            using var cmdP = conn.CreateCommand();
            cmdP.CommandText = "EXEC sp_Rol_ObtenerPermisosPorRol @id";
            cmdP.Parameters.AddWithValue("@id", id);
            using var rp = cmdP.ExecuteReader();
            dto.Permisos = new List<PermisoDto>();
            while (rp.Read())
            {
                dto.Permisos.Add(new PermisoDto
                {
                    id_permiso = rp.GetInt32(0),
                    nombre = rp.GetString(1),
                    descripcion = rp.IsDBNull(2) ? null : rp.GetString(2),
                    estado = rp.GetBoolean(3),
                    id_modulo = rp.IsDBNull(4) ? null : rp.GetInt32(4)
                });
            }
            return dto;
        });
    }

    public async Task<RolDto> CrearAsync(CrearRolRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_Crear @nombre, @desc, @estado";
            cmd.Parameters.AddWithValue("@nombre", request.nombre);
            cmd.Parameters.AddWithValue("@desc", (object?)request.descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", request.estado);
            var newId = Convert.ToInt32(cmd.ExecuteScalar());
            return new RolDto { id_rol = newId, nombre = request.nombre, descripcion = request.descripcion, estado = request.estado };
        });
    }

    public async Task<bool> ActualizarPermisosAsync(int idRol, ActualizarPermisosRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_ActualizarPermisos @id_rol, @modulos, @permisos";
            cmd.Parameters.AddWithValue("@id_rol", idRol);
            cmd.Parameters.AddWithValue("@modulos", string.Join(",", request.Modulos));
            cmd.Parameters.AddWithValue("@permisos", string.Join(",",
                request.PermisosPorModulo.SelectMany(p => p.Permisos.Select(idPermiso => $"{p.id_modulo}:{idPermiso}"))));
            cmd.ExecuteNonQuery();
            return true;
        });
    }

    public async Task<bool> EliminarAsync(int id)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_Desactivar @id";
            cmd.Parameters.AddWithValue("@id", id);
            return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
        });
    }

    public async Task<RolDto?> ActualizarAsync(int id, CrearRolRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_Actualizar @id, @nombre, @desc, @estado";
            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@nombre", request.nombre);
            cmd.Parameters.AddWithValue("@desc", (object?)request.descripcion ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", request.estado);
            cmd.ExecuteNonQuery();
            return new RolDto { id_rol = id, nombre = request.nombre, descripcion = request.descripcion, estado = request.estado };
        });
    }

    public async Task<List<RolDto>> ObtenerTodosConConteoAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_ObtenerActivosConConteo";
            using var r = cmd.ExecuteReader();
            var list = new List<RolDto>();
            while (r.Read())
            {
                list.Add(new RolDto
                {
                    id_rol = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2),
                    estado = r.GetBoolean(3),
                    cantidad_usuarios = r.GetInt32(4)
                });
            }
            return list;
        });
    }

    public async Task<List<ModuloDto>> ObtenerModulosAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_ListarModulosActivos";
            using var r = cmd.ExecuteReader();
            var list = new List<ModuloDto>();
            while (r.Read())
            {
                list.Add(new ModuloDto
                {
                    id_modulo = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2),
                    icono = r.IsDBNull(3) ? null : r.GetString(3),
                    ruta = r.IsDBNull(4) ? null : r.GetString(4),
                    estado = r.GetBoolean(5)
                });
            }
            return list;
        });
    }

    public async Task<List<PermisoDto>> ObtenerPermisosAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Rol_ListarPermisosActivos";
            using var r = cmd.ExecuteReader();
            var list = new List<PermisoDto>();
            while (r.Read())
            {
                list.Add(new PermisoDto
                {
                    id_permiso = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2),
                    estado = r.GetBoolean(3),
                    id_modulo = r.IsDBNull(4) ? null : r.GetInt32(4)
                });
            }
            return list;
        });
    }
}
