using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("grados")]
public class Grado
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_grado { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? nivel { get; set; }
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}
