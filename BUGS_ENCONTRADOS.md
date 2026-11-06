# Bugs Encontrados - Sistema ANADESA

## 1. Login fallido - Casing de DTOs (CORREGIDO)

**Fecha:** Sesión actual  
**Síntoma:** Login retorna 401 o el frontend no guarda el token.

**Causa:** El backend devolvía `Token`/`Expiracion`/`Usuario` (PascalCase) pero el frontend esperaba `token`/`expiracion`/`usuario` (snake_case).

**Archivos afectados:**
- `Backend/AnadesaApi/DTOs/AuthDTOs.cs` → `LoginResponse`
- `Backend/AnadesaApi/DTOs/ConfiguracionDTOs.cs` → `AparienciaDto`
- `Frontend/src/app/core/models/models.ts` → `LoginResponse`
- `Frontend/src/app/core/services/auth.service.ts`

**Solución:** Se alinearon los campos del DTO del backend al formato snake_case que ya usaba el frontend.

---

## 2. Excel/PDF no genera archivo - `TypeError: r is not a function` (CORREGIDO)

**Fecha:** Sesión actual  
**Síntoma:** Al exportar reportes a Excel o PDF aparece:
```
TypeError: r is not a function
Error escribiendo archivo Excel
Error Excel: Error al generar el archivo Excel
```

**Causa:** La librería `file-saver` (CommonJS) no sobrevive el tree-shaking del build de producción de Angular. El export nombrado `saveAs` queda como `undefined` en el bundle minificado. En `ng serve` (desarrollo) sí funcionaba.

**Archivos afectados:**
- `Frontend/src/app/core/services/reporte.service.ts` (líneas ~311, ~683, ~763)
- `Frontend/src/app/features/configuracion/configuracion.component.ts` (línea ~649)

**Solución:** Se eliminó `file-saver` y se creó una función nativa de descarga:
- Nuevo archivo: `Frontend/src/app/core/utils/descargar.util.ts`
- Se reemplazaron los 3 usos de `saveAs()` por `descargarArchivo()`
- Se agregó interop para `xlsx` (`mod.default ?? mod`) por el mismo motivo

---

## 3. CORS bloqueado en puerto 2400 (CORREGIDO en configs locales)

**Fecha:** Sesión actual  
**Síntoma:** El frontend servido en `http://192.168.1.250:2400` no puede llamar a la API:
```
Access to XMLHttpRequest at 'http://192.168.1.250:5070/api/...' 
from origin 'http://192.168.1.250:2400' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present
```

**Causa:** El origen `http://192.168.1.250:2400` no estaba en la lista `Cors:AllowedOrigins` de `appsettings.json`.

**Solución:** Se agregó `http://192.168.1.250:2400` a `AllowedOrigins` en todos los `appsettings.json` del proyecto.

**⚠️ PENDIENTE:** Copiar el `appsettings.json` actualizado al servidor `192.168.1.250` y **reiniciar la API** para que tome el cambio.

---

## 4. Contraseñas desincronizadas entre BD local y BD del servidor (ABIERTO)

**Fecha:** Sesión actual  
**Síntoma:** En el servidor `192.168.1.250`:
- `Coordinador1/123` → ✅ funciona
- `FacEdu1/123` → ✅ funciona  
- `JuanD/123` → ✅ funciona
- `Antonio/123` → ❌ "Contraseña incorrecta"
- `admin/123` → ❌ "Contraseña incorrecta"

**Causa:** La BD del servidor (`DESKTOP-RL1BV9M\SQLEXPRESS`) es una copia distinta a la BD local (`TONITO\SQLEXPRESS02`). Los hashes de contraseña de Antonio y admin fueron reseteados solo en la BD local.

**Solución pendiente:** Ejecutar en la BD del servidor:
```sql
UPDATE usuarios SET contrasena = '$2a$11$x.0hCUYSSGnh6VZPus0qe.msdy.XLKsR9R9KCyHdPzhdSxwPlkI5.', 
intentos_fallidos = 0, estado = 1 WHERE usuario = 'Antonio';

UPDATE usuarios SET contrasena = '$2a$11$olAuv/w6.APM68v.xDSOkeI0TrSFhl3R7/fMP2tTPpOZXhZSeU5x2', 
intentos_fallidos = 0, estado = 1 WHERE usuario = 'admin';
```

---

## 5. Build de producción falla por fuentes CDN (CORREGIDO)

**Fecha:** Sesión actual  
**Síntoma:** `npm run build` falla por:
- Error al inlinear fuentes de Google Fonts (sin internet)
- Bundle budget excedido (500kB warning / 1MB error)

**Solución:**
- Se descargaron Bootstrap 5.3.3, Font Awesome 6.5.1 y DM Sans a `Frontend/public/assets/vendor/`
- Se actualizó `index.html` para usar rutas locales en vez de CDN
- Se creó configuración `despliegue` en `angular.json` con `optimization.fonts: false` y budgets subidos a 4MB/5MB
- Se creó `environment.despliegue.ts` apuntando a `http://192.168.1.250:5070/api`

**Build correcto:** `npx ng build --configuration despliegue`

---

## Resumen

| # | Bug | Estado |
|---|-----|--------|
| 1 | Login casing DTOs | ✅ Corregido |
| 2 | Excel/PDF `r is not a function` | ✅ Corregido |
| 3 | CORS puerto 2400 | ⚠️ Falta copiar al servidor + reiniciar API |
| 4 | Contraseñas desincronizadas | ❌ Pendiente ejecutar SQL en servidor |
| 5 | Build producción fuentes/budget | ✅ Corregido |
