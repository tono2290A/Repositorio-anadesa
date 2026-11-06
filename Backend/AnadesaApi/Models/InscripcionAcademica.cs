using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("inscripciones_academicas")]
public class InscripcionAcademica
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_inscripcion { get; set; }
    public int id_participante { get; set; }
    public int id_grado { get; set; }
    public int id_ciclo { get; set; }
    public DateTime fecha_inscripcion { get; set; }
    public string estado { get; set; } = string.Empty;
    public string? observaciones { get; set; }

    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
    [ForeignKey("id_grado")]
    public virtual Grado? Grado { get; set; }
    [ForeignKey("id_ciclo")]
    public virtual CicloEscolar? CicloEscolar { get; set; }
}
