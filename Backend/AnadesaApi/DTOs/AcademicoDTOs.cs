namespace AnadesaApi.DTOs;

// ========== Inscripción Académica ==========
public class InscripcionAcademicaDto
{
    public int id_inscripcion { get; set; }
    public int id_participante { get; set; }
    public int id_grado { get; set; }
    public int id_ciclo { get; set; }
    public DateTime fecha_inscripcion { get; set; }
    public string estado { get; set; } = string.Empty;
    public string? observaciones { get; set; }
    public string? grado_nombre { get; set; }
    public string? ciclo_anio { get; set; }
    public string? participante_nombre { get; set; }
}

public class CrearInscripcionRequest
{
    public int id_participante { get; set; }
    public int id_grado { get; set; }
    public int? id_ciclo { get; set; }
    public int? anio { get; set; }
    public string? observaciones { get; set; }
}

// ========== Historial Académico ==========
public class HistorialAcademicoDto
{
    public int id_historial { get; set; }
    public int id_participante { get; set; }
    public int id_grado { get; set; }
    public int id_ciclo { get; set; }
    public decimal? promedio_final { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }
    public DateTime fecha_registro { get; set; }
    public string? grado_nombre { get; set; }
    public string? ciclo_anio { get; set; }
}

public class CrearHistorialRequest
{
    public int id_participante { get; set; }
    public int id_grado { get; set; }
    public int id_ciclo { get; set; }
    public decimal? promedio_final { get; set; }
    public string? resultado { get; set; }
    public string? observaciones { get; set; }
}

// ========== Promedio ==========
public class PromedioDto
{
    public int id_promedio { get; set; }
    public int id_inscripcion { get; set; }
    public int id_bloque { get; set; }
    public decimal promedio { get; set; }
    public string? observaciones { get; set; }
    public DateTime fecha_registro { get; set; }
    public string? bloque_nombre { get; set; }
}

public class CrearPromedioRequest
{
    public int id_inscripcion { get; set; }
    public int id_bloque { get; set; }
    public decimal promedio { get; set; }
    public string? observaciones { get; set; }
}

// ========== Catálogos ==========
public class CicloEscolarDto
{
    public int id_ciclo { get; set; }
    public int anio { get; set; }
    public DateTime? fecha_inicio { get; set; }
    public DateTime? fecha_fin { get; set; }
    public bool estado { get; set; }
}

public class GradoDto
{
    public int id_grado { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? nivel { get; set; }
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}

public class BloqueAcademicoDto
{
    public int id_bloque { get; set; }
    public string nombre { get; set; } = string.Empty;
    public int numero_bloque { get; set; }
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}
