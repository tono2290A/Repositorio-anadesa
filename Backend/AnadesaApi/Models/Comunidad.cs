using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("comunidades")]
public class Comunidad
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_comunidad { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? municipio { get; set; }
    public string? departamento { get; set; }
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}
