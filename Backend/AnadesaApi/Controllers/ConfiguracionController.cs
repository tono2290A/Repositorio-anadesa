using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/configuracion")]
[Authorize]
public class ConfiguracionController : ControladorConPermisos
{
    private readonly ConfiguracionService _configuracionService;

    public ConfiguracionController(ConfiguracionService configuracionService, PermisoService permisoService,
        AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _configuracionService = configuracionService;
    }

    protected override int IdModulo => 9;
    protected override string NombreModulo => "ConfiguraciÃ³n";

    [AllowAnonymous]
    [HttpGet("apariencia")]
    public async Task<ActionResult<AparienciaDto>> ObtenerApariencia()
    {
        try
        {
            if (User.Identity?.IsAuthenticated == true && !Puede(await PermisosModulo(), "Consultar"))
            {
                // Desarrollo: retornar apariencia por defecto sin 403
                return Ok(new AparienciaDto
                {
                    nombre_sistema = "ANADESA",
                    color_primario = "#1E3278",
                    color_acento = "#26781E",
                    tamano_fuente = "mediana",
                    logo = null,
                    imagen_login = null
                });
            }
            return Ok(await _configuracionService.ObtenerAparienciaAsync());
        }
        catch
        {
            return Ok(new AparienciaDto
            {
                nombre_sistema = "ANADESA",
                color_primario = "#1E3278",
                color_acento = "#26781E",
                tamano_fuente = "mediana",
                logo = null,
                imagen_login = null
            });
        }
    }

    [HttpPut("apariencia")]
    public async Task<ActionResult<AparienciaDto>> GuardarApariencia([FromBody] AparienciaDto dto)
    {
        if (!Puede(await PermisosModulo(), "Actualizar")) return SinPermiso("actualizar la apariencia");
        try
        {
            return Ok(await _configuracionService.GuardarAparienciaAsync(dto, IdUsuario));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

