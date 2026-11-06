using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using AnadesaApi.DTOs;
using AnadesaApi.Models;

namespace AnadesaApi.Services;

public class AuthService
{
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;
    private readonly EmailService _emailService;

    public AuthService(IConfiguration config, ILogger<AuthService> logger, EmailService emailService)
    {
        _config = config;
        _logger = logger;
        _emailService = emailService;
    }

    private SqlConnection CreateConnection()
    {
        var connStr = _config.GetConnectionString("DefaultConnection");
        return new SqlConnection(connStr);
    }

    /** Máximo de contraseñas incorrectas antes de bloquear la cuenta automáticamente. */
    public const int MaxIntentos = 3;

    public LoginResponse? Login(LoginRequest request, out string mensaje)
    {
        mensaje = "Usuario o contraseña incorrectos";
        try
        {
            using var connection = CreateConnection();
            connection.Open();

            using var cmd = connection.CreateCommand();
            cmd.CommandTimeout = 15;
            cmd.CommandText = "EXEC sp_Auth_ObtenerUsuarioLogin @usuario";
            cmd.Parameters.AddWithValue("@usuario", request.Usuario);

            int idUsuario = 0;
            string nombre = "", apellido = "", usuarioStr = "", tipoNombre = "";
            string? segundoNombre = null, segundoApellido = null, correo = null, telefono = null;
            string contrasena = "";
            int idTipoUsuario = 0;
            bool estado = false;
            int intentosFallidos = 0;
            DateTime? ultimoAcceso = null;
            DateTime fechaCreacion = DateTime.MinValue;

            using (var reader = cmd.ExecuteReader())
            {
                if (!reader.Read()) return null;

                idUsuario = reader.GetInt32(0);
                usuarioStr = reader.GetString(1);
                contrasena = reader.GetString(2);
                nombre = reader.GetString(3);
                segundoNombre = reader.IsDBNull(4) ? null : reader.GetString(4);
                apellido = reader.GetString(5);
                segundoApellido = reader.IsDBNull(6) ? null : reader.GetString(6);
                correo = reader.IsDBNull(7) ? null : reader.GetString(7);
                telefono = reader.IsDBNull(8) ? null : reader.GetString(8);
                estado = reader.GetBoolean(9);
                ultimoAcceso = reader.IsDBNull(10) ? null : reader.GetDateTime(10);
                fechaCreacion = reader.GetDateTime(11);
                idTipoUsuario = reader.GetInt32(12);
                tipoNombre = reader.IsDBNull(13) ? null : reader.GetString(13);
                intentosFallidos = reader.GetInt32(14);
            }

            if (!estado)
            {
                mensaje = intentosFallidos >= MaxIntentos
                    ? "Cuenta bloqueada tras 3 intentos fallidos. Contacte al administrador para activarla."
                    : "La cuenta está inactiva. Contacte al administrador.";
                return null;
            }

            bool passwordValid = contrasena == request.Contrasena;
            if (!passwordValid)
            {
                try { passwordValid = BCrypt.Net.BCrypt.Verify(request.Contrasena, contrasena); }
                catch { passwordValid = false; }
            }
            if (!passwordValid)
            {
                var nuevosIntentos = intentosFallidos + 1;
                using var cmdIntento = connection.CreateCommand();
                cmdIntento.CommandTimeout = 15;
                if (nuevosIntentos >= MaxIntentos)
                {
                    cmdIntento.CommandText = "EXEC sp_Usuario_BloquearPorIntentos @id_usuario, @intentos";
                    mensaje = "Cuenta bloqueada tras 3 intentos fallidos. Contacte al administrador para activarla.";
                }
                else
                {
                    cmdIntento.CommandText = "EXEC sp_Usuario_IncrementarIntentos @id_usuario, @intentos";
                    mensaje = $"Contraseña incorrecta. Intentos restantes: {MaxIntentos - nuevosIntentos}";
                }
                cmdIntento.Parameters.AddWithValue("@id_usuario", idUsuario);
                cmdIntento.Parameters.AddWithValue("@intentos", nuevosIntentos);
                cmdIntento.ExecuteNonQuery();
                return null;
            }

            if (intentosFallidos > 0)
            {
                using var cmdReset = connection.CreateCommand();
                cmdReset.CommandTimeout = 15;
                cmdReset.CommandText = "EXEC sp_Usuario_ResetearIntentos @id_usuario";
                cmdReset.Parameters.AddWithValue("@id_usuario", idUsuario);
                cmdReset.ExecuteNonQuery();
            }

            using var cmdRoles = connection.CreateCommand();
            cmdRoles.CommandTimeout = 15;
            cmdRoles.CommandText = "EXEC sp_Auth_ObtenerRolesUsuario @id_usuario";
            cmdRoles.Parameters.AddWithValue("@id_usuario", idUsuario);

            var roles = new List<RolDto>();
            using (var readerRoles = cmdRoles.ExecuteReader())
            {
                while (readerRoles.Read())
                {
                    roles.Add(new RolDto
                    {
                        id_rol = readerRoles.GetInt32(0),
                        nombre = readerRoles.GetString(1),
                        descripcion = readerRoles.IsDBNull(2) ? null : readerRoles.GetString(2),
                        estado = readerRoles.GetBoolean(3)
                    });
                }
            }

            var usuarioObj = new Usuario
            {
                id_usuario = idUsuario,
                usuario = usuarioStr,
                primer_nombre = nombre,
                segundo_nombre = segundoNombre,
                primer_apellido = apellido,
                segundo_apellido = segundoApellido,
                correo = correo,
                telefono = telefono,
                fotografia = null,
                estado = estado,
                ultimo_acceso = ultimoAcceso,
                fecha_creacion = fechaCreacion,
                id_tipo_usuario = idTipoUsuario
            };

            var token = GenerarToken(usuarioObj, roles);

            return new LoginResponse
            {
                token = token,
                expiracion = DateTime.Now.AddMinutes(double.Parse(_config["JwtSettings:ExpirationMinutes"] ?? "60")),
                usuario = new UsuarioDto
                {
                    id_usuario = idUsuario,
                    id_tipo_usuario = idTipoUsuario,
                    primer_nombre = nombre,
                    segundo_nombre = segundoNombre,
                    primer_apellido = apellido,
                    segundo_apellido = segundoApellido,
                    usuario = usuarioStr,
                    correo = correo,
                    telefono = telefono,
                    fotografia = null,
                    estado = estado,
                    ultimo_acceso = ultimoAcceso,
                    fecha_creacion = fechaCreacion,
                    tipo_usuario_nombre = tipoNombre,
                    Roles = roles
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en Login para usuario {Usuario}", request.Usuario);
            return null;
        }
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        using var connection = CreateConnection();
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandTimeout = 15;
        cmd.CommandText = "EXEC sp_Auth_ObtenerIdUsuarioPorCorreo @correo";
        cmd.Parameters.AddWithValue("@correo", request.Correo);
        var userId = cmd.ExecuteScalar();
        if (userId == null) return false;

        var random = new Random();
        var codigo = random.Next(100000, 999999).ToString();

        using var cmdInsert = connection.CreateCommand();
        cmdInsert.CommandTimeout = 15;
        cmdInsert.CommandText = "EXEC sp_Auth_CrearRecuperacion @correo, @codigo";
        cmdInsert.Parameters.AddWithValue("@correo", request.Correo);
        cmdInsert.Parameters.AddWithValue("@codigo", codigo);
        cmdInsert.ExecuteNonQuery();

        try
        {
            await _emailService.EnviarCodigoRecuperacionAsync(request.Correo, codigo);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("EMAIL_NO_ENVIADO", ex);
        }
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        try
        {
            using var connection = CreateConnection();
            connection.Open();

            using var cmd = connection.CreateCommand();
            cmd.CommandTimeout = 15;
            cmd.CommandText = "EXEC sp_Auth_ObtenerRecuperacionActiva @correo, @codigo";
            cmd.Parameters.AddWithValue("@correo", request.Correo);
            cmd.Parameters.AddWithValue("@codigo", request.Codigo);
            var recId = cmd.ExecuteScalar();
            if (recId == null) return false;

            var newHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaContrasena);

            using var cmdUpdate = connection.CreateCommand();
            cmdUpdate.CommandTimeout = 15;
            cmdUpdate.CommandText = "EXEC sp_Auth_AplicarResetPassword @contrasena, @correo, @id";
            cmdUpdate.Parameters.AddWithValue("@contrasena", newHash);
            cmdUpdate.Parameters.AddWithValue("@correo", request.Correo);
            cmdUpdate.Parameters.AddWithValue("@id", recId);
            cmdUpdate.ExecuteNonQuery();
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    private string GenerarToken(Usuario usuario, List<RolDto> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.id_usuario.ToString()),
            new Claim(ClaimTypes.Name, usuario.usuario),
            new Claim("nombre", $"{usuario.primer_nombre} {usuario.primer_apellido}"),
            new Claim("correo", usuario.correo ?? ""),
            new Claim("fotografia", usuario.fotografia ?? "")
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.nombre));
        }

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(double.Parse(_config["JwtSettings:ExpirationMinutes"] ?? "60")),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
