using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MonitoreoController : ControladorConPermisos
{
    private readonly MonitoreoService _monitoreoService;

    public MonitoreoController(MonitoreoService monitoreoService, PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _monitoreoService = monitoreoService;
    }

    protected override int IdModulo => 6;
    protected override string NombreModulo => "Monitoreo";

    /// <summary>Carga el registro y devuelve 404/403 si esta fuera del alcance del rol.</summary>
    private async Task<ActionResult?> BloqueoRegistro(int id)
    {
        if (Alcance == null) return null;
        var registro = await _monitoreoService.ObtenerPorIdAsync(id);
        if (registro == null) return NotFound(new { message = "Registro de monitoreo no encontrado." });
        return DeMiPrograma(registro.programa) ? null : ProgramaAjeno();
    }

    /* ------------------------------- CONSULTA ------------------------------- */

    [HttpGet]
    public async Task<ActionResult<List<MonitoreoDto>>> ObtenerTodos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _monitoreoService.ObtenerTodosAsync(Alcance));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MonitoreoDto>> ObtenerPorId(int id)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (await BloqueoRegistro(id) is ActionResult bloqueo) return bloqueo;
        var registro = await _monitoreoService.ObtenerPorIdAsync(id);
        if (registro == null) return NotFound(new { message = "Registro de monitoreo no encontrado." });
        return Ok(registro);
    }

    [HttpGet("permisos")]
    public async Task<ActionResult<object>> MisPermisos()
    {
        var permisos = await PermisosModulo() ?? new List<string>();
        return Ok(new
        {
            modulo = "Monitoreo",
            alcance = Alcance,
            permisos
        });
    }

    /* -------------------------------- CREAR --------------------------------- */

    [HttpPost]
    public async Task<ActionResult<ResultadoMonitoreo>> Crear([FromBody] CrearMonitoreoRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear", "Monitorear")) return SinPermiso("registrar");

        if (request.id_participante <= 0)
            return BadRequest(new { message = "Seleccione un participante." });
        if (string.IsNullOrWhiteSpace(request.fecha))
            return BadRequest(new { message = "La fecha del monitoreo es obligatoria." });
        if (!await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();

        var resultado = await _monitoreoService.CrearAsync(request, IdUsuario, Alcance);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return StatusCode(StatusCodes.Status201Created, resultado);
    }

    [HttpPost("lote")]
    public async Task<ActionResult<ResultadoMonitoreo>> CrearLote([FromBody] CrearLoteMonitoreoRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear", "Monitorear")) return SinPermiso("registrar");

        if (request.participantes == null || request.participantes.Count == 0)
            return BadRequest(new { message = "Debe seleccionar al menos un participante." });
        if (string.IsNullOrWhiteSpace(request.fecha))
            return BadRequest(new { message = "La fecha del monitoreo es obligatoria." });
        if (Alcance != null)
        {
            foreach (var idParticipante in request.participantes)
            {
                if (!await ParticipanteEnAlcanceAsync(idParticipante)) return ProgramaAjeno();
            }
        }

        var resultado = await _monitoreoService.CrearLoteAsync(request, IdUsuario, Alcance);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return Ok(resultado);
    }

    /* ------------------------------ ACTUALIZAR ------------------------------ */

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ResultadoMonitoreo>> Actualizar(int id, [FromBody] ActualizarMonitoreoRequest request)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("actualizar");

        if (request.id_participante <= 0)
            return BadRequest(new { message = "Seleccione un participante." });
        if (string.IsNullOrWhiteSpace(request.fecha))
            return BadRequest(new { message = "La fecha del monitoreo es obligatoria." });
        if (await BloqueoRegistro(id) is ActionResult bloqueo) return bloqueo;
        if (!await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();

        var resultado = await _monitoreoService.ActualizarAsync(id, request, Alcance);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return Ok(resultado);
    }

    /* ------------------------------- ELIMINAR ------------------------------- */

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ResultadoMonitoreo>> Eliminar(int id)
    {
        if (!Puede(await PermisosModulo(), "Eliminar")) return SinPermiso("eliminar");
        if (await BloqueoRegistro(id) is ActionResult bloqueo) return bloqueo;

        var resultado = await _monitoreoService.EliminarAsync(id);
        if (!resultado.ok) return BadRequest(new { message = resultado.mensaje });
        return Ok(resultado);
    }

    /* -------------------------- APOYOS DEL MODULO --------------------------- */

    [HttpGet("participantes")]
    public async Task<ActionResult<List<ParticipanteMonitoreoDto>>> Participantes(
        [FromQuery] int? id_programa, [FromQuery] int? id_categoria,
        [FromQuery] int? id_grupo, [FromQuery] int? id_programacion)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _monitoreoService.ObtenerParticipantesAsync(id_programa, id_categoria, id_grupo, id_programacion, Alcance));
    }

    [HttpGet("areas")]
    public async Task<ActionResult<AreasMonitoreoDto>> Areas()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _monitoreoService.ObtenerAreasAsync(Alcance));
    }

    [HttpGet("grupos")]
    public async Task<ActionResult<List<GrupoMonitoreoDto>>> Grupos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _monitoreoService.ObtenerGruposAsync(Alcance));
    }

    [HttpGet("actividades")]
    public async Task<ActionResult<List<ActividadMonitoreoDto>>> Actividades()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _monitoreoService.ObtenerActividadesAsync(Alcance));
    }
}
