using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("programas")]
public class Programa
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string tipo_programa { get; set; } = string.Empty;
    public bool estado { get; set; }
    public DateTime fecha_creacion { get; set; }
}
