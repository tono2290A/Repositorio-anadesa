# MANUAL DE USUARIO - SISTEMA ANADESA

## Sobre el Sistema

**Sistema de Gestión de Participantes, Monitoreo y Evaluación**
- **Versión**: 1.0
- **Desarrollado para**: Asociación ANADESA
- **Ubicación**: Santiago Atitlán, Sololá

---

## 1. ACCESO AL SISTEMA

### Credenciales de Acceso (Desarrollo)

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| **admin** | **CAMBIAR_POR_HASH** | Administrador |

> **Importante**: La contraseña `CAMBIAR_POR_HASH` es un placeholder para desarrollo. En producción debe reemplazarse por una contraseña segura. El acceso con estas credenciales está configurado para el entorno de desarrollo local.

### URL de Acceso

- **Frontend (Angular)**: http://localhost:4200
- **Backend API (.NET)**: http://localhost:5070

### Pasos para Iniciar Sesión

1. Abrir cualquier navegador web
2. Ingresar la URL: `http://localhost:4200`
3. En el formulario de inicio de sesión, escribir:
   - **Usuario**: `admin`
   - **Contraseña**: `CAMBIAR_POR_HASH`
4. Hacer clic en el botón **"Iniciar sesión"**
5. El sistema redirigirá al Dashboard principal

> **Nota**: Si es la primera vez o la contraseña expiró, el sistema solicitará cambiar la contraseña al iniciar sesión.

---

## 2. DASHBOARD PRINCIPAL

Al iniciar sesión, se muestra el Dashboard (Panel Principal) con estadísticas generales del sistema.

### Estructura del Dashboard

```
+===========================================+
|           📊 PANEL PRINCIPAL             |
+===========================================+
|  [Tarjeta] Participantes    [Tarjeta] Monitoreos |
|  (3)                        (15)            |
+===========================================+
|  [Tarjeta] Evaluaciones     [Tarjeta] Actividades |
|  (3)                        (4)             |
+===========================================+
|  [Tarjeta] Usuarios       [Tarjeta] Grupos     |
|  (6)                        (1)             |
+===========================================+
|  Programa: Educación        |  Menú lateral   |
+===========================================+
```

### Descripción de Tarjetas

| Tarjeta | Significado | Icono | Color |
|---------|-------------|-------|-------|
| **Participantes** | Total de personas registradas en el sistema | `fa-users` | Verde claro |
| **Monitoreos** | Total de registros de seguimiento | `fa-chart-line` | Verde oscuro |
| **Evaluaciones** | Total de evaluaciones realizadas | `fa-clipboard-check` | Amarillo |
| **Actividades** | Total de actividades programadas | `fa-calendar-alt` | Naranja |
| **Usuarios** | Total de cuentas de usuario del sistema | `fa-user-shield` | Lavanda |
| **Grupos** | Total de grupos organizativos | `fa-layer-group` | Verde claro |

### Visibilidad por Rol

| Rol | Participantes | Monitoreos | Evaluaciones | Actividades | Usuarios | Grupos |
|-----|--------------|------------|--------------|-------------|----------|--------|
| **Administrador** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Facilitador** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Coordinador** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

> **Nota**: La tarjeta de "Usuarios" solo es visible para el rol **Administrador**. Facilitadores y Coordinadores no la verán en el Dashboard.

### Menú Superior

En la parte superior derecha del Dashboard se muestra:
- El programa actual (ej: "Educación", "Mujeres")
- El nombre de usuario logueado
- Un "chip" con el color identificativo del programa

### Menú Lateral

El menú lateral izquierda contiene acceso rápido a todos los módulos:
- Inicio (Dashboard)
- Participantes
- Académico
- Actividades
- Monitoreo
- Evaluaciones
- Reportes
- Configuración (Solo Admin)

Cada módulo tiene un icono identificador y un contador de elementos.

---

## 2. MÓDULO DE PARTICIPANTES

### Descripción
Gestión completa del directorio de participantes con filtros avanzados.

### Funcionalidades Principales

1. **Lista de Participantes**
   - Visualización paginada o infinite scroll
   - Cada fila muestra: Nombre completo, Programa, Categoría, Comunidad, Estado
   - Acciones: Ver detalle, Editar, Eliminar, Subir foto

2. **Filtros Avanzados**
   - Por Programa (educación, mujeres, etc.)
   - Por Estado (Activos, Inactivos)
   - Búsqueda por nombre, segundo nombre, apellidos, correo

