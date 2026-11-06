using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("monitoreos")]
public class Monitoreo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_monitoreo { get; set; }
    public int id_programacion { get; set; }
    public int id_usuario { get; set; }
    public int? id_participante { get; set; }
    public int? id_grupo { get; set; }
    public string tipo_monitoreo { get; set; } = string.Empty;
    public DateTime fecha_monitoreo { get; set; }
    public bool? actividad_realizada { get; set; }
    public int? cantidad_planificada { get; set; }
    public int? cantidad_participantes { get; set; }
    public string? descripcion { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }
    public string estado { get; set; } = string.Empty;

    [ForeignKey("id_programacion")]
    public virtual ProgramacionActividad? ProgramacionActividad { get; set; }
    [ForeignKey("id_usuario")]
    public virtual Usuario? Usuario { get; set; }
    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
    [ForeignKey("id_grupo")]
    public virtual Grupo? Grupo { get; set; }
}
