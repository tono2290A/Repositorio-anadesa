using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("proyectos")]
public class Proyecto
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_proyecto { get; set; }
    public int id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public DateTime? fecha_inicio { get; set; }
    public DateTime? fecha_fin { get; set; }
    public bool estado { get; set; }

    [ForeignKey("id_programa")]
    public virtual Programa? Programa { get; set; }
}