2. **Acciones Masivas**
   - Exportar selecciones a PDF o Excel
   - Activar/Desactivar múltiples participantes

### Pantalla Principal

```
+===========================================+
|  Filtros: [Programa] [Estado] [Buscar]   |
+-------------------------------------------+
|  Tabla de Participantes                   |
|  +----+----------------+--------+----------+
|  | N. | Nombre Completo| Programa |  Estado  |
|  +----+----------------+--------+----------+
|  | 1  | María González   | Educación| Activo   |
|  +----+----------------+--------+----------+
|  | 2  | Carlos Rodríguez | Mujeres  | Inactivo |
|  +----+----------------+--------+----------+
|  ...                                    |
+===========================================+
```

### Reportes desde este módulo
- Reporte general de participantes
- Participantes activos/solo inactivos
- Exportar a Excel con filtros aplicados

---

## 3. MÓDULO ACADÉMICO

### Descripción
Gestión del registro académico de los participantes.

### Funcionalidades

1. **Inscripciones por Ciclo**
   - Registrar inscripciones por año y grado
   - Historial académico por participante

2. **Grados y Ciclos**
   - Gestión de niveles educativos
   - Fechas de inscripción y vencimiento

3. **Historiales Individuales**
   - Ver todo el recorrido académico de un participante
   - Descargar certificados o constancias

### Pantalla Principal

```
+===========================================+
|  Filtros: [Ciclo] [Grado] [Participante] |
+-------------------------------------------+
|  Tabla de Inscripciones                   |
|  +----+----------+----------+---------------+
|  | N. | Participante | Ciclo    |  Grado      |
|  +----+----------+----------+---------------+
|  | 1  | Ana Martínez   | 2024-1   | Primer grado|
|  +----+----------+----------+---------------+
|  | 2  | Luis Pérez     | 2023-1   | Segundo grado|
|  +----+----------+----------+---------------+
|  ...                                    |
+===========================================+
```

### Reportes Disponibles
- **Reporte de Registro Académico**: PDF o Excel con todos los participantes
- **Inscripciones por Ciclo**: Estadísticas de inscripción anual
- **Historial Individual**: PDF para un participante específico

---

## 4. MÓDULO ACTIVIDADES

### Descripción
Programación de actividades, asignación de facilitadores y participantes.

### Secciones Principales

1. **Lista de Actividades**
   - Todas las actividades programadas
   - Estado: Finalizada, En curso, Cancelada
   - Fecha, hora, lugar, responsable

2. **Gestión de Actividades**
   - Crear nueva actividad
   - Editar actividad existente
   - Eliminar actividad
   - Asignar facilitadores y participantes

2. **Asignación de Participantes**
   - Buscar participantes disponibles
   - Marcar asistencia
   - Ver participantes por actividad

3. **Reportes de Actividades**
   - Reporte general
   - Actividades finalizadas
   - Actividades en curso
   - Por participante

### Pantalla de Actividades

```
+===========================================+
|  Filtros: [Estado] [Programa] [Buscar]   |
+-------------------------------------------+
|  Lista de Actividades                     |
|  +----+----------------+----------+----------+
|  | N. | Nombre Actividad| Fecha    |  Estado  |
|  +----+----------------+----------+----------+
|  | 1  | Taller de capacitación | 15/10   | Finalizada|
|  +----+----------------+----------+----------+
|  | 2  | Reunión mensual | 20/10   | En curso |
|  +----+----------------+----------+----------+
|  ...                                    |
+===========================================+
```

### Reportes de Actividades (PDF/Excel)

| Tipo de Reporte | Descripción |
|-----------------|-------------|
| **General** | Todas las actividades con todos los datos |
| **Finalizadas** | Solo actividades completadas |
| **En curso** | Actividades programadas y en ejecución |
| **Por Participante** | Actividades de un participante en específico |

### Cómo Generar un Reporte de Actividades

1. Ir al módulo **Actividades**
2. Seleccionar el tipo de reporte deseado (General, Finalizadas, En curso)
3. Hacer clic en el botón **"Generar Reporte"**
4. Se abrirá un **modal de vista previa**
5. Hacer clic en:
   - **"Descargar PDF"** - Genera archivo PDF con el reporte
   - **"Descargar Excel"** - Genera archivo Excel con los datos
6. Cerrar el modal

---

## 4. MÓDULO MONITOREO

