using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;
using System.Data.SqlClient;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AcademicoController : ControladorConPermisos
{
    private readonly AcademicoService _academicoService;
    private readonly IConfiguration _config;

    public AcademicoController(AcademicoService academicoService, IConfiguration config,
                               PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _academicoService = academicoService;
        _config = config;
    }

    protected override int IdModulo => 4;
    protected override string NombreModulo => "Académico";

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    /// <summary>Devuelve NotFound si no existe, ProgramaAjeno si es de otro programa.</summary>
    private async Task<ActionResult?> AlcanceDeInscripcion(int idInscripcion)
    {
        if (Alcance == null) return null;
        var id = await _alcance.ParticipanteDeInscripcionAsync(idInscripcion);
        if (id == null) return NotFound();
        return await ParticipanteEnAlcanceAsync(id.Value) ? null : ProgramaAjeno();
    }

    private async Task<ActionResult?> AlcanceDeHistorial(int idHistorial)
    {
        if (Alcance == null) return null;
        var id = await _alcance.ParticipanteDeHistorialAsync(idHistorial);
        if (id == null) return NotFound();
        return await ParticipanteEnAlcanceAsync(id.Value) ? null : ProgramaAjeno();
    }

    [HttpGet("inscripciones/{idParticipante}")]
    public async Task<ActionResult<List<InscripcionAcademicaDto>>> ObtenerInscripciones(int idParticipante)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (!await ParticipanteEnAlcanceAsync(idParticipante)) return ProgramaAjeno();
        return Ok(await _academicoService.ObtenerInscripcionesPorParticipanteAsync(idParticipante));
    }

    [HttpPost("inscripciones")]
    public async Task<ActionResult<InscripcionAcademicaDto>> CrearInscripcion([FromBody] CrearInscripcionRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear")) return SinPermiso("crear");
        if (!await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();
        var inscripcion = await _academicoService.CrearInscripcionAsync(request);
        return CreatedAtAction(nameof(ObtenerInscripciones), new { idParticipante = inscripcion.id_participante }, inscripcion);
    }

    [HttpDelete("inscripciones/{id}")]
    public async Task<IActionResult> EliminarInscripcion(int id)
    {
        if (!Puede(await PermisosModulo(), "Eliminar")) return SinPermiso("eliminar");
        if (await AlcanceDeInscripcion(id) is ActionResult bloqueo) return bloqueo;
        using var conn = CreateConnection();
        await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM inscripciones_academicas WHERE id_inscripcion = @id";
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { message = "Inscripción eliminada" });
    }

    [HttpGet("historial/{idParticipante}")]
    public async Task<ActionResult<List<HistorialAcademicoDto>>> ObtenerHistorial(int idParticipante)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (!await ParticipanteEnAlcanceAsync(idParticipante)) return ProgramaAjeno();
        return Ok(await _academicoService.ObtenerHistorialPorParticipanteAsync(idParticipante));
    }

    [HttpPost("historial")]
    public async Task<ActionResult<HistorialAcademicoDto>> CrearHistorial([FromBody] CrearHistorialRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear")) return SinPermiso("crear");
        if (!await ParticipanteEnAlcanceAsync(request.id_participante)) return ProgramaAjeno();
        var historial = await _academicoService.CrearHistorialAsync(request);
        return CreatedAtAction(nameof(ObtenerHistorial), new { idParticipante = historial.id_participante }, historial);
    }

    [HttpDelete("historial/{id}")]
    public async Task<IActionResult> EliminarHistorial(int id)
    {
        if (!Puede(await PermisosModulo(), "Eliminar")) return SinPermiso("eliminar");
        if (await AlcanceDeHistorial(id) is ActionResult bloqueo) return bloqueo;
        using var conn = CreateConnection();
        await conn.OpenAsync();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM historial_academico WHERE id_historial = @id";
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { message = "Historial eliminado" });
    }

    [HttpGet("promedios/{idInscripcion}")]
    public async Task<ActionResult<List<PromedioDto>>> ObtenerPromedios(int idInscripcion)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (await AlcanceDeInscripcion(idInscripcion) is ActionResult bloqueo) return bloqueo;
        return Ok(await _academicoService.ObtenerPromediosPorInscripcionAsync(idInscripcion));
    }

    [HttpPost("promedios")]
    public async Task<ActionResult<PromedioDto>> CrearPromedio([FromBody] CrearPromedioRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear")) return SinPermiso("crear");
        if (await AlcanceDeInscripcion(request.id_inscripcion) is ActionResult bloqueo) return bloqueo;
        var promedio = await _academicoService.CrearPromedioAsync(request);
        return CreatedAtAction(nameof(ObtenerPromedios), new { idInscripcion = promedio.id_inscripcion }, promedio);
    }

    [HttpGet("ciclos")]
    public async Task<ActionResult<List<CicloEscolarDto>>> ObtenerCiclos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _academicoService.ObtenerCiclosAsync());
    }

    [HttpGet("grados")]
    public async Task<ActionResult<List<GradoDto>>> ObtenerGrados()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _academicoService.ObtenerGradosAsync());
    }

    [HttpGet("bloques")]
    public async Task<ActionResult<List<BloqueAcademicoDto>>> ObtenerBloques()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _academicoService.ObtenerBloquesAsync());
    }
}
