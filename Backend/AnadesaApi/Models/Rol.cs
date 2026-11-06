using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("roles")]
public class Rol
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_rol { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}
