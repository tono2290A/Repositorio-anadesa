namespace AnadesaApi.Services;

public static class RutasArchivos
{
    private static readonly Lazy<string?> _raizProyecto = new(BuscarRaizProyecto);

    public static string? RaizProyecto => _raizProyecto.Value;

    private static string? BuscarRaizProyecto()
    {
        try
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null)
            {
                if (File.Exists(Path.Combine(dir.FullName, "AnadesaApi.csproj"))) return dir.FullName;
                dir = dir.Parent;
            }
        }
        catch
        {
            return null;
        }
        return null;
    }

    public static string RaizWeb(IWebHostEnvironment env)
    {
        if (RaizProyecto != null)
        {
            var raiz = Path.Combine(RaizProyecto, "wwwroot");
            Directory.CreateDirectory(raiz);
            return raiz;
        }

        if (!string.IsNullOrWhiteSpace(env.WebRootPath))
            return env.WebRootPath;

        return Path.Combine(env.ContentRootPath, "wwwroot");
    }

    public static string DirectorioFotos(IWebHostEnvironment env)
    {
        var dir = Path.Combine(RaizWeb(env), "fotos");
        Directory.CreateDirectory(dir);
        return dir;
    }

    public static string? DirectorioWebRaiz(IWebHostEnvironment env)
    {
        var raiz = RaizWeb(env);
        return Directory.Exists(raiz) ? Path.GetFullPath(raiz) : null;
    }
}
