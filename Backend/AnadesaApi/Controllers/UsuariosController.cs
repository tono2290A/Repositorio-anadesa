using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControladorConPermisos
{
    private readonly UsuarioService _usuarioService;

    public UsuariosController(UsuarioService usuarioService, PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _usuarioService = usuarioService;
    }

    protected override int IdModulo => 2;
    protected override string NombreModulo => "Usuarios";

    [HttpGet]
    public async Task<ActionResult<List<UsuarioDto>>> ObtenerTodos()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _usuarioService.ObtenerTodosAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UsuarioDto>> ObtenerPorId(int id)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        var usuario = await _usuarioService.ObtenerPorIdAsync(id);
        if (usuario == null) return NotFound();
        return Ok(usuario);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<UsuarioDto>> Crear([FromBody] CrearUsuarioRequest request)
    {
        try
        {
            var usuario = await _usuarioService.CrearAsync(request);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = usuario.id_usuario }, usuario);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<UsuarioDto>> Actualizar(int id, [FromBody] ActualizarUsuarioRequest request)
    {
        try
        {
            var usuario = await _usuarioService.ActualizarAsync(id, request);
            if (usuario == null) return NotFound();
            return Ok(usuario);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            var result = await _usuarioService.EliminarAsync(id);
            if (!result) return NotFound();
            return Ok(new { message = "Usuario desactivado exitosamente" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
