# Despliegue en la Nube — Sistema ANADESA

> Documento técnico del despliegue en producción del Sistema ANADESA
> (Asociación ANADESA — gestión académica, participantes, monitoreo y evaluaciones).

---

## 1. Arquitectura general

```
                        ┌──────────────────────────────────────┐
   Usuario (navegador)  │   Render (Plataforma PaaS - nube)    │
   ──────────────────►  │   Contenedor Docker                   │
   https://sistema-     │   ┌────────────────────────────────┐  │
   anadesa.onrender.com │   │  Kestrel (.NET 8) - puerto 8080│  │
                        │   │  + Angular (estáticos wwwroot) │  │
                        │   └───────────────┬────────────────┘  │
                        └───────────────────┼───────────────────┘
                                            │  HTTPS / SQL (autenticación SQL)
                                            ▼
                        ┌──────────────────────────────────────┐
                        │  MonsterASP (SQL Server en la nube)  │
                        │  db76244.public.databaseasp.net:1433 │
                        │  Base de datos: db76244              │
                        └──────────────────────────────────────┘
```

- **Frontend y backend viajan juntos**: Angular se compila a archivos estáticos y se sirve desde `wwwroot` dentro del mismo contenedor (no hay servidor web separado para el front).
- **Base de datos externa**: SQL Server alojado en MonsterASP (SQL Server 2025), accesible desde Render por IP/puerto con autenticación SQL.

---

## 2. Repositorio Git (origen del código)

| Campo | Valor |
|---|---|
| Repositorio | `https://github.com/tono2290A/SISTEMA-ANADESA-.git` |
| Rama | `main` (única rama; sin git flow) |
| Desarrollo local | `D:\DECIMO SEMESTRE\web_ANADESA` |
| Despliegue | `git push origin main` → Render compila y publica automáticamente |

**Flujo de código:**
1. Se desarrolla y prueba en local (API `localhost:5070`, front `localhost:4200`).
2. Se compila el frontend: `npm run build` (carpeta `Frontend`).
3. Se copian los estáticos a `Backend/AnadesaApi/wwwroot` (robocopy de `dist/Frontend/browser`).
4. Se hace commit y `git push` a GitHub.
5. Render detecta el push, construye la imagen Docker y redeploya.

---

## 3. Contenedor Docker

Archivo `Dockerfile` en la **raíz del repositorio** (Render lo exige así).

- **Etapa 1 (build):** `mcr.microsoft.com/dotnet/sdk:8.0` → `dotnet restore` + `dotnet publish -c Release`.
- **Etapa 2 (runtime):** `mcr.microsoft.com/dotnet/aspnet:8.0` → ejecuta `AnadesaApi.dll`.
- **Variables/atributos del contenedor:**
  - `ENV ASPNETCORE_URLS=http://+:8080`
  - `EXPOSE 8080`
- **No se usa docker-compose** ni volúmenes: es un **único contenedor** autocontenido (API + frontend estático).
- Las variables de entorno reales (cadena de conexión, claves) se configuran en el **dashboard de Render**, no en el repositorio.

---

## 4. Servicio en la nube: Render

| Campo | Valor |
|---|---|
| URL producción | `https://sistema-anadesa.onrender.com` |
| Tipo | Web Service (contenedor Docker) |
| Puerto | 8080 (Kestrel) |
| HTTPS | provisto por Render |
| Build | automático en cada `git push` a `main` |

**Variables de entorno configuradas en Render (nombres):**

| Variable | Propósito |
|---|---|
| `ConnectionStrings__DefaultConnection` | Cadena de conexión a MonsterASP SQL Server |
| `Email__ApiKey` | Clave API de Brevo (envío de correos por HTTPS) |
| `Email__From` / `Email__FromName` | Remitente verificado (`tonoramirezrr90@gmail.com`) |
| `Jwt__Secret` / `Jwt__Issuer` / `Jwt__Expiration` | Autenticación JWT |

> ⚠️ Los valores secretos viven **solo** en Render (nunca se commitan al repo).

---

## 5. Base de datos en la nube: MonsterASP

| Campo | Valor |
|---|---|
| Servidor | `db76244.public.databaseasp.net,1433` |
| Base de datos | `db76244` |
| Motor | Microsoft SQL Server 2025 (Express, Windows Server 2025) |
| Autenticación | SQL Server Authentication (usuario `db76244`) |
| Cifrado | `Encrypt=True;TrustServerCertificate=True` |
| Acceso desde | Render (producción) y máquina de desarrollo |

- Toda la lógica de datos está en la nube: **tablas + procedimientos almacenados** (p. ej. `sp_EliminarUsuario`, `sp_Grupo_Eliminar`, `sp_Monitoreo_CrearLote`).
- La API solo ejecuta procedimientos almacenados vía ADO.NET (sin ORM).

---

## 6. Servicios complementarios en la nube

### 6.1 Correos — Brevo (API HTTPS)
- El SMTP de Render está bloqueado (puerto 25), por lo que el envío se hace por **API HTTPS de Brevo** con la clave `Email__ApiKey`.
- Remitente verificado: `Asociacion-Anadesa <tonoramirezrr90@gmail.com>`.
- La IP de Render (`74.220.48.72`) debe autorizarse en `app.brevo.com/security/authorised-ips`.
- Fallback SMTP (Gmail) solo para uso local/desarrollo.

### 6.2 Monitoreo de disponibilidad — UptimeRobot
- Monitor gratuito: `https://sistema-anadesa.onrender.com/api/auth/login` cada 5 minutos.
- Función: mantener el contenedor Render **despierto** (evita el *cold start* de ~30-50 s) y alertar por correo si el sistema cae.

---

## 7. Resumen del stack desplegado

| Capa | Tecnología | Dónde corre |
|---|---|---|
| Frontend | Angular 20 (estáticos) | Render (servidos por Kestrel) |
| Backend | ASP.NET Core Web API (.NET 8) | Render (contenedor Docker) |
| Servidor web | Kestrel (puerto 8080) + HTTPS de Render | Render |
| Base de datos | SQL Server 2025 + procedimientos almacenados | MonsterASP |
| Repositorio | Git / GitHub (`main`) | GitHub |
| CI/CD | Deploy automático por push (Render) | Render + GitHub |
| Email | Brevo API HTTPS | nube (externo) |
| Monitoreo | UptimeRobot (5 min) | nube (externo) |

---

## 8. Pasos para redesplegar desde cero

1. `git clone https://github.com/tono2290A/SISTEMA-ANADESA-.git`
2. Crear la base de datos en MonsterASP y ejecutar los scripts SQL (tablas + SPs en `Backend/AnadesaApi/SQL`).
3. Crear el Web Service en Render apuntando al repo, con el `Dockerfile` de la raíz.
4. Configurar las variables de entorno de Render (conexión, JWT, Brevo).
5. Autorizar la IP de Render en Brevo.
6. Push a `main` → Render compila y publica.
7. Verificar: `https://sistema-anadesa.onrender.com` + login (`Administrador / 123`).
