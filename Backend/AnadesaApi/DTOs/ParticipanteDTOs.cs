namespace AnadesaApi.DTOs;

public class ParticipanteDto
{
    public int id_participante { get; set; }
    public int id_programa { get; set; }
    public int? id_proyecto { get; set; }
    public int id_categoria { get; set; }
    public int? id_comunidad { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string? tercer_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string? tercer_apellido { get; set; }
    public DateTime fecha_nacimiento { get; set; }
    public string? sexo { get; set; }
    public string? dpi { get; set; }
    public string? telefono { get; set; }
    public string? correo { get; set; }
    public bool estado { get; set; }
    public DateTime fecha_registro { get; set; }
    public bool? beca { get; set; }
    public decimal? monto_beca { get; set; }
    public string? programa_nombre { get; set; }
    public string? categoria_nombre { get; set; }
    public string? comunidad_nombre { get; set; }
    public ContactoParticipanteDto? Contacto { get; set; }
    public DireccionDto? Direccion { get; set; }
    public List<FamiliarDto>? Familiares { get; set; }
    public string? fotografia_ruta { get; set; }
}

public class AsistenciaParticipanteDto
{
    public int id_asistencia { get; set; }
    public DateTime? fecha { get; set; }
    public string? actividad { get; set; }
    public string? tipo_actividad { get; set; }
    public bool presente { get; set; }
    public string? hora_registro { get; set; }
    public string? observaciones { get; set; }
}

public class CrearParticipanteRequest
{
    public int id_programa { get; set; }
    public int? id_proyecto { get; set; }
    public int id_categoria { get; set; }
    public int? id_comunidad { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string? tercer_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string? tercer_apellido { get; set; }
    public DateTime fecha_nacimiento { get; set; }
    public string? sexo { get; set; }
    public string? dpi { get; set; }
    public string? telefono { get; set; }
    public string? correo { get; set; }
    public bool estado { get; set; } = true;
    public bool? beca { get; set; }
    public decimal? monto_beca { get; set; }
    public ContactoParticipanteRequest? Contacto { get; set; }
    public DireccionRequest? Direccion { get; set; }
    public List<FamiliarRequest>? Familiares { get; set; }
}

public class ContactoParticipanteDto
{
    public int id_contacto { get; set; }
    public string? telefono_principal { get; set; }
    public string? telefono_secundario { get; set; }
    public string? correo { get; set; }
    public string? contacto_emergencia { get; set; }
    public string? telefono_emergencia { get; set; }
}

public class ContactoParticipanteRequest
{
    public string? telefono_principal { get; set; }
    public string? telefono_secundario { get; set; }
    public string? correo { get; set; }
    public string? contacto_emergencia { get; set; }
    public string? telefono_emergencia { get; set; }
}

public class DireccionDto
{
    public int id_direccion { get; set; }
    public int? id_comunidad { get; set; }
    public string? direccion { get; set; }
    public string? referencia { get; set; }
}

public class DireccionRequest
{
    public int? id_comunidad { get; set; }
    public string? direccion { get; set; }
    public string? referencia { get; set; }
}

public class FamiliarDto
{
    public int id_familiar { get; set; }
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string? dpi { get; set; }
    public string? telefono { get; set; }
    public string? correo { get; set; }
    public string? parentesco { get; set; }
    public bool responsable { get; set; }
}

public class FamiliarRequest
{
    public string primer_nombre { get; set; } = string.Empty;
    public string? segundo_nombre { get; set; }
    public string primer_apellido { get; set; } = string.Empty;
    public string? segundo_apellido { get; set; }
    public string? dpi { get; set; }
    public string? telefono { get; set; }
    public string? correo { get; set; }
    public string parentesco { get; set; } = string.Empty;
    public bool responsable { get; set; }
}

public class DashboardDto
{
    public int TotalParticipantes { get; set; }
    public int ParticipantesActivos { get; set; }
    public int TotalMonitoreos { get; set; }
    public int TotalEvaluaciones { get; set; }
    public int TotalActividades { get; set; }
    public int TotalUsuarios { get; set; }
    public int TotalGrupos { get; set; }
}
