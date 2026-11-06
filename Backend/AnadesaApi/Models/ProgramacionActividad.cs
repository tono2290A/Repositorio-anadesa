using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("programacion_actividades")]
public class ProgramacionActividad
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_programacion { get; set; }
    public int id_actividad { get; set; }
    public DateTime fecha_actividad { get; set; }
    public TimeSpan? hora_inicio { get; set; }
    public TimeSpan? hora_fin { get; set; }
    public string? lugar { get; set; }
    public int? cantidad_planificada { get; set; }
    public string? observaciones { get; set; }
    public string estado { get; set; } = string.Empty;

    [ForeignKey("id_actividad")]
    public virtual Actividad? Actividad { get; set; }
}
