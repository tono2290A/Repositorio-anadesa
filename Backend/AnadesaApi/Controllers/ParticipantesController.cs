using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ParticipantesController : ControladorConPermisos
{
    private readonly ParticipanteService _participanteService;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public ParticipantesController(ParticipanteService participanteService, IConfiguration config, IWebHostEnvironment env,
                                   PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _participanteService = participanteService;
        _config = config;
        _env = env;
    }

    protected override int IdModulo => 3;
    protected override string NombreModulo => "Participantes";

    private string GetFotoDirectory()
    {
        return RutasArchivos.DirectorioFotos(_env);
    }

    [HttpGet]
    public async Task<ActionResult<List<ParticipanteDto>>> ObtenerTodos([FromQuery] string? programa = null)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        // El alcance del rol manda: el query string nunca puede ampliar lo que ve.
        var filtro = Alcance ?? programa;
        return Ok(await _participanteService.ObtenerTodosAsync(filtro));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ParticipanteDto>> ObtenerPorId(int id)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        var participante = await _participanteService.ObtenerPorIdAsync(id);
        if (participante == null) return NotFound();
        if (!DeMiPrograma(participante.programa_nombre)) return ProgramaAjeno();
        return Ok(participante);
    }

    [HttpGet("{id}/asistencia")]
    public async Task<ActionResult<List<AsistenciaParticipanteDto>>> ObtenerAsistencia(int id)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        var participante = await _participanteService.ObtenerPorIdAsync(id);
        if (participante == null) return NotFound();
        if (!DeMiPrograma(participante.programa_nombre)) return ProgramaAjeno();
        return Ok(await _participanteService.ObtenerAsistenciaAsync(id));
    }

    [HttpPost]
    public async Task<ActionResult<ParticipanteDto>> Crear([FromBody] CrearParticipanteRequest request)
    {
        if (!Puede(await PermisosModulo(), "Crear")) return SinPermiso("crear");
        if (!DeMiPrograma(request.id_programa)) return ProgramaAjeno();
        var participante = await _participanteService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = participante.id_participante }, participante);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ParticipanteDto>> Actualizar(int id, [FromBody] CrearParticipanteRequest request)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("actualizar");
        var actual = await _participanteService.ObtenerPorIdAsync(id);
        if (actual == null) return NotFound();
        if (!DeMiPrograma(actual.programa_nombre) || !DeMiPrograma(request.id_programa)) return ProgramaAjeno();
        var participante = await _participanteService.ActualizarAsync(id, request);
        if (participante == null) return NotFound();
        return Ok(participante);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (!Puede(await PermisosModulo(), "Eliminar")) return SinPermiso("eliminar");
        var actual = await _participanteService.ObtenerPorIdAsync(id);
        if (actual == null) return NotFound();
        if (!DeMiPrograma(actual.programa_nombre)) return ProgramaAjeno();
        var result = await _participanteService.EliminarAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Participante desactivado exitosamente" });
    }

    [HttpPost("{id}/fotografia")]
    public async Task<IActionResult> SubirFotografia(int id, IFormFile archivo)
    {
        if (!Puede(await PermisosModulo(), "Actualizar", "Crear")) return SinPermiso("actualizar");
        if (archivo == null || archivo.Length == 0)
            return BadRequest(new { message = "No se envió ningún archivo" });

        var participante = await _participanteService.ObtenerPorIdAsync(id);
        if (participante == null) return NotFound();
        if (!DeMiPrograma(participante.programa_nombre)) return ProgramaAjeno();

        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!extensionesPermitidas.Contains(extension))
            return BadRequest(new { message = "Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP" });

        var directorio = GetFotoDirectory();

        if (participante.fotografia_ruta != null)
        {
            var nombreAnterior = participante.fotografia_ruta.Split('/').Last();
            var rutaAnterior = Path.Combine(directorio, nombreAnterior);
            if (System.IO.File.Exists(rutaAnterior))
                System.IO.File.Delete(rutaAnterior);
        }

        var nombreArchivo = $"part_{id}_{Guid.NewGuid():N}{extension}";
        var rutaCompleta = Path.Combine(directorio, nombreArchivo);

        using (var stream = new FileStream(rutaCompleta, FileMode.Create))
        {
            await archivo.CopyToAsync(stream);
        }

        var rutaRelativa = $"/fotos/{nombreArchivo}";
        await _participanteService.ActualizarFotografiaAsync(id, nombreArchivo, rutaRelativa);

        return Ok(new { ruta = rutaRelativa, message = "Fotografía subida exitosamente" });
    }

    [HttpGet("fotos/limpieza-rutas")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> LimpiarRutasAntiguas()
    {
        await _participanteService.LimpiarRutasAntiguasAsync();
        return Ok(new { message = "Rutas antiguas limpiadas" });
    }
}
