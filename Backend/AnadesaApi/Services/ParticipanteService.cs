using System.Data.SqlClient;
using AnadesaApi.DTOs;

namespace AnadesaApi.Services;

public class ParticipanteService
{
    private readonly IConfiguration _config;

    public ParticipanteService(IConfiguration config)
    {
        _config = config;
    }

    private SqlConnection CreateConnection() => new(_config.GetConnectionString("DefaultConnection"));

    public async Task<List<ParticipanteDto>> ObtenerTodosAsync(string? programa = null)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_ListarParticipantesActivos";
            using var r = cmd.ExecuteReader();
            var list = new List<ParticipanteDto>();
            while (r.Read())
            {
                list.Add(new ParticipanteDto
                {
                    id_participante = r.GetInt32(r.GetOrdinal("IdParticipante")),
                    id_programa = r.GetInt32(r.GetOrdinal("IdPrograma")),
                    id_proyecto = r.IsDBNull(r.GetOrdinal("IdProyecto")) ? null : r.GetInt32(r.GetOrdinal("IdProyecto")),
                    id_categoria = r.GetInt32(r.GetOrdinal("IdCategoria")),
                    id_comunidad = r.IsDBNull(r.GetOrdinal("IdComunidad")) ? null : r.GetInt32(r.GetOrdinal("IdComunidad")),
                    primer_nombre = r.GetString(r.GetOrdinal("PrimerNombre")),
                    segundo_nombre = r.IsDBNull(r.GetOrdinal("SegundoNombre")) ? null : r.GetString(r.GetOrdinal("SegundoNombre")),
                    tercer_nombre = r.IsDBNull(r.GetOrdinal("TercerNombre")) ? null : r.GetString(r.GetOrdinal("TercerNombre")),
                    primer_apellido = r.GetString(r.GetOrdinal("PrimerApellido")),
                    segundo_apellido = r.IsDBNull(r.GetOrdinal("SegundoApellido")) ? null : r.GetString(r.GetOrdinal("SegundoApellido")),
                    tercer_apellido = r.IsDBNull(r.GetOrdinal("TercerApellido")) ? null : r.GetString(r.GetOrdinal("TercerApellido")),
                    fecha_nacimiento = r.GetDateTime(r.GetOrdinal("FechaNacimiento")),
                    sexo = r.IsDBNull(r.GetOrdinal("Sexo")) ? null : r.GetString(r.GetOrdinal("Sexo")),
                    dpi = r.IsDBNull(r.GetOrdinal("Dpi")) ? null : r.GetString(r.GetOrdinal("Dpi")),
                    telefono = r.IsDBNull(r.GetOrdinal("Telefono")) ? null : r.GetString(r.GetOrdinal("Telefono")),
                    correo = r.IsDBNull(r.GetOrdinal("Correo")) ? null : r.GetString(r.GetOrdinal("Correo")),
                    estado = r.GetBoolean(r.GetOrdinal("Estado")),
                    fecha_registro = r.GetDateTime(r.GetOrdinal("FechaRegistro")),
                    programa_nombre = r.IsDBNull(r.GetOrdinal("NombrePrograma")) ? null : r.GetString(r.GetOrdinal("NombrePrograma")),
                    categoria_nombre = r.IsDBNull(r.GetOrdinal("NombreCategoria")) ? null : r.GetString(r.GetOrdinal("NombreCategoria")),
                    comunidad_nombre = r.IsDBNull(r.GetOrdinal("NombreComunidad")) ? null : r.GetString(r.GetOrdinal("NombreComunidad")),
                    fotografia_ruta = r.IsDBNull(r.GetOrdinal("FotoUrl")) ? null : r.GetString(r.GetOrdinal("FotoUrl")),
                    beca = r.IsDBNull(r.GetOrdinal("Beca")) ? false : r.GetBoolean(r.GetOrdinal("Beca")),
                    monto_beca = r.IsDBNull(r.GetOrdinal("MontoBeca")) ? 0 : r.GetDecimal(r.GetOrdinal("MontoBeca"))
                });
            }
            // Filtro por programa (alcance del rol): 'Educac' o 'Mujer'.
            if (!string.IsNullOrWhiteSpace(programa))
            {
                var frag = programa.Trim().ToUpperInvariant() switch
                {
                    "EDUCACION" => "Educac",
                    "MUJERES" => "Mujer",
                    _ => programa.Trim()
                };
                list = list.Where(p => !string.IsNullOrWhiteSpace(p.programa_nombre)
                    && p.programa_nombre.Contains(frag, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            return list;
        });
    }

