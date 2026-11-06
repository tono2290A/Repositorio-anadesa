using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("observaciones_monitoreo")]
public class ObservacionMonitoreo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_observacion { get; set; }
    public int id_monitoreo { get; set; }
    public string? categoria { get; set; }
    public string descripcion { get; set; } = string.Empty;
    public string? recomendacion { get; set; }
    public DateTime fecha_registro { get; set; }

    [ForeignKey("id_monitoreo")]
    public virtual Monitoreo? Monitoreo { get; set; }
}
