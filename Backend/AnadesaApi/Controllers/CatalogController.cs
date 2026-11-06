using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CatalogController : ControllerBase
{
    private readonly CatalogService _catalogService;

    public CatalogController(CatalogService catalogService)
    {
        _catalogService = catalogService;
    }

    [HttpGet("tipos-usuario")]
    public async Task<ActionResult<List<CatalogItem>>> ObtenerTiposUsuario()
    {
        return Ok(await _catalogService.ObtenerTiposUsuarioAsync());
    }

    [HttpGet("programas")]
    public async Task<ActionResult<List<CatalogItem>>> ObtenerProgramas()
    {
        return Ok(await _catalogService.ObtenerProgramasAsync());
    }

    [HttpGet("categorias")]
    public async Task<ActionResult<List<CatalogItem>>> ObtenerCategorias()
    {
        return Ok(await _catalogService.ObtenerCategoriasAsync());
    }

    [HttpGet("comunidades")]
    public async Task<ActionResult<List<CatalogItem>>> ObtenerComunidades()
    {
        return Ok(await _catalogService.ObtenerComunidadesAsync());
    }

    [HttpGet("grupos")]
    public async Task<ActionResult<List<CatalogItem>>> ObtenerGrupos()
    {
        return Ok(await _catalogService.ObtenerGruposAsync());
    }
}
