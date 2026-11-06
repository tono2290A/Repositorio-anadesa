using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EvaluacionesController : ControladorConPermisos
{
    private readonly EvaluacionService _evaluacionService;

    public EvaluacionesController(EvaluacionService evaluacionService, PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _evaluacionService = evaluacionService;
    }

    protected override int IdModulo => 7;
    protected override string NombreModulo => "Evaluación";

    /// <summary>Carga el registro y devuelve 404/403 si esta fuera del alcance del rol.</summary>
    private async Task<ActionResult?> BloqueoRegistro(int id)
    {
        if (Alcance == null) return null;
        var registro = await _evaluacionService.ObtenerPorIdAsync(id);
        if (registro == null) return NotFound(new { message = "Evaluacion no encontrada." });
        return DeMiPrograma(registro.programa) ? null : ProgramaAjeno();
    }

    private static bool ValidarRegistro(int idParticipante, string? fecha, int? nivel,
                                        string? resultado, string? observaciones, out string error)
    {
        error = string.Empty;
        if (string.IsNullOrWhiteSpace(fecha)) { error = "La fecha de la evaluacion es obligatoria."; return false; }
        if (fecha.Trim().Length > 10) { error = "La fecha no es valida."; return false; }
        if (idParticipante <= 0) { error = "Seleccione un participante."; return false; }
        if (nivel.HasValue && (nivel.Value < 1 || nivel.Value > 5)) { error = "El nivel debe estar entre 1 y 5."; return false; }
        if ((resultado?.Length ?? 0) > 500) { error = "El resultado supera los 500 caracteres."; return false; }
        if ((observaciones?.Length ?? 0) > 500) { error = "Las observaciones superan los 500 caracteres."; return false; }
        if (!nivel.HasValue && string.IsNullOrWhiteSpace(observaciones))
        { error = "Registre la observacion de cumplimiento."; return false; }
        return true;
    }

    /* ------------------------------- CONSULTA ------------------------------- */

    [HttpGet]
    public async Task<ActionResult<List<EvaluacionDto>>> ObtenerTodos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _evaluacionService.ObtenerTodosAsync(Alcance));
    }

    [HttpGet("participante/{idParticipante:int}")]
    public async Task<ActionResult<List<EvaluacionDto>>> ObtenerPorParticipante(int idParticipante)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _evaluacionService.ObtenerPorParticipanteAsync(idParticipante));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EvaluacionDto>> ObtenerPorId(int id)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (await BloqueoRegistro(id) is ActionResult bloqueo) return bloqueo;
        var registro = await _evaluacionService.ObtenerPorIdAsync(id);
        if (registro == null) return NotFound(new { message = "Evaluacion no encontrada." });
        return Ok(registro);
    }

    [HttpGet("permisos")]
    public async Task<ActionResult<object>> MisPermisos()
    {
        var permisos = await PermisosModulo() ?? new List<string>();
        return Ok(new
        {
            modulo = "Evaluacion",
            alcance = Alcance,
            permisos
        });
    }

    /* -------------------------------- CREAR --------------------------------- */

    [HttpPost]
    public async Task<ActionResult<ResultadoEvaluacion>> Crear([FromBody] CrearEvaluacionRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear", "Evaluar")) return SinPermiso("registrar");

        if (!ValidarRegistro(request.id_participante, request.fecha, request.nivel,
                             request.resultado, request.observaciones, out var error))
            return BadRequest(new { message = error });
        if (!await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();

        var resultado = await _evaluacionService.CrearAsync(request, IdUsuario, Alcance);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return StatusCode(StatusCodes.Status201Created, resultado);
    }

    [HttpPost("lote")]
    public async Task<ActionResult<ResultadoEvaluacion>> CrearLote([FromBody] CrearLoteEvaluacionRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear", "Evaluar")) return SinPermiso("registrar");

        if (request.participantes == null || request.participantes.Count == 0)
            return BadRequest(new { message = "Debe seleccionar al menos un participante." });
        if (string.IsNullOrWhiteSpace(request.fecha))
            return BadRequest(new { message = "La fecha de la evaluacion es obligatoria." });
        foreach (var fila in request.participantes)
        {
            if (fila.id_participante <= 0)
                return BadRequest(new { message = "Seleccione participantes validos." });
            if (fila.nivel.HasValue && (fila.nivel.Value < 1 || fila.nivel.Value > 5))
                return BadRequest(new { message = "El nivel debe estar entre 1 y 5." });
            if ((fila.observaciones?.Length ?? 0) > 500)
                return BadRequest(new { message = "Las observaciones superan los 500 caracteres." });
            if (Alcance != null && !await ParticipanteEnAlcanceAsync(fila.id_participante))
                return ProgramaAjeno();
        }

        var resultado = await _evaluacionService.CrearLoteAsync(request, IdUsuario, Alcance);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return Ok(resultado);
    }

    /* ------------------------------ ACTUALIZAR ------------------------------ */

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ResultadoEvaluacion>> Actualizar(int id, [FromBody] ActualizarEvaluacionRequest request)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("actualizar");

        if (!ValidarRegistro(request.id_participante, request.fecha, request.nivel,
                             request.resultado, request.observaciones, out var error))
            return BadRequest(new { message = error });
        if (await BloqueoRegistro(id) is ActionResult bloqueo) return bloqueo;
        if (!await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();

        var resultado = await _evaluacionService.ActualizarAsync(id, request, Alcance);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return Ok(resultado);
    }

    /* ------------------------------- ELIMINAR ------------------------------- */

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ResultadoEvaluacion>> Eliminar(int id)
    {
        if (!Puede(await PermisosModulo(), "Eliminar")) return SinPermiso("eliminar");
        if (await BloqueoRegistro(id) is ActionResult bloqueo) return bloqueo;

        var resultado = await _evaluacionService.EliminarAsync(id);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return Ok(resultado);
    }

    /* -------------------------- APOYOS DEL MODULO --------------------------- */

    [HttpGet("participantes")]
    public async Task<ActionResult<List<ParticipanteEvaluacionDto>>> Participantes(
        [FromQuery] int? id_programa, [FromQuery] int? id_categoria,
        [FromQuery] int? id_grupo, [FromQuery] int? id_programacion)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _evaluacionService.ObtenerParticipantesAsync(id_programa, id_categoria, id_grupo, id_programacion, Alcance));
    }

    [HttpGet("grupos")]
    public async Task<ActionResult<List<GrupoEvaluacionDto>>> Grupos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _evaluacionService.ObtenerGruposAsync(Alcance));
    }

    [HttpGet("actividades")]
    public async Task<ActionResult<List<ActividadEvaluacionDto>>> Actividades()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _evaluacionService.ObtenerActividadesAsync(Alcance));
    }

    [HttpGet("criterios")]
    public async Task<ActionResult<List<CriterioEvaluacionDto>>> Criterios()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _evaluacionService.ObtenerCriteriosAsync(Alcance));
    }
}
