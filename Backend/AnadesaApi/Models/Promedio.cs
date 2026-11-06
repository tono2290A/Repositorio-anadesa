using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("promedios")]
public class Promedio
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_promedio { get; set; }
    public int id_inscripcion { get; set; }
    public int id_bloque { get; set; }
    public decimal promedio { get; set; }
    public string? observaciones { get; set; }
    public DateTime fecha_registro { get; set; }

    [ForeignKey("id_inscripcion")]
    public virtual InscripcionAcademica? Inscripcion { get; set; }
    [ForeignKey("id_bloque")]
    public virtual BloqueAcademico? BloqueAcademico { get; set; }
}