### Descripción
Seguimiento y control de actividades, participaciones y evolución.

### Funcionalidades

1. **Registros de Monitoreo**
   - Registros individuales por participante
   - Registros por grupo o actividad
   - Fechas y observaciones

2. **Estadísticas por Programa**
   - Evolución numérica por programa (educación, mujeres)
   - Gráficos de progreso

3. **Reportes Específicos**
   - Monitoreo general
   - Por programa (educación/mujeres)
   - Por actividad específica

### Pantalla Principal

```
+===========================================+
|  Filtros: [Programa] [Fechas] [Tipo]     |
+-------------------------------------------+
|  Gráficos Estadísticos                    |
|  - Participantes activos: 45              |
|  - Monitoreos realizados: 23              |
|  - Evaluaciones pending: 12               |
+-------------------------------------------+
|  Lista de Registros                       |
|  +----+----------------+----------+----------+
|  | N. | Participante | Fecha    | Observación|
|  +----+----------------+----------+----------+
|  | 1  | Juan Pérez     | 15/10/2024| Primera visita|
|  +----+----------------+----------+----------+
|  ...                                    |
+===========================================+
```

### Reportes Disponibles
- **Reporte General de Monitoreo**: PDF o Excel
- **Monitoreo por Programa**: Estadísticas específicas
- **Evolución Temporal**: Gráficos de progreso

---

## 5. MÓDULO EVALUACIONES

### Descripción
Sistema de criterios, resultados y seguimiento de evaluaciones.

### Secciones Principales

1. **Criterios de Evaluación**
   - Definir criterios por tipo de evaluación
   - Niveles de resultado (Básico, Intermedio, Avanzado)
   - Pesificación de cada criterio

2. **Registro de Evaluaciones**
   - Crear evaluación individual o grupal
   - Capturar resultados por participante
   - Agregar observaciones y notas

3. **Resultados y Estadísticas**
   - Ver resultados generales
   - Filtrar por programa, fecha, criterio
   - Gráficos de distribución

### Pantalla Principal

```
+===========================================+
|  Filtros: [Programa] [Criterio] [Fecha]  |
+-------------------------------------------+
|  Resultados Generales                     |
|  - Total evaluaciones: 47                 |
|  - Promedio general: 7.8/10               |
|  - Nivel medio: Intermedio                |
+-------------------------------------------+
|  Tabla de Resultados                      |
|  +----+------------+----------+----------+
|  | N. | Participante | Criterio | Resultado|
|  +----+------------+----------+----------+
|  | 1  | María G.     | Lectura    | 8.5/10     |
|  +----+------------+----------+----------+
|  | 2  | Carlos R.    | Lectura    | 6.0/10     |
|  +----+------------+----------+----------+
|  ...                                    |
+===========================================+
```

### Reportes Disponibles
- **Reporte General de Evaluaciones**: PDF o Excel con todos los resultados
- **Resultados por Criterio**: Análisis detallado por tipo de evaluación
- **Evolución por Participante**: Seguimiento individual a lo largo del tiempo

---

## 6. MÓDULO REPORTES (INFORMES Y ESTADÍSTICAS)

### Descripción
Centro principal para generar todos los reportes del sistema en PDF o Excel.

### Acceso
- **URL**: `/reportes`
- **Rol Requerido**: Todos los roles (Admin, Facilitador, Coordinador)
- **Permisos**: Consultar y Generar Reportes

### Interfaz Principal

```
+===========================================+
|    📄 INFORMES Y REPORTES                 |
+===========================================+
|  Centraliza los reportes del sistema.    |
|  Todas las salidas se descargan unicamente|
|  en PDF o Excel.                          |
+===========================================+

+===========================================+
|  📊 TARJETAS ESTADÍSTICAS                 |
+===========================================+
|  Participantes: 3      [PDF] [Excel]      |
|  Activos: 3        [PDF] [Excel]          |
|  Monitoreos: 15    [PDF] [Excel]          |
|  Evaluaciones: 3   [PDF] [Excel]          |
|  Actividades: 4    [PDF] [Excel]          |
|  Usuarios: 6                            ← Solo Admin ve esta |
+===========================================+

+===========================================+
|  Módulos de Reporte                       |
+===========================================+
|  ▶ Participantes  → Reportes por programa |
|  ▶ Actividades   → PDF/Excel por tipo     |
|  ▶ Monitoreo     → PDF/Excel general      |
|  ▶ Evaluaciones  → PDF/Excel general      |
|  ▶ Registro Académico → PDF/Excel        |
|  ▶ Usuarios     → PDF/Excel (Admin only) |
+===========================================+
```

