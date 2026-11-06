using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("fotografias_participante")]
public class FotografiaParticipante
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_fotografia { get; set; }
    public int id_participante { get; set; }
    public string nombre_archivo { get; set; } = string.Empty;
    public string ruta_fotografia { get; set; } = string.Empty;
    public DateTime fecha_subida { get; set; }
    public bool estado { get; set; }

    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
}
