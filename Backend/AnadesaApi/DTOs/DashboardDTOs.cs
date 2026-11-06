namespace AnadesaApi.DTOs;

public class ActividadRecienteDto
{
    public string tipo { get; set; } = string.Empty;
    public string titulo { get; set; } = string.Empty;
    public string detalle { get; set; } = string.Empty;
    public DateTime fecha { get; set; }
    public int? id_programa { get; set; }
    
    // Campos adicionales para actividades (tipo = 'actividad')
    public string? estado { get; set; }
    public string? responsable { get; set; }
    public DateTime? fecha_programada { get; set; }
    public int? id_actividad { get; set; }
    public int? id_programacion { get; set; }
}

public class PendienteDto
{
    public string tipo { get; set; } = string.Empty;
    public string titulo { get; set; } = string.Empty;
    public string detalle { get; set; } = string.Empty;
    public string severidad { get; set; } = "media";
    public int cantidad { get; set; }
}
