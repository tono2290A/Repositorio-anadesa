using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActividadesController : ControladorConPermisos
{
    private readonly ActividadService _actividadService;

    public ActividadesController(ActividadService actividadService, PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _actividadService = actividadService;
    }

    protected override int IdModulo => 5;
    protected override string NombreModulo => "Actividades";

    /// <summary>NotFound si la programacion no existe, ProgramaAjeno si es de otro programa.</summary>
    private async Task<ActionResult?> BloqueoProgramacion(int idProgramacion)
    {
        if (Alcance == null) return null;
        var idPrograma = await _alcance.ProgramaDeProgramacionAsync(idProgramacion);
        if (idPrograma == null) return NotFound();
        return idPrograma == IdProgramaDelAlcance ? null : ProgramaAjeno();
    }

    private List<ActividadDto> FiltrarPorAlcance(List<ActividadDto> lista)
    {
        if (Alcance == null) return lista;
        var idAlcance = IdProgramaDelAlcance;
        return lista.Where(a => a.id_programa == idAlcance || DeMiPrograma(a.programa)).ToList();
    }

    [HttpGet]
    public async Task<ActionResult<List<ActividadDto>>> ObtenerTodas()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(FiltrarPorAlcance(await _actividadService.ObtenerTodasAsync()));
    }

    [HttpPost]
    public async Task<ActionResult<ActividadDto>> Crear([FromBody] CrearActividadRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear")) return SinPermiso("crear");
        if (!DeMiPrograma(request.id_programa)) return ProgramaAjeno();
        if (string.IsNullOrWhiteSpace(request.nombre))
            return BadRequest(new { message = "El nombre de la actividad es requerido." });
        var actividad = await _actividadService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerTodas), actividad);
    }

    [HttpPut("{idActividad:int}/{idProgramacion:int}")]
    public async Task<ActionResult<ActividadDto>> Actualizar(int idActividad, int idProgramacion, [FromBody] ActualizarActividadRequest request)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("actualizar");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        if (!DeMiPrograma(request.id_programa)) return ProgramaAjeno();
        if (string.IsNullOrWhiteSpace(request.nombre))
            return BadRequest(new { message = "El nombre de la actividad es requerido." });
        var actividad = await _actividadService.ActualizarAsync(idActividad, idProgramacion, request);
        if (actividad == null) return NotFound();
        return Ok(actividad);
    }

    [HttpDelete("{idActividad:int}/{idProgramacion:int}")]
    public async Task<IActionResult> Eliminar(int idActividad, int idProgramacion)
    {
        if (!Puede(await PermisosModulo(), "Eliminar")) return SinPermiso("eliminar");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        await _actividadService.EliminarAsync(idActividad, idProgramacion);
        return Ok(new { message = "Actividad eliminada" });
    }

    [HttpGet("tipos")]
    public async Task<ActionResult<List<TipoActividadDto>>> ObtenerTipos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _actividadService.ObtenerTiposAsync());
    }

    [HttpGet("programas")]
    public async Task<ActionResult<List<ProgramaDto>>> ObtenerProgramas()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        var programas = await _actividadService.ObtenerProgramasAsync();
        if (Alcance != null)
            programas = programas.Where(p => p.id_programa == IdProgramaDelAlcance || DeMiPrograma(p.tipo_programa)).ToList();
        return Ok(programas);
    }

    [HttpPut("estado/{idProgramacion}")]
    public async Task<IActionResult> ActualizarEstado(int idProgramacion, [FromBody] ActualizarEstadoRequest request)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("actualizar");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        if (string.IsNullOrWhiteSpace(request.estado))
            return BadRequest(new { message = "El estado es requerido." });
        var ok = await _actividadService.ActualizarEstadoAsync(idProgramacion, request.estado);
        if (!ok) return NotFound();
        return Ok(new { message = "Estado actualizado" });
    }

    [HttpGet("participantes-disponibles/{idProgramacion}")]
    public async Task<ActionResult<List<ParticipanteAsignadoDto>>> ObtenerParticipantesDisponibles(int idProgramacion)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        var participantes = await _actividadService.ObtenerParticipantesDisponiblesAsync(idProgramacion);
        if (Alcance != null)
            participantes = participantes.Where(p => DeMiPrograma(p.programa)).ToList();
        return Ok(participantes);
    }

    [HttpPost("asignar-participantes/{idProgramacion}")]
    public async Task<IActionResult> AsignarParticipantes(int idProgramacion, [FromBody] AsignarParticipantesRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear", "Actualizar")) return SinPermiso("asignar participantes");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;

        var ids = request.participantes ?? new List<int>();
        if (Alcance != null)
        {
            foreach (var id in ids)
            {
                if (!await ParticipanteEnAlcanceAsync(id)) return ProgramaAjeno();
            }
        }

        var ok = await _actividadService.AsignarParticipantesAsync(idProgramacion, ids);
        if (!ok) return StatusCode(500, new { message = "No se pudo guardar la asignación (posible duplicado)." });
        return Ok(new { message = "Participantes asignados correctamente" });
    }

    [HttpGet("asistencia/{idProgramacion}")]
    public async Task<ActionResult<List<AsistenciaMarcaDto>>> ObtenerAsistencia(int idProgramacion)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        return Ok(await _actividadService.ObtenerAsistenciaAsync(idProgramacion));
    }

    [HttpPost("asistencia/{idProgramacion}")]
    public async Task<IActionResult> MarcarAsistencia(int idProgramacion, [FromBody] MarcarAsistenciaRequest request)
    {
        if (!Puede(await PermisosModulo(), "Actualizar", "Crear")) return SinPermiso("marcar asistencia");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        if (Alcance != null && !await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();
        var ok = await _actividadService.MarcarAsistenciaAsync(idProgramacion, request.id_participante, request.presente);
        if (!ok) return StatusCode(500, new { message = "No se pudo registrar la asistencia." });
        return Ok(new { message = request.presente ? "Marcado como presente" : "Marcado como ausente" });
    }

    [HttpGet("facilitadores-disponibles/{idProgramacion}")]
    public async Task<ActionResult<List<FacilitadorDisponibleDto>>> ObtenerFacilitadoresDisponibles(int idProgramacion)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        return Ok(await _actividadService.ObtenerFacilitadoresDisponiblesAsync(idProgramacion));
    }

    [HttpPost("asignar-facilitadores/{idProgramacion}")]
    public async Task<IActionResult> AsignarFacilitadores(int idProgramacion, [FromBody] AsignarFacilitadoresRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear", "Actualizar")) return SinPermiso("asignar facilitadores");
        if (await BloqueoProgramacion(idProgramacion) is ActionResult bloqueo) return bloqueo;
        if (!await _actividadService.ExisteProgramacionAsync(idProgramacion))
            return NotFound(new { message = "Programacion no encontrada." });

        var ids = (request.usuarios ?? new List<int>()).Distinct().ToList();
        var candidatos = await _actividadService.ObtenerFacilitadoresDisponiblesAsync(idProgramacion);
        var validos = candidatos.Select(c => c.id_usuario).ToHashSet();
        if (ids.Any(id => !validos.Contains(id)))
            return BadRequest(new { message = "Solo usuarios activos con rol Facilitador pueden ser asignados." });

        var ok = await _actividadService.AsignarFacilitadoresAsync(idProgramacion, ids);
        if (!ok) return StatusCode(500, new { message = "No se pudo guardar la asignacion de facilitadores." });
        return Ok(new { message = ids.Count == 0 ? "Facilitadores removidos" : $"{ids.Count} facilitador(es) asignado(s)" });
    }
}
