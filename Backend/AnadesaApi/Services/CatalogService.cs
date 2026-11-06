using System.Data.SqlClient;

namespace AnadesaApi.Services;

public class CatalogService
{
    private readonly IConfiguration _config;

    public CatalogService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<List<CatalogItem>> ObtenerTiposUsuarioAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Catalogo_ObtenerTiposUsuario";
            using var r = cmd.ExecuteReader();
            var list = new List<CatalogItem>();
            while (r.Read())
            {
                list.Add(new CatalogItem
                {
                    id = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2)
                });
            }
            return list;
        });
    }

    public async Task<List<CatalogItem>> ObtenerProgramasAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Catalogo_ObtenerProgramas";
            using var r = cmd.ExecuteReader();
            var list = new List<CatalogItem>();
            while (r.Read())
            {
                list.Add(new CatalogItem
                {
                    id = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2)
                });
            }
            return list;
        });
    }

    public async Task<List<CatalogItem>> ObtenerCategoriasAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Catalogo_ObtenerCategorias";
            using var r = cmd.ExecuteReader();
            var list = new List<CatalogItem>();
            while (r.Read())
            {
                list.Add(new CatalogItem
                {
                    id = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2),
                    extra = r.IsDBNull(3) ? null : r.GetString(3)
                });
            }
            return list;
        });
    }

    public async Task<List<CatalogItem>> ObtenerComunidadesAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Catalogo_ObtenerComunidades";
            using var r = cmd.ExecuteReader();
            var list = new List<CatalogItem>();
            while (r.Read())
            {
                list.Add(new CatalogItem
                {
                    id = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.IsDBNull(2) ? null : r.GetString(2)
                });
            }
            return list;
        });
    }

    public async Task<List<CatalogItem>> ObtenerGruposAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Catalogo_ObtenerGrupos";
            using var r = cmd.ExecuteReader();
            var list = new List<CatalogItem>();
            while (r.Read())
            {
                list.Add(new CatalogItem
                {
                    id = r.GetInt32(0),
                    nombre = r.GetString(1),
                    descripcion = r.GetInt32(2).ToString()
                });
            }
            return list;
        });
    }
}

public class CatalogItem
{
    public int id { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string? extra { get; set; }
}
