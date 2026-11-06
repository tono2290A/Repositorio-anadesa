using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnadesaApi.Models;

[Table("bloques_academicos")]
public class BloqueAcademico
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int id_bloque { get; set; }
    public string nombre { get; set; } = string.Empty;
    public int numero_bloque { get; set; }
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}
