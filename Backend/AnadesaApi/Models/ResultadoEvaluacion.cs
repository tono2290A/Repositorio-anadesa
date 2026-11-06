using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("resultados_evaluacion")]
public class ResultadoEvaluacion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_resultado { get; set; }
    public int id_evaluacion { get; set; }
    public int id_criterio { get; set; }
    public decimal? puntuacion { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }

    [ForeignKey("id_evaluacion")]
    public virtual Evaluacion? Evaluacion { get; set; }
    [ForeignKey("id_criterio")]
    public virtual CriterioEvaluacion? CriterioEvaluacion { get; set; }
}
