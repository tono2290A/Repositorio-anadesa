using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("actividades")]
public class Actividad
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_actividad { get; set; }
    public int id_programa { get; set; }
    public int? id_proyecto { get; set; }
    public int id_tipo_actividad { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string? objetivo { get; set; }
    public DateTime fecha_creacion { get; set; }
    public bool estado { get; set; }

    [ForeignKey("id_programa")]
    public virtual Programa? Programa { get; set; }
    [ForeignKey("id_proyecto")]
    public virtual Proyecto? Proyecto { get; set; }
    [ForeignKey("id_tipo_actividad")]
    public virtual TipoActividad? TipoActividad { get; set; }
}
