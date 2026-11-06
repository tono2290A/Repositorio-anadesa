using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("permisos")]
public class Permiso
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_permiso { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
    public int? id_modulo { get; set; }

    [ForeignKey("id_modulo")]
    public virtual Modulo? Modulo { get; set; }
}
