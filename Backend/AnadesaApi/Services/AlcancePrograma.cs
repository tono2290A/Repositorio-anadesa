using System.Security.Claims;

namespace AnadesaApi.Services;

/// <summary>
/// Alcance por programa del rol (aislamiento Educacion / Mujeres):
///  - Facilitador de Educacion -> "Educac" (solo el Programa de Educacion: ninos, ninas y jovenes)
///  - Facilitador de Mujeres   -> "Mujer"  (solo el Programa de Mujeres)
///  - Administrador / Coordinador / sin rol de facilitador -> null (ven ambos programas)
/// El fragmento se compara contra programas.tipo_programa con LIKE '%fragmento%'
/// (igual que los SPs de Monitoreo y Evaluacion).
/// </summary>
public static class AlcancePrograma
{
    public static string? DesdeRoles(IEnumerable<string>? roles)
    {
        if (roles == null) return null;
        var lista = roles.Where(r => !string.IsNullOrWhiteSpace(r)).ToList();

        // Administrador y Coordinador operan sobre los dos programas.
        if (lista.Any(r => r.Contains("Administrador", StringComparison.OrdinalIgnoreCase))) return null;
        if (lista.Any(r => r.Contains("Coordinador", StringComparison.OrdinalIgnoreCase))) return null;

        foreach (var rol in lista)
        {
            if (!rol.Contains("Facilitador", StringComparison.OrdinalIgnoreCase)) continue;
            if (rol.Contains("Educaci", StringComparison.OrdinalIgnoreCase)) return "Educac";
            if (rol.Contains("Mujer", StringComparison.OrdinalIgnoreCase)) return "Mujer";
        }
        return null;
    }

    public static string? DesdeUsuario(ClaimsPrincipal? usuario)
    {
        if (usuario == null) return null;
        var roles = usuario.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value);
        return DesdeRoles(roles);
    }

    /// <summary>True cuando el nombre/tipo de programa recibido esta dentro del alcance.</summary>
    public static bool Coincide(string? alcance, string? nombrePrograma)
    {
        if (alcance == null) return true;
        if (string.IsNullOrWhiteSpace(nombrePrograma)) return false;
        return nombrePrograma.Contains(alcance, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Convierte el fragmento de alcance en el id_programa (NULL si no aplica).</summary>
    public static int? IdPorFragmento(string? alcance) => alcance?.ToUpperInvariant() switch
    {
        "EDUCAC" => 1,
        "MUJER" => 2,
        _ => null
    };
}
