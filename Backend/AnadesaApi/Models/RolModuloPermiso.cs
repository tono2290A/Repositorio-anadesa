using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("rol_modulo_permisos")]
public class RolModuloPermiso
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_rol_modulo_permiso { get; set; }
    public int id_rol { get; set; }
    public int id_modulo { get; set; }
    public int id_permiso { get; set; }

    [ForeignKey("id_rol")]
    public virtual Rol? Rol { get; set; }
    [ForeignKey("id_modulo")]
    public virtual Modulo? Modulo { get; set; }
    [ForeignKey("id_permiso")]
    public virtual Permiso? Permiso { get; set; }
}
