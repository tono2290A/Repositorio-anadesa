namespace AnadesaApi.DTOs;

public class ActividadDto
{
    public int id_actividad { get; set; }
    public int id_programacion { get; set; }
    public int id_programa { get; set; }
    public int id_tipo_actividad { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string? objetivo { get; set; }
    public string? programa { get; set; }
    public string? tipo_actividad { get; set; }
    public string? fecha { get; set; }
    public string? hora { get; set; }
    public string? hora_fin { get; set; }
    public string? lugar { get; set; }
    public string? estado { get; set; }
    public string? observaciones { get; set; }
    public int? cantidad_planificada { get; set; }
    public int totalParticipantes { get; set; }
    public string? responsable { get; set; }
    public string? modalidad { get; set; }
    public DateTime fecha_creacion { get; set; }
    public bool estado_activo { get; set; }
}

public class CrearActividadRequest
{
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string? objetivo { get; set; }
    public int id_programa { get; set; }
    public int id_tipo_actividad { get; set; }
    public string? fecha { get; set; }
    public string? hora { get; set; }
    public string? hora_fin { get; set; }
    public string? lugar { get; set; }
    public string? estado { get; set; }
    public string? observaciones { get; set; }
    public int? cantidad_planificada { get; set; }
    public string? modalidad { get; set; }
}

public class ActualizarActividadRequest
{
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public string? objetivo { get; set; }
    public int id_programa { get; set; }
    public int id_tipo_actividad { get; set; }
    public string? fecha { get; set; }
    public string? hora { get; set; }
    public string? hora_fin { get; set; }
    public string? lugar { get; set; }
    public string? estado { get; set; }
    public string? observaciones { get; set; }
    public int? cantidad_planificada { get; set; }
    public string? modalidad { get; set; }
}

public class ActualizarEstadoRequest
{
    public string estado { get; set; } = string.Empty;
}

public class ParticipanteAsignadoDto
{
    public int id_participante { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? dpi { get; set; }
    public string? telefono { get; set; }
    public string? programa { get; set; }
    public string? categoria { get; set; }
    public bool presente { get; set; }
}

public class AsignarParticipantesRequest
{
    public List<int> participantes { get; set; } = new();
}

public class FacilitadorDisponibleDto
{
    public int id_usuario { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? usuario { get; set; }
    public string? correo { get; set; }
    public bool asignado { get; set; }
}

public class AsignarFacilitadoresRequest
{
    public List<int> usuarios { get; set; } = new();
}

public class AsistenciaMarcaDto
{
    public int id_participante { get; set; }
    public bool presente { get; set; }
    public string? hora_registro { get; set; }
}

public class MarcarAsistenciaRequest
{
    public int id_participante { get; set; }
    public bool presente { get; set; }
}

public class TipoActividadDto
{
    public int id_tipo_actividad { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}

public class ProgramaDto
{
    public int id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? tipo_programa { get; set; }
    public bool estado { get; set; }
}
