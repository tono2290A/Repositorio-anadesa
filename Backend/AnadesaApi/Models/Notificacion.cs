using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("notificaciones")]
public class Notificacion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_notificacion { get; set; }
    public int id_usuario { get; set; }
    public string titulo { get; set; } = string.Empty;
    public string mensaje { get; set; } = string.Empty;
    public string tipo { get; set; } = string.Empty;
    public bool leida { get; set; }
    public DateTime fecha_creacion { get; set; }
    public DateTime? fecha_lectura { get; set; }

    [ForeignKey("id_usuario")]
    public virtual Usuario? Usuario { get; set; }
}
