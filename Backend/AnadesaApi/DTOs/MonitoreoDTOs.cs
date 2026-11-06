namespace AnadesaApi.DTOs;

public class MonitoreoDto
{
    public int id_monitoreo { get; set; }
    public int id_participante { get; set; }
    public string participante { get; set; } = string.Empty;
    public string fecha { get; set; } = string.Empty;
    public int id_actividad { get; set; }
    public string actividad { get; set; } = string.Empty;
    public string participacion { get; set; } = string.Empty;
    public string observaciones { get; set; } = string.Empty;
    public string estado { get; set; } = "Registrado";
    public string registrado_por { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public string tipo_monitoreo { get; set; } = "Individual";
    public int id_grupo { get; set; }
    public string grupo { get; set; } = string.Empty;
    public int id_programacion { get; set; }
}

public class CrearMonitoreoRequest
{
    public int id_participante { get; set; }
    public string fecha { get; set; } = string.Empty;
    public int? id_actividad { get; set; }
    public int? id_programacion { get; set; }
    public string? participacion { get; set; }
    public string? observaciones { get; set; }
    public string? tipo_monitoreo { get; set; }
    public int? id_grupo { get; set; }
}

public class ActualizarMonitoreoRequest
{
    public int id_participante { get; set; }
    public string fecha { get; set; } = string.Empty;
    public int? id_actividad { get; set; }
    public int? id_programacion { get; set; }
    public string? participacion { get; set; }
    public string? observaciones { get; set; }
    public string? tipo_monitoreo { get; set; }
    public int? id_grupo { get; set; }
}

public class CrearLoteMonitoreoRequest
{
    public List<int> participantes { get; set; } = new();
    public string fecha { get; set; } = string.Empty;
    public int? id_actividad { get; set; }
    public int? id_programacion { get; set; }
    public string? participacion { get; set; }
    public string? observaciones { get; set; }
    public string? tipo_monitoreo { get; set; }
    public int? id_grupo { get; set; }
}

public class ResultadoMonitoreo
{
    public bool ok { get; set; }
    public string mensaje { get; set; } = string.Empty;
    public int id { get; set; }
    public int creados { get; set; }
}

public class ParticipanteMonitoreoDto
{
    public int id_participante { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public string categoria { get; set; } = string.Empty;
    public string dpi { get; set; } = string.Empty;
    public bool viene_de_asistencia { get; set; }
}

public class AreaMonitoreoDto
{
    public string tipo { get; set; } = string.Empty;
    public int id { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public int cantidad { get; set; }
}

public class AreasMonitoreoDto
{
    public List<AreaMonitoreoDto> programas { get; set; } = new();
    public List<AreaMonitoreoDto> categorias { get; set; } = new();
}

public class GrupoMonitoreoDto
{
    public int id_grupo { get; set; }
    public int? id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string descripcion { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public int cantidad { get; set; }
}

public class ActividadMonitoreoDto
{
    public int id_programacion { get; set; }
    public int id_actividad { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public string fecha { get; set; } = string.Empty;
    public string lugar { get; set; } = string.Empty;
    public string estado { get; set; } = string.Empty;
    public string tipo_actividad { get; set; } = string.Empty;
    public int asignados { get; set; }
}

public class PermisoModuloDto
{
    public int id_modulo { get; set; }
    public string modulo { get; set; } = string.Empty;
    public List<string> permisos { get; set; } = new();
}