    public async Task<ParticipanteDto?> ObtenerPorIdAsync(int id)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var conn = CreateConnection();
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "EXEC sp_ObtenerParticipantePorId @id_participante";
                cmd.Parameters.AddWithValue("@id_participante", id);
                using var r = cmd.ExecuteReader();
                if (!r.Read()) return null;

                var dto = new ParticipanteDto
                {
                    id_participante = r.GetInt32(r.GetOrdinal("IdParticipante")),
                    id_programa = r.GetInt32(r.GetOrdinal("IdPrograma")),
                    id_proyecto = r.IsDBNull(r.GetOrdinal("IdProyecto")) ? null : r.GetInt32(r.GetOrdinal("IdProyecto")),
                    id_categoria = r.GetInt32(r.GetOrdinal("IdCategoria")),
                    id_comunidad = r.IsDBNull(r.GetOrdinal("IdComunidad")) ? null : r.GetInt32(r.GetOrdinal("IdComunidad")),
                    primer_nombre = r.GetString(r.GetOrdinal("PrimerNombre")),
                    segundo_nombre = r.IsDBNull(r.GetOrdinal("SegundoNombre")) ? null : r.GetString(r.GetOrdinal("SegundoNombre")),
                    tercer_nombre = r.IsDBNull(r.GetOrdinal("TercerNombre")) ? null : r.GetString(r.GetOrdinal("TercerNombre")),
                    primer_apellido = r.GetString(r.GetOrdinal("PrimerApellido")),
                    segundo_apellido = r.IsDBNull(r.GetOrdinal("SegundoApellido")) ? null : r.GetString(r.GetOrdinal("SegundoApellido")),
                    tercer_apellido = r.IsDBNull(r.GetOrdinal("TercerApellido")) ? null : r.GetString(r.GetOrdinal("TercerApellido")),
                    fecha_nacimiento = r.GetDateTime(r.GetOrdinal("FechaNacimiento")),
                    sexo = r.IsDBNull(r.GetOrdinal("Sexo")) ? null : r.GetString(r.GetOrdinal("Sexo")),
                    dpi = r.IsDBNull(r.GetOrdinal("Dpi")) ? null : r.GetString(r.GetOrdinal("Dpi")),
                    telefono = r.IsDBNull(r.GetOrdinal("Telefono")) ? null : r.GetString(r.GetOrdinal("Telefono")),
                    correo = r.IsDBNull(r.GetOrdinal("Correo")) ? null : r.GetString(r.GetOrdinal("Correo")),
                    estado = r.GetBoolean(r.GetOrdinal("Estado")),
                    fecha_registro = r.GetDateTime(r.GetOrdinal("FechaRegistro")),
                    programa_nombre = r.IsDBNull(r.GetOrdinal("NombrePrograma")) ? null : r.GetString(r.GetOrdinal("NombrePrograma")),
                    categoria_nombre = r.IsDBNull(r.GetOrdinal("NombreCategoria")) ? null : r.GetString(r.GetOrdinal("NombreCategoria")),
                    comunidad_nombre = r.IsDBNull(r.GetOrdinal("NombreComunidad")) ? null : r.GetString(r.GetOrdinal("NombreComunidad")),
                    fotografia_ruta = r.IsDBNull(r.GetOrdinal("FotoUrl")) ? null : r.GetString(r.GetOrdinal("FotoUrl")),
                    beca = r.IsDBNull(r.GetOrdinal("Beca")) ? false : r.GetBoolean(r.GetOrdinal("Beca")),
                    monto_beca = r.IsDBNull(r.GetOrdinal("MontoBeca")) ? 0 : r.GetDecimal(r.GetOrdinal("MontoBeca")),
                    Familiares = new List<FamiliarDto>()
                };

