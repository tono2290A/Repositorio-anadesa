using System.Data.SqlClient;

namespace AnadesaApi.Services;

/// <summary>
/// Consultas auxiliares para validar el alcance por programa de un rol
/// (Facilitador Educacion / Facilitador Mujeres) en operaciones que trabajan
/// con ids (inscripciones, historiales, programaciones de actividad, grupos).
/// </summary>
public class AlcanceService
{
    private readonly IConfiguration _config;

    public AlcanceService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    /// <summary>tipo_programa ('Educacion' / 'Mujeres') de un participante.</summary>
    public Task<string?> TipoProgramaParticipanteAsync(int idParticipante) =>
        TextoAsync("EXEC sp_Alcance_TipoProgramaParticipante @id", idParticipante);

    /// <summary>Participante dueño de una inscripcion academica.</summary>
    public Task<int?> ParticipanteDeInscripcionAsync(int idInscripcion) =>
        EnteroAsync("EXEC sp_Alcance_ParticipanteDeInscripcion @id", idInscripcion);

    /// <summary>Participante dueño de un registro de historial academico.</summary>
    public Task<int?> ParticipanteDeHistorialAsync(int idHistorial) =>
        EnteroAsync("EXEC sp_Alcance_ParticipanteDeHistorial @id", idHistorial);

    /// <summary>Participante dueño de un promedio (via inscripcion).</summary>
    public Task<int?> ParticipanteDePromedioAsync(int idPromedio) =>
        EnteroAsync("EXEC sp_Alcance_ParticipanteDePromedio @id", idPromedio);

    /// <summary>Programa de una programacion de actividad.</summary>
    public Task<int?> ProgramaDeProgramacionAsync(int idProgramacion) =>
        EnteroAsync("EXEC sp_Alcance_ProgramaDeProgramacion @id", idProgramacion);

    /// <summary>Programa de una actividad del catalogo.</summary>
    public Task<int?> ProgramaDeActividadAsync(int idActividad) =>
        EnteroAsync("EXEC sp_Alcance_ProgramaDeActividad @id", idActividad);

    /// <summary>Programa de un grupo.</summary>
    public Task<int?> ProgramaDeGrupoAsync(int idGrupo) =>
        EnteroAsync("EXEC sp_Alcance_ProgramaDeGrupo @id", idGrupo);

    /// <summary>Grupo al que pertenece una asignacion grupo_participantes.</summary>
    public Task<int?> GrupoDeAsignacionAsync(int idGrupoParticipante) =>
        EnteroAsync("EXEC sp_Alcance_GrupoDeAsignacion @id", idGrupoParticipante);

    /* ----------------------------- internos ----------------------------- */

    private async Task<int?> EnteroAsync(string sql, int id)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("@id", id);
            var res = await cmd.ExecuteScalarAsync();
            return res is int i ? i : res is long l ? (int)l : null;
        }
        catch { return null; }
    }

    private async Task<string?> TextoAsync(string sql, int id)
    {
        try
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = sql;
            cmd.Parameters.AddWithValue("@id", id);
            var res = await cmd.ExecuteScalarAsync();
            return res as string;
        }
        catch { return null; }
    }
}
