namespace AnadesaApi.DTOs;

public class LoginRequest
{
    public string Usuario { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string token { get; set; } = string.Empty;
    public DateTime expiracion { get; set; }
    public UsuarioDto usuario { get; set; } = null!;
}

public class ForgotPasswordRequest
{
    public string Correo { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Correo { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string NuevaContrasena { get; set; } = string.Empty;
}

public class MicrosoftLoginRequest
{
    public string AccessToken { get; set; } = string.Empty;
}