                if (r.NextResult())
                {
                    while (r.Read())
                    {
                        dto.Familiares.Add(new FamiliarDto
                        {
                            primer_nombre = r.IsDBNull(r.GetOrdinal("primer_nombre")) ? "" : r.GetString(r.GetOrdinal("primer_nombre")),
                            segundo_nombre = r.IsDBNull(r.GetOrdinal("segundo_nombre")) ? null : r.GetString(r.GetOrdinal("segundo_nombre")),
                            primer_apellido = r.IsDBNull(r.GetOrdinal("primer_apellido")) ? "" : r.GetString(r.GetOrdinal("primer_apellido")),
                            segundo_apellido = r.IsDBNull(r.GetOrdinal("segundo_apellido")) ? null : r.GetString(r.GetOrdinal("segundo_apellido")),
                            dpi = r.IsDBNull(r.GetOrdinal("dpi")) ? null : r.GetString(r.GetOrdinal("dpi")),
                            telefono = r.IsDBNull(r.GetOrdinal("telefono")) ? null : r.GetString(r.GetOrdinal("telefono")),
                            correo = r.IsDBNull(r.GetOrdinal("correo")) ? null : r.GetString(r.GetOrdinal("correo")),
                            parentesco = r.IsDBNull(r.GetOrdinal("parentesco")) ? null : r.GetString(r.GetOrdinal("parentesco")),
                            responsable = !r.IsDBNull(r.GetOrdinal("responsable")) && r.GetBoolean(r.GetOrdinal("responsable"))
                        });
                    }
                }

                if (r.NextResult() && r.Read())
                {
                    dto.Contacto = new ContactoParticipanteDto
                    {
                        telefono_principal = r.IsDBNull(r.GetOrdinal("telefono_principal")) ? null : r.GetString(r.GetOrdinal("telefono_principal")),
                        telefono_secundario = r.IsDBNull(r.GetOrdinal("telefono_secundario")) ? null : r.GetString(r.GetOrdinal("telefono_secundario")),
                        correo = r.IsDBNull(r.GetOrdinal("correo")) ? null : r.GetString(r.GetOrdinal("correo")),
                        contacto_emergencia = r.IsDBNull(r.GetOrdinal("contacto_emergencia")) ? null : r.GetString(r.GetOrdinal("contacto_emergencia")),
                        telefono_emergencia = r.IsDBNull(r.GetOrdinal("telefono_emergencia")) ? null : r.GetString(r.GetOrdinal("telefono_emergencia"))
                    };
                }

                if (r.NextResult() && r.Read())
                {
                    dto.Direccion = new DireccionDto
                    {
                        id_comunidad = r.IsDBNull(r.GetOrdinal("id_comunidad")) ? null : r.GetInt32(r.GetOrdinal("id_comunidad")),
                        direccion = r.IsDBNull(r.GetOrdinal("direccion")) ? null : r.GetString(r.GetOrdinal("direccion")),
                        referencia = r.IsDBNull(r.GetOrdinal("referencia")) ? null : r.GetString(r.GetOrdinal("referencia"))
                    };
                }

