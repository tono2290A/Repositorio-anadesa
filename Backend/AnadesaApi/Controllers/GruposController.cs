using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GruposController : ControladorConPermisos
{
    private readonly GrupoService _grupoService;

    public GruposController(GrupoService grupoService, PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _grupoService = grupoService;
    }

    protected override int IdModulo => 5;
    protected override string NombreModulo => "Grupos";

    /// <summary>Los grupos se consultan desde Actividades (5), Evaluación (7) y Configuración (9).</summary>
    private async Task<bool> PuedeConsultarGrupos()
    {
        var todos = await TodosLosPermisos();
        return todos.Any(m => (m.id_modulo == 5 || m.id_modulo == 7 || m.id_modulo == 9)
                              && m.permisos.Contains("Consultar"));
    }

    /// <summary>NotFound si el grupo no existe, ProgramaAjeno si es de otro programa.</summary>
    private async Task<ActionResult?> BloqueoGrupo(int idGrupo)
    {
        if (Alcance == null) return null;
        var idPrograma = await _alcance.ProgramaDeGrupoAsync(idGrupo);
        if (idPrograma == null) return NotFound();
        return idPrograma == IdProgramaDelAlcance ? null : ProgramaAjeno();
    }

    [HttpGet]
    public async Task<ActionResult<List<GrupoDto>>> ObtenerTodos()
    {
        if (!await PuedeConsultarGrupos()) return SinPermiso("consultar");
        var grupos = await _grupoService.ObtenerTodosAsync();
        if (Alcance != null)
            grupos = grupos.Where(g => g.id_programa == IdProgramaDelAlcance || DeMiPrograma(g.programa_nombre)).ToList();
        return Ok(grupos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GrupoDto>> ObtenerPorId(int id)
    {
        if (!await PuedeConsultarGrupos()) return SinPermiso("consultar");
        var grupo = await _grupoService.ObtenerPorIdAsync(id);
        if (grupo == null) return NotFound();
        if (Alcance != null && grupo.id_programa != IdProgramaDelAlcance && !DeMiPrograma(grupo.programa_nombre))
            return ProgramaAjeno();
        return Ok(grupo);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<GrupoDto>> Crear([FromBody] CrearGrupoRequest request)
    {
        if (!DeMiPrograma(request.id_programa)) return ProgramaAjeno();
        try
        {
            var grupo = await _grupoService.CrearAsync(request);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = grupo.id_grupo }, grupo);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<GrupoDto>> Actualizar(int id, [FromBody] ActualizarGrupoRequest request)
    {
        if (await BloqueoGrupo(id) is ActionResult bloqueo) return bloqueo;
        if (!DeMiPrograma(request.id_programa)) return ProgramaAjeno();
        var grupo = await _grupoService.ActualizarAsync(id, request);
        if (grupo == null) return NotFound();
        return Ok(grupo);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (await BloqueoGrupo(id) is ActionResult bloqueo) return bloqueo;
        var result = await _grupoService.EliminarAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Grupo eliminado exitosamente" });
    }

    [HttpPost("{id}/participantes")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<GrupoParticipanteDto>> AsignarParticipante(int id, [FromBody] AsignarParticipanteGrupoRequest request)
    {
        if (await BloqueoGrupo(id) is ActionResult bloqueo) return bloqueo;
        if (!await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();
        var result = await _grupoService.AsignarParticipanteAsync(id, request);
        if (result == null) return BadRequest(new { message = "El participante ya está asignado a este grupo" });
        return Ok(result);
    }

    [HttpDelete("participantes/{idGrupoParticipante}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> RemoverParticipante(int idGrupoParticipante)
    {
        if (Alcance != null)
        {
            var idGrupo = await _alcance.GrupoDeAsignacionAsync(idGrupoParticipante);
            if (idGrupo == null) return NotFound();
            if (await BloqueoGrupo(idGrupo.Value) is ActionResult bloqueo) return bloqueo;
        }
        var result = await _grupoService.RemoverParticipanteAsync(idGrupoParticipante);
        if (!result) return NotFound();
        return Ok(new { message = "Participante removido del grupo" });
    }
}
