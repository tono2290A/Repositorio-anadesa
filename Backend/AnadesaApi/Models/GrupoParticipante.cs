using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("grupo_participantes")]
public class GrupoParticipante
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_grupo_participante { get; set; }
    public int id_grupo { get; set; }
    public int id_participante { get; set; }
    public DateTime fecha_ingreso { get; set; }
    public DateTime? fecha_salida { get; set; }
    public bool estado { get; set; }

    [ForeignKey("id_grupo")]
    public virtual Grupo? Grupo { get; set; }
    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
}
