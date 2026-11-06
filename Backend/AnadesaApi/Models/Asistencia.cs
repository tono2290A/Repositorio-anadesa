using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("asistencia")]
public class Asistencia
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_asistencia { get; set; }
    public int id_programacion { get; set; }
    public int id_participante { get; set; }
    public bool presente { get; set; }
    public TimeSpan? hora_registro { get; set; }
    public string? observaciones { get; set; }

    [ForeignKey("id_programacion")]
    public virtual ProgramacionActividad? ProgramacionActividad { get; set; }
    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
}
