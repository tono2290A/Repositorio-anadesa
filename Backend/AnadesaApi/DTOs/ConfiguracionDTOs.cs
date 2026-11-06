namespace AnadesaApi.DTOs;

public class AparienciaDto
{
    public string nombre_sistema { get; set; } = "ANADESA";
    public string color_primario { get; set; } = "#1E3278";
    public string color_acento { get; set; } = "#26781E";
    public string tamano_fuente { get; set; } = "mediana";
    public string? logo { get; set; }
    public string? imagen_login { get; set; }
    public DateTime? actualizado_en { get; set; }
}

public class BackupDto
{
    public string archivo { get; set; } = string.Empty;
    public DateTime fecha { get; set; }
    public long tamano_bytes { get; set; }
    /// <summary>Manual | Automatico (según historial).</summary>
    public string tipo { get; set; } = "Manual";
    /// <summary>false = el registro existe en el historial pero el archivo ya no está en disco.</summary>
    public bool existe { get; set; } = true;
}

public class BackupConfigDto
{
    public bool activo { get; set; }
    /// <summary>horario | diario | semanal | mensual | anual</summary>
    public string intervalo { get; set; } = "diario";
    /// <summary>HH:mm</summary>
    public string hora { get; set; } = "02:00";
    public DateTime? proxima_ejecucion { get; set; }
    public DateTime? ultimo_respaldo { get; set; }
    public DateTime? actualizado_en { get; set; }
}

public class GuardarBackupConfigDto
{
    public bool activo { get; set; }
    public string intervalo { get; set; } = "diario";
    public string hora { get; set; } = "02:00";
}
