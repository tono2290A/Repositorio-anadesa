using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/backup")]
[Authorize]
public class BackupController : ControladorConPermisos
{
    private readonly BackupService _backupService;
    private readonly ILogger<BackupController> _logger;

    public BackupController(BackupService backupService, PermisoService permisoService, AlcanceService alcance,
        ILogger<BackupController> logger)
        : base(permisoService, alcance)
    {
        _backupService = backupService;
        _logger = logger;
    }

    protected override int IdModulo => 9;
    protected override string NombreModulo => "Configuración";

    [HttpGet]
    public async Task<ActionResult<List<BackupDto>>> Listar()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _backupService.ListarAsync());
    }

    [HttpGet("configuracion")]
    public async Task<ActionResult<BackupConfigDto>> ObtenerConfiguracion()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar la programación de respaldos");
        var cfg = await _backupService.ObtenerConfigAsync();
        return cfg is null ? NotFound(new { message = "No existe configuración de respaldo." }) : Ok(cfg);
    }

    [HttpPut("configuracion")]
    public async Task<ActionResult<BackupConfigDto>> GuardarConfiguracion([FromBody] GuardarBackupConfigDto dto)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("configurar respaldos automáticos");
        try
        {
            return Ok(await _backupService.GuardarConfigAsync(dto, IdUsuario));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<BackupDto>> Crear()
    {
        if (!Puede(await PermisosModulo(), "Crear")) return SinPermiso("crear copias de seguridad");
        try
        {
            var dto = await _backupService.CrearAsync(IdUsuario);
            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear copia de seguridad");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "No se pudo crear la copia de seguridad: " + ex.Message });
        }
    }

    [HttpPost("cargar")]
    [RequestSizeLimit(BackupService.MaxCargaBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = BackupService.MaxCargaBytes)]
    public async Task<ActionResult<BackupDto>> Cargar(IFormFile? archivo)
    {
        if (!Puede(await PermisosModulo(), "Crear")) return SinPermiso("cargar copias de seguridad");
        try
        {
            var dto = await _backupService.CargarAsync(archivo, IdUsuario);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al cargar copia de seguridad");
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "No se pudo cargar la copia de seguridad: " + ex.Message });
        }
    }

    [HttpGet("archivo")]
    public async Task<IActionResult> Descargar([FromQuery] string nombre)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("descargar");
        try
        {
            var stream = _backupService.AbrirArchivo(nombre);
            var nombreLimpio = Path.GetFileName(nombre);
            return File(stream, "application/octet-stream", nombreLimpio);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "La copia de seguridad no existe." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete]
    public async Task<IActionResult> Eliminar([FromQuery] string nombre)
    {
        if (!Puede(await PermisosModulo(), "Eliminar")) return SinPermiso("eliminar copias de seguridad");
        try
        {
            _backupService.Eliminar(nombre);
            return Ok(new { message = "Copia de seguridad eliminada." });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "La copia de seguridad no existe." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("restaurar")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Restaurar([FromQuery] string nombre)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("restaurar copias de seguridad");
        try
        {
            await _backupService.RestaurarAsync(nombre);
            return Ok(new { message = "Base de datos restaurada correctamente." });
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "La copia de seguridad no existe." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al restaurar copia de seguridad {Nombre}", nombre);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "No se pudo restaurar la copia de seguridad: " + ex.Message });
        }
    }
}
