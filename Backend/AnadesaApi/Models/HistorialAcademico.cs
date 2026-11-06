using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("historial_academico")]
public class HistorialAcademico
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_historial { get; set; }
    public int id_participante { get; set; }
    public int id_grado { get; set; }
    public int id_ciclo { get; set; }
    public decimal? promedio_final { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }
    public DateTime fecha_registro { get; set; }

    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
    [ForeignKey("id_grado")]
    public virtual Grado? Grado { get; set; }
    [ForeignKey("id_ciclo")]
    public virtual CicloEscolar? CicloEscolar { get; set; }
}
