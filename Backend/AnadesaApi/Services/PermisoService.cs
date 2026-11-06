using System.Data;
using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class PermisoService
{
    private readonly IConfiguration _config;
    private readonly ILogger<PermisoService> _logger;

    public PermisoService(IConfiguration config, ILogger<PermisoService> logger)
    {
        _config = config;
        _logger = logger;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<List<PermisoModuloDto>> ObtenerPermisosAsync(int idUsuario)
    {
        var resultado = new List<PermisoModuloDto>();
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandTimeout = 15;
            cmd.CommandText = "sp_ObtenerPermisosUsuario";
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("@id_usuario", SqlDbType.Int).Value = idUsuario;

            await using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                var idModulo = r.GetInt32(r.GetOrdinal("id_modulo"));
                var modulo = r.GetString(r.GetOrdinal("modulo"));
                var permiso = r.GetString(r.GetOrdinal("permiso"));

                var item = resultado.FirstOrDefault(x => x.id_modulo == idModulo);
                if (item == null)
                {
                    item = new PermisoModuloDto { id_modulo = idModulo, modulo = modulo };
                    resultado.Add(item);
                }
                if (!string.IsNullOrEmpty(permiso) && !item.permisos.Contains(permiso))
                    item.permisos.Add(permiso);
            }
            return resultado;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Permisos - ObtenerPermisos {Usuario}", idUsuario);
            // Propagar el error: responder 500 para que el frontend no confunda
            // una falla de la BD con "el usuario no tiene permisos".
            throw;
        }
    }

    public async Task<bool> TienePermisoAsync(int idUsuario, int idModulo, string nombrePermiso)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandTimeout = 15;
            cmd.CommandText = "sp_VerificarPermiso";
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("@id_usuario", SqlDbType.Int).Value = idUsuario;
            cmd.Parameters.Add("@id_modulo", SqlDbType.Int).Value = idModulo;
            cmd.Parameters.Add("@nombre_permiso", SqlDbType.VarChar, 50).Value = nombrePermiso;
            var result = await cmd.ExecuteScalarAsync();
            return result != null && Convert.ToInt32(result) == 1;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Permisos - VerificarPermiso {Usuario} {Modulo} {Permiso}", idUsuario, idModulo, nombrePermiso);
            return false;
        }
    }
}
