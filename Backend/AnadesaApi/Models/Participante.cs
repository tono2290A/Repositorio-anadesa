using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("participantes")]
public class Participante
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_participante { get; set; }
    public int id_programa { get; set; }
    public int? id_proyecto { get; set; }
    public int id_categoria { get; set; }
    public int? id_comunidad { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string? tercer_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string? tercer_apellido { get; set; }
    public DateTime fecha_nacimiento { get; set; }
    public string? sexo { get; set; }
    public string? dpi { get; set; }
    public string? telefono { get; set; }
    public string? correo { get; set; }
    public bool estado { get; set; }
    public DateTime fecha_registro { get; set; }
    public bool? beca { get; set; }
    public decimal? monto_beca { get; set; }

    [ForeignKey("id_programa")]
    public virtual Programa? Programa { get; set; }
    [ForeignKey("id_proyecto")]
    public virtual Proyecto? Proyecto { get; set; }
    [ForeignKey("id_categoria")]
    public virtual CategoriaParticipante? Categoria { get; set; }
    [ForeignKey("id_comunidad")]
    public virtual Comunidad? Comunidad { get; set; }
}