### Cómo Generar un Reporte

#### Paso 1: Seleccionar Tipo de Reporte
1. Hacer clic en la tarjeta del módulo deseado
2. O seleccionar desde el menú lateral "Reportes"

#### Paso 2: Configurar el Reporte
1. Elegir el tipo de reporte (si hay opciones)
   - Ej: "General", "Finalizadas", "En curso" para actividades
   - Ej: "Activos", "Inactivos" para participantes
2. Aplicar filtros opcionales (fecha, programa, estado)

#### Paso 3: Vista Previa
1. Hacer clic en el botón **"Generar Reporte"**
2. Se abrirá un **modal emergente** con:
   - **Vista previa** del reporte formateado
   - **Botón Descargar PDF** (azul)
   - **Botón Descargar Excel** (verde)
   - **Botón Cerrar** (X)

#### Paso 3: Descargar el Archivo
1. Hacer clic en **"Descargar PDF"**
   - El archivo se descargará automáticamente
   - Nombre: `reporte_titulo_dia-mes-año.pdf`
2. Hacer clic en **"Descargar Excel"**
   - El archivo se descargará automáticamente
   - Nombre: `reporte_titulo_dia-mes-año.xlsx`
3. El archivo se puede abrir con:
   - Visualizador de PDF (Adobe Reader, Edge, Chrome)
   - Microsoft Excel o LibreOffice Calc

### Tipos de Reportes Disponibles

| Módulo | Reportes Disponibles | Formatos |
|--------|---------------------|----------|
| **Participantes** | General, Activos, Inactivos | PDF, Excel |
| **Actividades** | General, Finalizadas, En curso | PDF, Excel |
| **Monitoreo** | General, Por Programa | PDF, Excel |
| **Evaluaciones** | General, Por Criterio | PDF, Excel |
| **Registro Académico** | Inscripciones, Historiales | PDF, Excel |
| **Usuarios** | General (Admin only) | PDF, Excel |

### Elementos Incluidos en Todos los Reportes

- ✅ Logo de ANADESA (encabezado)
- ✅ Título del reporte
- ✅ Fecha de generación (formato largo)
- ✅ Pie de página con información institucional
- ✅ Datos formateados con la identidad visual del sistema
- ✅ Colores corporativos (verde ANADESA, morado secundario)

---

## 7. MÓDULO CONFIGURACIÓN (SOLO ADMINISTRADOR)

### Descripción
Configuración del sistema: apariencia, usuarios, roles y permisos.

### Secciones Disponibles

