using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("contactos_participante")]
public class ContactoParticipante
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_contacto { get; set; }
    public int id_participante { get; set; }
    public string? telefono_principal { get; set; }
    public string? telefono_secundario { get; set; }
    public string? correo { get; set; }
    public string? contacto_emergencia { get; set; }
    public string? telefono_emergencia { get; set; }

    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
}
