using System.Net;
using System.Net.Mail;

namespace AnadesaApi.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task EnviarCorreoAsync(string para, string asunto, string cuerpoHtml)
    {
        try
        {
            var smtp = _config.GetSection("SmtpSettings");
            var server = smtp["Server"] ?? "smtp.gmail.com";
            var port = int.Parse(smtp["Port"] ?? "587");
            var senderEmail = smtp["SenderEmail"] ?? "";
            var senderPassword = (smtp["SenderPassword"] ?? "").Replace(" ", "");
            var senderName = smtp["SenderName"] ?? "Sistema ANADESA";

            using var message = new MailMessage();
            message.From = new MailAddress(senderEmail, senderName);
            message.To.Add(new MailAddress(para));
            message.Subject = asunto;
            message.Body = cuerpoHtml;
            message.IsBodyHtml = true;

            using var client = new SmtpClient(server, port)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            await client.SendMailAsync(message);
            _logger.LogInformation($"Correo enviado a {para}: {asunto}");
        }
        catch (Exception ex)
        {
            var detalle = ex.GetBaseException().Message;
            _logger.LogError(ex, $"Error al enviar correo a {para}: {detalle} — " +
                "verifique SmtpSettings.SenderPassword (app password de Gmail, 16 caracteres sin espacios; " +
                "si da 535 BadCredentials la app password está revocada: regenerar en myaccount.google.com/apppasswords)");
            throw;
        }
    }

    public async Task EnviarCodigoRecuperacionAsync(string correo, string codigo)
    {
        var asunto = "ANADESA - Recuperación de Contraseña";
        var cuerpo = $@"
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background-color: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='margin: 0;'>ANADESA</h1>
                <p style='margin: 5px 0 0;'>Sistema de Monitoreo y Evaluación</p>
            </div>
            <div style='background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;'>
                <h2 style='color: #333;'>Recuperación de Contraseña</h2>
                <p>Ha solicitado recuperar su contraseña. Use el siguiente código:</p>
                <div style='background-color: #fff; border: 2px solid #1a73e8; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px;'>
                    <span style='font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 5px;'>{codigo}</span>
                </div>
                <p style='color: #666; font-size: 14px;'>Este código expira en 15 minutos.</p>
                <p style='color: #666; font-size: 14px;'>Si no solicitó este cambio, ignore este mensaje.</p>
            </div>
            <div style='text-align: center; padding: 15px; color: #999; font-size: 12px;'>
                <p>© 2026 ANADESA - Sistema de Monitoreo y Evaluación</p>
            </div>
        </div>";
        await EnviarCorreoAsync(correo, asunto, cuerpo);
    }

    public async Task EnviarCredencialesUsuarioAsync(string correo, string nombre, string usuario, string contrasenaTemporal, string rol)
    {
        var asunto = "ANADESA - Bienvenido al Sistema";
        var cuerpo = $@"
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
            <div style='background-color: #1a73e8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;'>
                <h1 style='margin: 0;'>ANADESA</h1>
                <p style='margin: 5px 0 0;'>Sistema de Monitoreo y Evaluación</p>
            </div>
            <div style='background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;'>
                <h2 style='color: #333;'>Bienvenido, {nombre}</h2>
                <p>Se ha creado su cuenta en el sistema. A continuación sus credenciales de acceso:</p>
                <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>
                    <tr><td style='padding: 10px; font-weight: bold; color: #555;'>Usuario:</td><td style='padding: 10px;'>{usuario}</td></tr>
                    <tr><td style='padding: 10px; font-weight: bold; color: #555;'>Contraseña temporal:</td><td style='padding: 10px;'>{contrasenaTemporal}</td></tr>
                    <tr><td style='padding: 10px; font-weight: bold; color: #555;'>Rol:</td><td style='padding: 10px;'>{rol}</td></tr>
                </table>
                <p style='color: #e74c3c; font-weight: bold;'>Por favor cambie su contraseña después de iniciar sesión.</p>
            </div>
            <div style='text-align: center; padding: 15px; color: #999; font-size: 12px;'>
                <p>© 2026 ANADESA - Sistema de Monitoreo y Evaluación</p>
            </div>
        </div>";
        await EnviarCorreoAsync(correo, asunto, cuerpo);
    }
}
