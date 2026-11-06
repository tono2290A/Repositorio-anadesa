using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using AnadesaApi.DTOs;
using AnadesaApi.Services;

namespace AnadesaApi.Controllers;

/// <summary>
/// Base para controllers cuyas rutas exigen permisos por modulo (tabla rol_modulo_permisos).
/// Cada controller indica su id_modulo y valida antes de ejecutar la accion.
/// </summary>
[ApiController]
public abstract class ControladorConPermisos : ControllerBase
{
    private readonly PermisoService _permisoService;
    protected readonly AlcanceService _alcance;

    protected ControladorConPermisos(PermisoService permisoService, AlcanceService alcance)
    {
        _permisoService = permisoService;
        _alcance = alcance;
    }

    /// <summary>Id del modulo en la tabla modulos.</summary>
    protected abstract int IdModulo { get; }

    /// <summary>Nombre del modulo (para el mensaje 403).</summary>
    protected abstract string NombreModulo { get; }

    protected int IdUsuario =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

    protected async Task<List<string>?> PermisosModulo()
    {
        var todos = await _permisoService.ObtenerPermisosAsync(IdUsuario);
        return todos.FirstOrDefault(m => m.id_modulo == IdModulo)?.permisos;
    }

    /// <summary>Todos los modulos con permisos del usuario (para controllers multi-modulo).</summary>
    protected Task<List<PermisoModuloDto>> TodosLosPermisos() =>
        _permisoService.ObtenerPermisosAsync(IdUsuario);

    protected static bool Puede(List<string>? permisos, params string[] requeridos) =>
        permisos != null && requeridos.Any(r => permisos.Contains(r));

    protected ActionResult SinPermiso(string accion) =>
        StatusCode(StatusCodes.Status403Forbidden,
            new { message = $"No tiene permiso para {accion} en el modulo de {NombreModulo}." });

    /* ------------------------- ALCANCE POR PROGRAMA ------------------------- */

    /// <summary>
    /// Alcance del rol: "Educac" (solo Educacion), "Mujer" (solo Mujeres)
    /// o null (Administrador y Coordinador ven los dos programas).
    /// </summary>
    protected string? Alcance => AlcancePrograma.DesdeUsuario(User);

    /// <summary>True si el registro (por nombre/tipo de programa) pertenece al alcance del rol.</summary>
    protected bool DeMiPrograma(string? nombrePrograma) => AlcancePrograma.Coincide(Alcance, nombrePrograma);

    /// <summary>True si el id_programa recibido coincide con el alcance del rol.</summary>
    protected bool DeMiPrograma(int idPrograma)
    {
        var esperado = AlcancePrograma.IdPorFragmento(Alcance);
        return esperado == null || esperado == idPrograma;
    }

    /// <summary>403 cuando el registro pertenece al programa de otro rol.</summary>
    protected ActionResult ProgramaAjeno() =>
        StatusCode(StatusCodes.Status403Forbidden,
            new { message = "El registro pertenece a otro programa. Solo puede operar sobre el programa que le corresponde." });

    /// <summary>id_programa correspondiente al alcance del rol (null = sin alcance).</summary>
    protected int? IdProgramaDelAlcance => AlcancePrograma.IdPorFragmento(Alcance);

    /// <summary>True si el participante pertenece al programa del rol.</summary>
    protected async Task<bool> ParticipanteEnAlcanceAsync(int idParticipante)
    {
        if (Alcance == null) return true;
        return AlcancePrograma.Coincide(Alcance,
            await _alcance.TipoProgramaParticipanteAsync(idParticipante));
    }
}
