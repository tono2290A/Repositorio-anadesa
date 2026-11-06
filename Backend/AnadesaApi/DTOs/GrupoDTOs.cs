namespace AnadesaApi.DTOs;

public class GrupoDto
{
    public int id_grupo { get; set; }
    public int id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
    public DateTime fecha_creacion { get; set; }
    public string? programa_nombre { get; set; }
    public int cantidad_participantes { get; set; }
    public List<GrupoParticipanteDto>? participantes { get; set; }
}

public class CrearGrupoRequest
{
    public int id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; } = true;
}

public class ActualizarGrupoRequest
{
    public int id_programa { get; set; }
    public string nombre { get; set; } = string.Empty;
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}

public class GrupoParticipanteDto
{
    public int id_grupo_participante { get; set; }
    public int id_grupo { get; set; }
    public int id_participante { get; set; }
    public string? participante_nombre { get; set; }
    public DateTime fecha_ingreso { get; set; }
    public DateTime? fecha_salida { get; set; }
    public bool estado { get; set; }
}

public class AsignarParticipanteGrupoRequest
{
    public int id_participante { get; set; }
}
