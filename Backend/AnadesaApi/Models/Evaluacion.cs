using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("evaluaciones")]
public class Evaluacion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_evaluacion { get; set; }
    public int? id_programacion { get; set; }
    public int? id_participante { get; set; }
    public int? id_grupo { get; set; }
    public int id_usuario { get; set; }
    public string tipo_evaluacion { get; set; } = string.Empty;
    public DateTime fecha_evaluacion { get; set; }
    public string? resultado_general { get; set; }
    public string? observaciones { get; set; }
    public bool estado { get; set; }

    [ForeignKey("id_programacion")]
    public virtual ProgramacionActividad? ProgramacionActividad { get; set; }
    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
    [ForeignKey("id_grupo")]
    public virtual Grupo? Grupo { get; set; }
    [ForeignKey("id_usuario")]
    public virtual Usuario? Usuario { get; set; }
}
