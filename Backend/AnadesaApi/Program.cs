using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using AnadesaApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<RolService>();
builder.Services.AddScoped<ParticipanteService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<GrupoService>();
builder.Services.AddScoped<AcademicoService>();
builder.Services.AddScoped<ActividadService>();
builder.Services.AddScoped<MonitoreoService>();
builder.Services.AddScoped<EvaluacionService>();
builder.Services.AddScoped<PermisoService>();
builder.Services.AddScoped<AlcanceService>();
builder.Services.AddScoped<BackupService>();
builder.Services.AddScoped<ConfiguracionService>();
builder.Services.AddHostedService<BackupProgramadoService>();

var authBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!)),
        ClockSkew = TimeSpan.Zero
    };
});

var msClientId = builder.Configuration["MicrosoftOAuth:ClientId"];
var msClientSecret = builder.Configuration["MicrosoftOAuth:ClientSecret"];
if (!string.IsNullOrWhiteSpace(msClientId) && msClientId != "TU_MICROSOFT_CLIENT_ID")
{
    authBuilder.AddMicrosoftAccount(options =>
    {
        options.ClientId = msClientId;
        options.ClientSecret = msClientSecret ?? "";
        options.SaveTokens = true;
    });
}

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "ANADESA API",
        Version = "v1",
        Description = "API de Monitoreo y Evaluacion - ANADESA"
    });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Ingrese: Bearer {token}"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:4200" };
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngular");

app.UseStaticFiles();

var raizWeb = RutasArchivos.DirectorioWebRaiz(app.Environment);
if (raizWeb != null)
{
    var webRootPath = app.Environment.WebRootPath;
    if (webRootPath == null || !string.Equals(Path.GetFullPath(webRootPath), raizWeb, StringComparison.OrdinalIgnoreCase))
    {
        app.UseStaticFiles(new StaticFileOptions { FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(raizWeb) });
    }
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback: rutas de Angular (ej. /participantes) sirven index.html desde wwwroot
app.MapFallbackToFile("index.html");

// Solo fija el puerto local cuando NO corre bajo IIS/ANCM (MonsterASP)
if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable("ASPNETCORE_APPTYPE")))
{
    app.Urls.Add("http://0.0.0.0:5070");
}

app.Run();