                return dto;
            }
            catch { return null; }
        });
    }

    public async Task<ParticipanteDto> CrearAsync(CrearParticipanteRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_CrearParticipante @id_programa, @id_proyecto, @id_categoria, @id_comunidad, @primer_nombre, @segundo_nombre, @tercer_nombre, @primer_apellido, @segundo_apellido, @tercer_apellido, @fecha_nacimiento, @sexo, @dpi, @telefono, @correo, @beca, @monto_beca, @nombre_archivo, @ruta_fotografia, @tutor_primer_nombre, @tutor_segundo_nombre, @tutor_primer_apellido, @tutor_segundo_apellido, @tutor_parentesco, @tutor_dpi, @tutor_telefono, @nuevo_id OUTPUT";
            cmd.Parameters.AddWithValue("@id_programa", request.id_programa);
            cmd.Parameters.AddWithValue("@id_proyecto", (object?)request.id_proyecto ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@id_categoria", request.id_categoria);
            cmd.Parameters.AddWithValue("@id_comunidad", (object?)request.id_comunidad ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@primer_nombre", request.primer_nombre);
            cmd.Parameters.AddWithValue("@segundo_nombre", (object?)request.segundo_nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tercer_nombre", (object?)request.tercer_nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@primer_apellido", request.primer_apellido);
            cmd.Parameters.AddWithValue("@segundo_apellido", (object?)request.segundo_apellido ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tercer_apellido", (object?)request.tercer_apellido ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fecha_nacimiento", request.fecha_nacimiento);
            cmd.Parameters.AddWithValue("@sexo", (object?)request.sexo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@dpi", (object?)request.dpi ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@telefono", (object?)request.telefono ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@correo", (object?)request.correo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@beca", (object?)request.beca ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@monto_beca", (object?)request.monto_beca ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@nombre_archivo", DBNull.Value);
            cmd.Parameters.AddWithValue("@ruta_fotografia", DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_primer_nombre", request.Familiares != null && request.Familiares.Any() ? request.Familiares[0].primer_nombre : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_segundo_nombre", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].segundo_nombre ?? DBNull.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_primer_apellido", request.Familiares != null && request.Familiares.Any() ? request.Familiares[0].primer_apellido : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_segundo_apellido", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].segundo_apellido ?? DBNull.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_parentesco", request.Familiares != null && request.Familiares.Any() ? request.Familiares[0].parentesco : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_dpi", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].dpi ?? DBNull.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_telefono", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].telefono ?? DBNull.Value : DBNull.Value);
            var outId = cmd.Parameters.Add("@nuevo_id", System.Data.SqlDbType.Int);
            outId.Direction = System.Data.ParameterDirection.Output;
            cmd.ExecuteNonQuery();
            var newId = (int)outId.Value;
            return ObtenerPorIdAsync(newId).Result!;
        });
    }

    public async Task<ParticipanteDto?> ActualizarAsync(int id, CrearParticipanteRequest request)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_ActualizarParticipante @id_participante, @id_programa, @id_proyecto, @id_categoria, @id_comunidad, @primer_nombre, @segundo_nombre, @tercer_nombre, @primer_apellido, @segundo_apellido, @tercer_apellido, @fecha_nacimiento, @sexo, @dpi, @telefono, @correo, @estado, @beca, @monto_beca, @nombre_archivo, @ruta_fotografia, @tutor_primer_nombre, @tutor_segundo_nombre, @tutor_primer_apellido, @tutor_segundo_apellido, @tutor_parentesco, @tutor_dpi, @tutor_telefono";
            cmd.Parameters.AddWithValue("@id_participante", id);
            cmd.Parameters.AddWithValue("@id_programa", request.id_programa);
            cmd.Parameters.AddWithValue("@id_proyecto", (object?)request.id_proyecto ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@id_categoria", request.id_categoria);
            cmd.Parameters.AddWithValue("@id_comunidad", (object?)request.id_comunidad ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@primer_nombre", request.primer_nombre);
            cmd.Parameters.AddWithValue("@segundo_nombre", (object?)request.segundo_nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tercer_nombre", (object?)request.tercer_nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@primer_apellido", request.primer_apellido);
            cmd.Parameters.AddWithValue("@segundo_apellido", (object?)request.segundo_apellido ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@tercer_apellido", (object?)request.tercer_apellido ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@fecha_nacimiento", request.fecha_nacimiento);
            cmd.Parameters.AddWithValue("@sexo", (object?)request.sexo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@dpi", (object?)request.dpi ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@telefono", (object?)request.telefono ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@correo", (object?)request.correo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@estado", request.estado);
            cmd.Parameters.AddWithValue("@beca", (object?)request.beca ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@monto_beca", (object?)request.monto_beca ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@nombre_archivo", DBNull.Value);
            cmd.Parameters.AddWithValue("@ruta_fotografia", DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_primer_nombre", request.Familiares != null && request.Familiares.Any() ? request.Familiares[0].primer_nombre : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_segundo_nombre", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].segundo_nombre ?? DBNull.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_primer_apellido", request.Familiares != null && request.Familiares.Any() ? request.Familiares[0].primer_apellido : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_segundo_apellido", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].segundo_apellido ?? DBNull.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_parentesco", request.Familiares != null && request.Familiares.Any() ? request.Familiares[0].parentesco : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_dpi", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].dpi ?? DBNull.Value : DBNull.Value);
            cmd.Parameters.AddWithValue("@tutor_telefono", request.Familiares != null && request.Familiares.Any() ? (object?)request.Familiares[0].telefono ?? DBNull.Value : DBNull.Value);
            cmd.ExecuteNonQuery();
            return ObtenerPorIdAsync(id).Result;
        });
    }

    public async Task<bool> EliminarAsync(int id)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_DesactivarParticipante @id_participante";
            cmd.Parameters.AddWithValue("@id_participante", id);
            cmd.ExecuteNonQuery();
            return true;
        });
    }

    public async Task<int> ContarAsync()
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Participante_ContarActivos";
            return Convert.ToInt32(cmd.ExecuteScalar());
        });
    }

    public async Task<int> ContarPorProgramaAsync(string tipoPrograma)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Participante_ContarPorPrograma @tipo";
            cmd.Parameters.AddWithValue("@tipo", tipoPrograma);
            return Convert.ToInt32(cmd.ExecuteScalar());
        });
    }

    public async Task ActualizarFotografiaAsync(int idParticipante, string nombreArchivo, string rutaFotografia)
    {
        await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_ActualizarFotografia @id_participante, @nombre_archivo, @ruta_fotografia";
            cmd.Parameters.AddWithValue("@id_participante", idParticipante);
            cmd.Parameters.AddWithValue("@nombre_archivo", nombreArchivo);
            cmd.Parameters.AddWithValue("@ruta_fotografia", rutaFotografia);
            cmd.ExecuteNonQuery();
        });
    }

    public async Task LimpiarRutasAntiguasAsync()
    {
        await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Participante_LimpiarRutasAntiguas";
            cmd.ExecuteNonQuery();
        });
    }

    public async Task<List<AsistenciaParticipanteDto>> ObtenerAsistenciaAsync(int idParticipante)
    {
        return await Task.Run(() =>
        {
            using var conn = CreateConnection();
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "EXEC sp_Participante_ObtenerAsistencia @id_participante";
            cmd.Parameters.AddWithValue("@id_participante", idParticipante);
            using var r = cmd.ExecuteReader();
            var list = new List<AsistenciaParticipanteDto>();
            while (r.Read())
            {
                list.Add(new AsistenciaParticipanteDto
                {
                    id_asistencia = r.GetInt32(r.GetOrdinal("id_asistencia")),
                    fecha = r.IsDBNull(r.GetOrdinal("fecha")) ? null : r.GetDateTime(r.GetOrdinal("fecha")),
                    actividad = r.IsDBNull(r.GetOrdinal("actividad")) ? null : r.GetString(r.GetOrdinal("actividad")),
                    tipo_actividad = r.IsDBNull(r.GetOrdinal("tipo_actividad")) ? null : r.GetString(r.GetOrdinal("tipo_actividad")),
                    presente = !r.IsDBNull(r.GetOrdinal("presente")) && r.GetBoolean(r.GetOrdinal("presente")),
                    hora_registro = r.IsDBNull(r.GetOrdinal("hora_registro")) ? null : r.GetTimeSpan(r.GetOrdinal("hora_registro")).ToString(@"hh\:mm"),
                    observaciones = r.IsDBNull(r.GetOrdinal("observaciones")) ? null : r.GetString(r.GetOrdinal("observaciones"))
                });
            }
            return list;
        });
    }
}
