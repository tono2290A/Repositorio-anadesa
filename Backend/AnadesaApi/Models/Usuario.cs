using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("usuarios")]
public class Usuario
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_usuario { get; set; }
    public int id_tipo_usuario { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string usuario { get; set; } = string.Empty;
    public string contrasena { get; set; } = string.Empty;
    public string? correo { get; set; }
    public string? telefono { get; set; }
    public string? fotografia { get; set; }
    public bool estado { get; set; }
    public DateTime? ultimo_acceso { get; set; }
    public DateTime fecha_creacion { get; set; }

    [ForeignKey("id_tipo_usuario")]
    public virtual TipoUsuario? TipoUsuario { get; set; }
}
