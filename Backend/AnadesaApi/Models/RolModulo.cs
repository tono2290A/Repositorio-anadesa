using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("rol_modulos")]
public class RolModulo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_rol_modulo { get; set; }
    public int id_rol { get; set; }
    public int id_modulo { get; set; }

    [ForeignKey("id_rol")]
    public virtual Rol? Rol { get; set; }
    [ForeignKey("id_modulo")]
    public virtual Modulo? Modulo { get; set; }
}
