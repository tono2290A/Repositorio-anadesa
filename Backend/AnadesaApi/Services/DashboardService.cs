using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class DashboardService
{
    private readonly IConfiguration _config;

    public DashboardService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    /// <summary>
    /// Estadisticas del dashboard. Cuando <paramref name="idPrograma"/> viene informado
    /// (rol con alcance por programa) solo se cuentan datos de ese programa;
    /// los usuarios permanecen globales (modulo 2, solo Administrador).
    /// </summary>
    public async Task<DashboardDto> ObtenerEstadisticasAsync(int? idPrograma = null)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Dashboard_ObtenerEstadisticas @idPrograma = @idPrograma";
            cmd.Parameters.AddWithValue("@idPrograma", (object?)idPrograma ?? DBNull.Value);
            using var r = cmd.ExecuteReader();
            if (r.Read())
            {
                return new DashboardDto
                {
                    TotalParticipantes = r.GetInt32(0),
                    ParticipantesActivos = r.GetInt32(0),
                    TotalMonitoreos = r.GetInt32(1),
                    TotalEvaluaciones = r.GetInt32(2),
                    TotalActividades = r.GetInt32(3),
                    TotalUsuarios = r.GetInt32(4),
                    TotalGrupos = r.GetInt32(5)
                };
            }
            return new DashboardDto();
        });
    }

    /// <summary>
    /// Ultimos registros del sistema (participantes, monitoreos, evaluaciones, grupos y actividades)
    /// ordenados por fecha. Si <paramref name="idPrograma"/> viene informado solo se devuelven
    /// registros de ese programa; los usuarios (globales, modulo 2) se excluyen en ese caso.
    /// </summary>
    public async Task<List<ActividadRecienteDto>> ObtenerActividadRecienteAsync(int? idPrograma = null, int limite = 15)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Dashboard_ObtenerActividadReciente @limite = @limite, @idPrograma = @idPrograma";
            cmd.Parameters.AddWithValue("@limite", limite);
            cmd.Parameters.AddWithValue("@idPrograma", (object?)idPrograma ?? DBNull.Value);

            var lista = new List<ActividadRecienteDto>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                lista.Add(new ActividadRecienteDto
                {
                    tipo = r.GetString(0),
                    titulo = r.GetString(1),
                    detalle = r.IsDBNull(2) ? string.Empty : r.GetString(2),
                    fecha = r.GetDateTime(3),
                    id_programa = r.IsDBNull(4) ? null : r.GetInt32(4),
                    estado = r.IsDBNull(5) ? null : r.GetString(5),
                    responsable = r.IsDBNull(6) ? null : r.GetString(6),
                    fecha_programada = r.IsDBNull(7) ? null : r.GetDateTime(7),
                    id_actividad = r.IsDBNull(8) ? null : r.GetInt32(8),
                    id_programacion = r.IsDBNull(9) ? null : r.GetInt32(9)
                });
            }
            return lista;
        });
    }

    /// <summary>
    /// Cosas pendientes del sistema (alertas del panel del dashboard): actividades vencidas,
    /// programaciones sin monitoreo, evaluaciones sin resultados y becas sin monto.
    /// Solo se devuelven las que tienen cantidad > 0.
    /// </summary>
    public async Task<List<PendienteDto>> ObtenerPendientesAsync(int? idPrograma = null)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Dashboard_ObtenerPendientes @idPrograma = @idPrograma";
            cmd.Parameters.AddWithValue("@idPrograma", (object?)idPrograma ?? DBNull.Value);

            var descripciones = new Dictionary<string, (string titulo, string detalle, string severidad)>
            {
                ["actividad_vencida"] = ("Actividad programada vencida",
                    "Quedaron programaciones con fecha pasada en estado \"Programada\".", "alta"),
                ["sin_monitoreo"] = ("Programacion sin monitoreo",
                    "Programaciones pasadas que no tienen registro de monitoreo.", "media"),
                ["evaluacion_sin_resultado"] = ("Evaluacion sin resultados",
                    "Evaluaciones sin criterios ni resultado cargados.", "alta"),
                ["beca_sin_monto"] = ("Beca sin monto asignado",
                    "Participantes con beca activa pero sin monto definido.", "media")
            };
            var orden = new Dictionary<string, int> { ["alta"] = 0, ["media"] = 1, ["baja"] = 2 };

            var pendientes = new List<PendienteDto>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                var tipo = r.GetString(0);
                var cantidad = r.GetInt32(1);
                if (cantidad <= 0 || !descripciones.ContainsKey(tipo)) continue;
                var (titulo, detalle, severidad) = descripciones[tipo];
                pendientes.Add(new PendienteDto
                {
                    tipo = tipo, titulo = titulo, detalle = detalle,
                    severidad = severidad, cantidad = cantidad
                });
            }
            return pendientes.OrderBy(p => orden.GetValueOrDefault(p.severidad, 9)).ToList();
        });
    }
}
