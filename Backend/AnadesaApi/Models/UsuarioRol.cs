using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("usuario_roles")]
public class UsuarioRol
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_usuario_rol { get; set; }
    public int id_usuario { get; set; }
    public int id_rol { get; set; }
    public DateTime fecha_asignacion { get; set; }

    [ForeignKey("id_usuario")]
    public virtual Usuario? Usuario { get; set; }

    [ForeignKey("id_rol")]
    public virtual Rol? Rol { get; set; }
}
