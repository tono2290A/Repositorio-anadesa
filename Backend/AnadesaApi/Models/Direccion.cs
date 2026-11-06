using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("direcciones")]
public class Direccion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_direccion { get; set; }
    public int id_participante { get; set; }
    public int? id_comunidad { get; set; }
    public string? direccion { get; set; }
    public string? referencia { get; set; }

    [ForeignKey("id_participante")]
    public virtual Participante? Participante { get; set; }
    [ForeignKey("id_comunidad")]
    public virtual Comunidad? Comunidad { get; set; }
}
