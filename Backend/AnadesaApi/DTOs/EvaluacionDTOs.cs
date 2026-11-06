namespace AnadesaApi.DTOs;

public class EvaluacionDto
{
    public int id_evaluacion { get; set; }
    public int id_participante { get; set; }
    public string participante { get; set; } = string.Empty;
    public string fecha { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public string tipo_evaluacion { get; set; } = "Participante";
    public string resultado_general { get; set; } = string.Empty;
    public string observaciones { get; set; } = string.Empty;
    public string estado { get; set; } = "Activo";
    public int? nivel { get; set; }
    public string nivel_texto { get; set; } = string.Empty;
    public decimal promedio { get; set; }
    public int criterios { get; set; }
    public string evaluado_por { get; set; } = string.Empty;
    public int id_grupo { get; set; }
    public string grupo { get; set; } = string.Empty;
    public int id_programacion { get; set; }
    public string actividad { get; set; } = string.Empty;
    public string origen { get; set; } = "Individual";
    public List<DetalleEvaluacionDto> detalle { get; set; } = new();
}

public class DetalleEvaluacionDto
{
    public int id_resultado { get; set; }
    public int id_criterio { get; set; }
    public string criterio { get; set; } = string.Empty;
    public decimal? puntuacion { get; set; }
    public string resultado { get; set; } = string.Empty;
    public string observaciones { get; set; } = string.Empty;
}

public class CrearEvaluacionRequest
{
    public int id_participante { get; set; }
    public string fecha { get; set; } = string.Empty;
    public string? tipo_evaluacion { get; set; }
    public int? id_programacion { get; set; }
    public int? id_grupo { get; set; }
    public int? nivel { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }
}

public class ActualizarEvaluacionRequest
{
    public int id_participante { get; set; }
    public string fecha { get; set; } = string.Empty;
    public string? tipo_evaluacion { get; set; }
    public int? id_programacion { get; set; }
    public int? id_grupo { get; set; }
    public int? nivel { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }
}

public class FilaLoteEvaluacion
{
    public int id_participante { get; set; }
    public int? nivel { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }
}

public class CrearLoteEvaluacionRequest
{
    public List<FilaLoteEvaluacion> participantes { get; set; } = new();
    public string fecha { get; set; } = string.Empty;
    public string? tipo_evaluacion { get; set; }
    public int? id_programacion { get; set; }
    public int? id_grupo { get; set; }
}

public class ResultadoEvaluacion
{
    public bool ok { get; set; }
    public string mensaje { get; set; } = string.Empty;
    public int id { get; set; }
    public int creados { get; set; }
}

public class ParticipanteEvaluacionDto
{
    public int id_participante { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public string categoria { get; set; } = string.Empty;
    public string dpi { get; set; } = string.Empty;
    public bool viene_de_asistencia { get; set; }
}

public class GrupoEvaluacionDto
{
    public int id_grupo { get; set; }
    public int? id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string descripcion { get; set; } = string.Empty;
    public string programa { get; set; } = string.Empty;
    public int cantidad { get; set; }
}

public class ActividadEvaluacionDto
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

public class CriterioEvaluacionDto
{
    public int id_criterio { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string descripcion { get; set; } = string.Empty;
    public string tipo_programa { get; set; } = string.Empty;
    public decimal puntuacion_maxima { get; set; }
}
