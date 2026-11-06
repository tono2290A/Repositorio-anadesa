using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly PermisoService _permisoService;

    public AuthController(AuthService authService, PermisoService permisoService)
    {
        _authService = authService;
        _permisoService = permisoService;
    }

    [HttpPost("login")]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        return _authService.Login(request, out var mensaje) is LoginResponse result
            ? Ok(result)
            : Unauthorized(new { message = mensaje });
    }

    /// <summary>
    /// Permisos del usuario autenticado agrupados por modulo.
    /// Se consume al iniciar sesion para habilitar/deshabilitar controles.
    /// </summary>
    [HttpGet("permisos")]
    [Authorize]
    public async Task<ActionResult<List<PermisoModuloDto>>> Permisos()
    {
        var idTexto = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idTexto, out var idUsuario))
            return Unauthorized();

        return Ok(await _permisoService.ObtenerPermisosAsync(idUsuario));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        bool result;
        try
        {
            result = await _authService.ForgotPasswordAsync(request);
        }
        catch (InvalidOperationException ex) when (ex.Message == "EMAIL_NO_ENVIADO")
        {
            return StatusCode(StatusCodes.Status502BadGateway,
                new { message = "No se pudo enviar el correo de recuperación. Contacte al administrador del sistema." });
        }
        if (!result)
            return Ok(new { message = "Si el correo existe, se envió un código de recuperación" });
        return Ok(new { message = "Código de recuperación enviado a su correo electrónico" });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request);
        if (!result)
            return BadRequest(new { message = "Código inválido o expirado" });
        return Ok(new { message = "Contraseña actualizada exitosamente" });
    }
}