1. **Apariencia del Sistema**
   - Nombre del sistema
   - Color primario (ANADESA verde: #1E3278)
   - Color acento (verde secundario: #26781E)
   - Tamaño de fuente base
   - Logo del sistema
   - Imagen de login

2. **Usuarios y Cuentas**
   - Lista de todos los usuarios del sistema
   - Crear nuevo usuario
   - Editar usuario existente
   - Cambiar contraseña
   - Bloquear/Desbloquear cuenta
   - Eliminar usuario

3. **Roles y Permisos**
   - Definir roles (Administrador, Facilitador, Coordinador)
   - Asignar permisos por módulo
   - Módulos disponibles: Participantes, Académico, Actividades, Monitoreo, Evaluaciones, Reportes
   - Permisos por acción: Consultar, Crear, Editar, Eliminar, Generar Reportes

### Pantalla de Configuración

```
+===========================================+
|        ⚙️ CONFIGURACIÓN DEL SISTEMA       |
+===========================================+

+===========================================+
|  1. Apariencia                            |
+===========================================+
|  Nombre del Sistema: ANADESA              |
|  Color Primario: #1E3278 (verde)         |
|  Color Acento: #26781E (verde claro)    |
|  Tamaño Fuente: Mediana                   |
|  Logo del Sistema: [Subir imagen]        |
|  Imagen de Login: [Subir imagen]         |
+-------------------------------------------+

+===========================================+
|  2. Usuarios                              |
+===========================================+
|  [Tabla de Usuarios]                      |
|  Usuario: admin | Rol: Administrador | [Editar] |
| Usuario: facilitador | Rol: Facilitador | [Editar] |
+-------------------------------------------+

+===========================================+
|  3. Permisos por Módulo                   |
+===========================================+
|  □ Participantes: Consultar ✅ Crear ✅    |
|  □ Académico: Consultar ✅                |
|  □ Actividades: Consultar ✅ Crear ✅     |
|  □ Monitoreo: Consultar ✅                |
|  □ Evaluaciones: Consultar ✅             |
|  □ Reportes: Consultar ✅ Generar ✅      |
+===========================================+
```

### Cambio de Contraseña

1. Ir a Configuración > Cambiar Contraseña
2. Ingresar contraseña actual
3. Ingresar nueva contraseña
4. Confirmar nueva contraseña
5. Hacer clic en "Guardar Cambios"

> **Nota**: La primera vez que se inicia sesión, el sistema solicitará cambiar la contraseña por defecto.

---

## 8. FUNCIONALIDAD DE REPORTES PDF Y EXCEL

### Tecnologías Utilizadas

| Formato | Librería Tecnológica | Descripción |
|---------|---------------------|-------------|
| **PDF** | `jspdf` + `html2canvas` | Convierte contenido HTML a imagen y luego a PDF. Captura todo el formato visual. |
| **Excel** | `xlsx` + `file-saver` | Genera archivos spreadsheet con datos tabulares. Soporte para fórmulas y formato de celdas. |

### Qué Incluye Cada Formato

| Formato | Incluye | No Incluye |
|---------|---------|------------|
| **PDF** | ✅ Vista visual exacta | ❌ Datos editables |
| | ✅ Formato visual idéntico a pantalla | ❌ Copiar texto fácilmente |
| | ✅ Impresión de alta calidad | |
| **Excel** | ✅ Datos editables | ❌ Formato visual idéntico |
| | ✅ Copiar y pegar información | ❌ Layout visual exacto |
| | ✅ Fórmulas y cálculos | |

### Buenas Prácticas

1. **Para PDFs**: Revisar la vista previa antes de descargar para asegurar que el contenido no se corte
2. **Para Excel**: Verificar que todos los datos se hayan exportado correctamente, especialmente en reportes con muchos registros
3. **Nombres de Archivo**: Siempre incluyen el título y la fecha actual para fácil identificación
4. **Tamaño de Archivo**: Los PDFs tienden a ser más pesados que los Excel para la misma cantidad de datos

---

## 8. PERFILES DE USUARIO

### Perfil: Administrador

| Característica | Descripción |
|----------------|-------------|
| **Acceso Completo** | Todos los módulos y configuraciones |
| **Tarjetas Dashboard** | Todas visibles (incluye Usuarios) |
| **Módulos Accesables** | Todos los módulos del sistema |
| **Reportes** | Todos los reportes disponibles |
| **Configuración** | Acceso total a apariencia, usuarios, permisos |
| **Acciones Permitidas** | Crear, editar, eliminar, generar reportes |
| **Credenciales Ejemplo** | admin / CAMBIAR_POR_HASH |

### Perfil: Facilitador

| Característica | Descripción |
|----------------|-------------|
| **Acceso Restringido** | Módulos operativos, no configuración |
| **Tarjetas Dashboard** | Participantes, Monitoreos, Evaluaciones, Actividades, Grupos (NO Usuarios) |
| **Módulos Accesables** | Participantes, Académico, Actividades, Monitoreo, Evaluaciones, Reportes |
| **Reportes** | Todos los reportes menos los de configuración de usuarios |
| **Acciones Permitidas** | Consultar, crear actividades, ver reportes |
| **No Accede** | Configuración del sistema, gestión de usuarios |

### Perfil: Coordinador

| Característica | Descripción |
|----------------|-------------|
| **Acceso Restringido** | Similar al Facilitador con algunas diferencias |
| **Tarjetas Dashboard** | Mismo que Facilitador (NO Usuarios) |
| **Módulos Accesables** | Igual que Facilitador |
| **Reportes** | Mismo que Facilitador |
| **Acciones Permitidas** | Consultar y generar reportes operativos |
| **No Accede** | Configuración del sistema, gestión completa de usuarios |

---

## 9. SOLUCIÓN DE PROBLEMAS PROBLEMAS COMUNES

### Problema: No puedo iniciar sesión

| Causa Posible | Solución |
|----------------|----------|
| Contraseña incorrecta | Verificar mayúsculas/minúsculas, usar `CAMBIAR_POR_HASH` |
| Cuenta bloqueada | Contactar al administrador |
| Puerto no disponible | Verificar que el backend esté corriendo en el puerto 5070 |

### Problema: La página se carga pero no responde

| Causa Posible | Solución |
|----------------|----------|
| Conexión lenta | Esperar unos segundos o refrescar |
| Backend caído | Reiniciar el servidor `dotnet run` en Backend\AnadesaApi |
| Cache del navegador | Presionar Ctrl+F5 o limpiar cache del navegador |

### Problema: No puedo generar reportes

| Causa Posible | Solución |
|----------------|----------|
| Sin permisos | Verificar que tu rol tenga permisos de "Generar Reportes" |
| Datos vacíos | Asegurarse de que hay datos en el sistema para el filtro aplicado |
| Error de conexión | Verificar que el API esté activa en el puerto 5070 |

### Problema: Los reportes no incluyen ciertos datos

| Causa Posible | Solución |
|----------------|----------|
| Filtros activos | Revisar y limpiar los filtros aplicados |
| Datos sin cargar | Esperar el cargado inicial del sistema |
| Formato diferente | PDF y Excel muestran datos de forma diferente |

---

## 10. REQUERIMIENTOS TÉCNICOS

### Para el Desarrollador/Administrador

| Componente | Requerimiento |
|------------|---------------|
| **Backend** | .NET 8, SQL Server Express, puerto 5070 |
| **Frontend** | Angular 17+, Node.js 20+, puerto 4200 |
| **Base de Datos** | SQL Server Express (TONITO\SQLEXPRESS02), DB_ANADESA |
| **Despliegue** | Visual Studio, `dotnet run`, `ng build --configuration production` |

### Entornos

| Entorno | URL | Propósito |
|---------|-----|-----------|
| **Desarrollo** | http://localhost:4200 / http://localhost:5070 | Testing y capacitación |
| **Producción** | URL del servidor | Uso real del sistema |

### Mantenimiento Periódico

1. **Backup de Base de Datos**: Semanalmente
2. **Actualizaciones de Seguridad**: Mensualmente
3. **Limpieza de Datos**: Cada 6 meses (registros inactivos)
4. **Actualización de Versiones**: Cuando hay nuevas releases

---

## 11. SOPORTE Y CAPACITACIÓN

### Canales de Soporte

- **Soporte Técnico**: soporte@anadesa.org
- **Manual Online**: [URL del manual]
- **FAQs**: Preguntas frecuentes en el sistema

### Capacitación Recomendada

1. **Nuevo Usuario**: 2 horas de capacitación inicial
2. **Administrador Avanzado**: 4 horas sobre configuración y permisos
3. **Generación de Reportes**: 2 horas sobre PDFs y Exceles
4. **Módulos Operativos**: 1 hora por cada módulo (Participantes, Actividades, etc.)

### Recursos Adicionales

- **Tutoriales en Video**: Canal de YouTube del sistema
- **Preguntas Frecuentes**: Actualizadas mensualmente
- **Foro de Dudas**: Comunidad de usuarios del sistema

---

## 12. INFORMACIÓN INSTITUCIONAL

### Asociación ANADESA
- **Sede**: Santiago Atitlán, Sololá
- **Año Fondación**: [Año de fundación]
- **Misión**: "Más oportunidades, mejores vidas"
- **Objetivo**: Gestión y acompañamiento de participantes en programas de desarrollo

### Datos del Sistema
- **Versión**: 1.0
- **Fecha de Implementación**: Octubre 2026
- **Desarrollado por**: Equipo de Tecnología ANADESA
- **Base de Datos**: SQL Server Express, Express Edition

---

## 📋 CHECKLIST DE SEguridad

Antes de entregar el sistema o dar de alta nuevos usuarios:

- [ ] Cambiar contraseña por defecto `CAMBIAR_POR_HASH`
- [ ] Revisar permisos de cada rol
- [ ] Verificar backup de base de datos
- [ ] Probar todos los reportes (PDF y Excel)
- [ ] Confirmar apariencia del sistema
- [ ] Verificar roles de usuarios nuevos
- [ ] Testear recuperación de contraseña

---

**Fin del Manual de Usuario**

---

**¿Necesita alguna sección específica adicional o corrección?**  
**¿Desea que el manual se adapte a algún rol específico?**  

*Generado el: 24 de Octubre de 2026*  
*Sistema: ANADESA - Gestión de Participantes y Evaluación*  
*Basado en la versión de desarrollo con credenciales: admin / CAMBIAR_POR_HASH*