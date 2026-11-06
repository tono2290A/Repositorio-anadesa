using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControladorConPermisos
{
    private readonly RolService _rolService;

    public RolesController(RolService rolService, PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _rolService = rolService;
    }

    protected override int IdModulo => 9;
    protected override string NombreModulo => "Configuración";

    [HttpGet]
    public async Task<ActionResult<List<RolDto>>> ObtenerTodos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _rolService.ObtenerTodosConConteoAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RolDto>> ObtenerPorId(int id)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        var rol = await _rolService.ObtenerPorIdAsync(id);
        if (rol == null) return NotFound();
        return Ok(rol);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RolDto>> Crear([FromBody] CrearRolRequest request)
    {
        var rol = await _rolService.CrearAsync(request);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = rol.id_rol }, rol);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<RolDto>> Actualizar(int id, [FromBody] CrearRolRequest request)
    {
        var rol = await _rolService.ActualizarAsync(id, request);
        if (rol == null) return NotFound();
        return Ok(rol);
    }

    [HttpPut("{id}/permisos")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ActualizarPermisos(int id, [FromBody] ActualizarPermisosRequest request)
    {
        var result = await _rolService.ActualizarPermisosAsync(id, request);
        if (!result) return NotFound();
        return Ok(new { message = "Permisos actualizados exitosamente" });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var result = await _rolService.EliminarAsync(id);
        if (!result) return NotFound();
        return Ok(new { message = "Rol desactivado exitosamente" });
    }

    [HttpGet("modulos")]
    public async Task<ActionResult<List<ModuloDto>>> ObtenerModulos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _rolService.ObtenerModulosAsync());
    }

    [HttpGet("permisos")]
    public async Task<ActionResult<List<PermisoDto>>> ObtenerPermisos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _rolService.ObtenerPermisosAsync());
    }
}
