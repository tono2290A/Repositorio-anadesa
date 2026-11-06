using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("tipos_usuario")]
public class TipoUsuario
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_tipo_usuario { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}
