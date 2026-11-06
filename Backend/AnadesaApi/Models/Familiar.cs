using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("familiares")]
public class Familiar
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_familiar { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string? tercer_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string? tercer_apellido { get; set; }
    public string? dpi { get; set; }
    public DateTime? fecha_nacimiento { get; set; }
    public string? telefono { get; set; }
    public string? correo { get; set; }
    public bool estado { get; set; }
}
