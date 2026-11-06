using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("recuperacion_contrasena")]
public class RecuperacionContrasena
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_recuperacion { get; set; }
    public string correo { get; set; } = string.Empty;
    public string codigo { get; set; } = string.Empty;
    public DateTime fecha_solicitud { get; set; }
    public DateTime fecha_expiracion { get; set; }
    public bool usado { get; set; }
}
