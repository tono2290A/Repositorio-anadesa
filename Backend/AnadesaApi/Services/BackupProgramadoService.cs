namespace AnadesaApi.Services;

/// <summary>
/// Ejecuta los respaldos automáticos programados en Configuración → Copia de seguridad.
/// Cada 45 segundos consulta la programación (tabla configuracion_backup) y, si la
/// próxima ejecución ya pasó, crea un respaldo real con SQL Server (tipo "Automatico")
/// y recalcula la siguiente fecha. Todo ocurre en el servidor: no depende del navegador.
/// </summary>
public sealed class BackupProgramadoService : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<BackupProgramadoService> _logger;

    public BackupProgramadoService(IServiceScopeFactory scopes, ILogger<BackupProgramadoService> logger)
    {
        _scopes = scopes;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Servicio de respaldos automáticos iniciado (cada 45 s)");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await VerificarAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el ciclo del respaldo automático");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
        _logger.LogInformation("Servicio de respaldos automáticos detenido");
    }

    private async Task VerificarAsync(CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var svc = scope.ServiceProvider.GetRequiredService<BackupService>();

        var cfg = await svc.ObtenerConfigAsync();
        if (cfg is not { activo: true }) return;
        if (cfg.proxima_ejecucion is null) return;
        if (DateTime.Now < cfg.proxima_ejecucion.Value) return;

        _logger.LogInformation("Ejecutando respaldo automático programado (próxima era {Proxima})", cfg.proxima_ejecucion);

        bool exito = false;
        try
        {
            await svc.CrearAsync(idUsuario: null, tipo: "Automatico");
            exito = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "El respaldo automático programado falló");
        }
        finally
        {
            try
            {
                await svc.MarcarEjecucionAsync(exito);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo actualizar la programación tras la ejecución");
            }
        }
    }
}
