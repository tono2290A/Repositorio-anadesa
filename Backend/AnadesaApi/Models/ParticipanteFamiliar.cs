using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("participante_familiares")]
public class ParticipanteFamiliar
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_participante_familiar { get; set; }
    public int id_participante { get; set; }
    public int id_familiar { get; set; }
    public string parentesco { get; set; } = string.Empty;
    public bool responsable { get; set; }

    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
    [ForeignKey("id_familiar")]
    public virtual Familiar? Familiar { get; set; }
}
