using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControladorConPermisos
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService, PermisoService permisoService, AlcanceService alcance)
        : base(permisoService, alcance)
    {
        _dashboardService = dashboardService;
    }

    protected override int IdModulo => 1;
    protected override string NombreModulo => "Dashboard";

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> ObtenerEstadisticas()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _dashboardService.ObtenerEstadisticasAsync(IdProgramaDelAlcance));
    }

    /// <summary>Historial de actividad reciente para el panel lateral del dashboard.</summary>
    [HttpGet("actividad-reciente")]
    public async Task<ActionResult<List<ActividadRecienteDto>>> ActividadReciente([FromQuery] int limite = 15)
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        if (limite <= 0 || limite > 50) limite = 15;
        return Ok(await _dashboardService.ObtenerActividadRecienteAsync(IdProgramaDelAlcance, limite));
    }

    /// <summary>Alertas / pendientes del sistema para el panel lateral del dashboard.</summary>
    [HttpGet("pendientes")]
    public async Task<ActionResult<List<PendienteDto>>> Pendientes()
    {
        if (!Puede(await PermisosModulo(), "Consultar")) return SinPermiso("consultar");
        return Ok(await _dashboardService.ObtenerPendientesAsync(IdProgramaDelAlcance));
    }
}
