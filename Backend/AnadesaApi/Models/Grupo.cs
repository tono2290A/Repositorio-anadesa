using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("grupos")]
public class Grupo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_grupo { get; set; }
    public int id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
    public DateTime fecha_creacion { get; set; }

    [ForeignKey("id_programa")]
    public virtual Programa? Programa { get; set; }
}
