using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("asignacion_facilitadores")]
public class AsignacionFacilitador
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_asignacion { get; set; }
    public int id_programacion { get; set; }
    public int id_usuario { get; set; }
    public DateTime fecha_asignacion { get; set; }
    public bool estado { get; set; }

    [ForeignKey("id_programacion")]
    public virtual ProgramacionActividad? ProgramacionActividad { get; set; }
    [ForeignKey("id_usuario")]
    public virtual Usuario? Usuario { get; set; }
}
