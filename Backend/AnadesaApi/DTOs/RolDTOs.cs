namespace AnadesaApi.DTOs;

public class RolDto
{
    public int id_rol { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
    public int cantidad_usuarios { get; set; }
    public List<PermisoDto>? Permisos { get; set; }
    public List<ModuloDto>? Modulos { get; set; }
}

public class CrearRolRequest
{
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; } = true;
}

public class PermisoDto
{
    public int id_permiso { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
    public int? id_modulo { get; set; }
}

public class ModuloDto
{
    public int id_modulo { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string? icono { get; set; }
    public string? ruta { get; set; }
    public bool estado { get; set; }
}

public class ActualizarPermisosRequest
{
    public List<int> Modulos { get; set; } = new();
    public List<RolModuloPermisoRequest> PermisosPorModulo { get; set; } = new();
}

public class RolModuloPermisoRequest
{
    public int id_modulo { get; set; }
    public List<int> Permisos { get; set; } = new();
}
