using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("ciclos_escolares")]
public class CicloEscolar
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_ciclo { get; set; }
    public int anio { get; set; }
    public DateTime? fecha_inicio { get; set; }
    public DateTime? fecha_fin { get; set; }
    public bool estado { get; set; }
}
