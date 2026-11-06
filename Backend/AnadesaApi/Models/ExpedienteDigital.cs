using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("expedientes_digitales")]
public class ExpedienteDigital
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_expediente { get; set; }
    public int id_participante { get; set; }
    public string numero_expediente { get; set; } = string.Empty;
    public DateTime fecha_creacion { get; set; }
    public string? observaciones { get; set; }
    public bool estado { get; set; }

    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
}
