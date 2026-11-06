using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("criterios_evaluacion")]
public class CriterioEvaluacion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_criterio { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string? tipo_programa { get; set; }
    public decimal? puntuacion_maxima { get; set; }
    public bool estado { get; set; }
}
