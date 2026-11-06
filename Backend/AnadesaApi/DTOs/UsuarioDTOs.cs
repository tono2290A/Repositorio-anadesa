namespace AnadesaApi.DTOs;

public class UsuarioDto
{
    public int id_usuario { get; set; }
    public int id_tipo_usuario { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string usuario { get; set; } = string.Empty;
    public string? correo { get; set; }
    public string? telefono { get; set; }
    public string? fotografia { get; set; }
    public bool estado { get; set; }
    public DateTime? ultimo_acceso { get; set; }
    public DateTime fecha_creacion { get; set; }
    public string? tipo_usuario_nombre { get; set; }
    public List<RolDto>? Roles { get; set; }
}

public class CrearUsuarioRequest
{
    public int id_tipo_usuario { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string usuario { get; set; } = string.Empty;
    public string contrasena { get; set; } = string.Empty;
    public string? correo { get; set; }
    public string? telefono { get; set; }
    public bool estado { get; set; } = true;
    public List<int>? Roles { get; set; }
}

public class ActualizarUsuarioRequest
{
    public int id_tipo_usuario { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string usuario { get; set; } = string.Empty;
    public string? contrasena { get; set; }
    public string? correo { get; set; }
    public string? telefono { get; set; }
    public bool estado { get; set; }
    public List<int>? Roles { get; set; }
}
