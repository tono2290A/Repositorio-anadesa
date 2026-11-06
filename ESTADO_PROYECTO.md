# Sistema ANADESA - Estado del Proyecto

## Resumen General

| Componente | Estado |
|---|---|
| Backend API (.NET 8) | ✅ Compila 0 errores; corriendo en :5070 desde `bin\Run` (F5 de VS lo reemplaza) |
| Frontend (Angular 20) | ✅ Compila (`npm run build` EXIT=0) y sirve en :4200 |
| Base de datos SQL Server | ✅ Conectada vía TCP `localhost,1433` — **producción lista: 42 tablas limpias, 100+ SPs, sin objetos legacy (10 oct 2026)** |
| **SQL 100% en SPs** | ✅ **111 SQL inline migrados a ~70 SPs en BD; API solo ejecuta EXEC (10 oct 2026)** |
| **Limpieza BD producción** | ✅ **Eliminadas tablas quemadas (reportes, rol_permisos, usuario_modulos, sysdiagrams) + SPs huérfanos + modelos EF muertos; respaldo previo `anadesa_preprod_20261010_2330.bak` (10 oct 2026)** |
| **CRUD en perfil (Actividades/Monitoreo/Evaluaciones)** | ✅ **Alta/edición/borrado con checkmarks + permisos por módulo en tabs del participante (11 oct 2026)** |
| **Responsive global** | ✅ **3 breakpoints en login + 9 módulos + detalles + modales; grids a 1 col, tablas scroll, modales full-width, botones 48-52px — 79 aserciones E2E a 390/768px (11 oct 2026)** |
| **Login responsive** | ✅ **≤480px (card full, inputs 16px, botón 52px), 481-768px (panel marca compacto), >768px (dos paneles) — paleta ANADESA (11 oct 2026)** |
| **Fix NG0103** | ✅ **Bucle infinito `visibleTabs` getter → propiedad + actualización explícita (11 oct 2026)** |
| **Fix foto en Tutor/Encargado** | ✅ **`ObtenerPorIdAsync` ahora lee el 2do result set (familiares) del SP; la pestaña Tutor del perfil ya muestra al encargado (17 oct 2026)** |
| **Fix foto en PDF del perfil** | ✅ **`imageToBase64` con `cache:'no-store'` (evita CORS por caché); `embedImagesAsBase64` antes de html2canvas; perfil usa `[modoHtml]="true"` para que PDF = vista previa; foto 122px ≈ 3.13cm (17 oct 2026)** |
| Login / JWT Auth | ✅ Funcional (BCrypt + JWT + interceptor) |
| **Seguridad por modulo** | ✅ **Permisos por rol en todos los endpoints + `permisoGuard` en rutas + menú restringido (2 oct 2026)** |
| **Alcance por programa** | ✅ **Aislamiento Educación / Mujeres por rol en backend + pestañas de programa en 4 módulos (2 oct 2026)** |
| **Gestión de usuarios y roles** | ✅ **CRUD + roles validados + BLOQUEO AUTOMÁTICO A LOS 3 INTENTOS DE LOGIN (6 oct 2026)** |
| **Dashboard: panel + responsive** | ✅ **Módulo lateral colapsable (historial + pendientes) y layout adaptado a tablet/celular (3 oct 2026)** |
| **Copia de seguridad (Configuración)** | ✅ **100%: manual + automática programada (scheduler real en servidor) + historial + restaurar + CARGAR .bak desde el equipo (6 oct 2026)** |
| **Apariencia (Configuración)** | ✅ **100%: logo, imagen de login, colores + paleta institucional, tamaño de fuente, nombre del sistema — todo en caliente (6 oct 2026)** |
| **Recuperación de contraseña** | ✅ **100%: código por correo + formulario nueva contraseña + reenvío, flujo completo probado E2E (6 oct 2026)** |
| **Nombre del sistema** | ✅ **"Sistema de gestión, monitoreo y evaluación de participantes" con UI adaptativa en sidebar/topbar/login/título (6 oct 2026)** |
| Actividades (CRUD + SPs) | ✅ CRUD + SPs + **asignación de participantes y FACILITADORES** (6 oct 2026) |
| Registro Academico | ✅ Inscripciones + historial + calificaciones por bloque |
| **Modulo Monitoreo** | ✅ **CRUD individual + masivo + permisos por rol + reportes (28 sep 2026)** |
| **Modulo Evaluacion** | ✅ **CRUD individual + lote (grupo/actividad) + ficha + reportes + permisos + Coordinador solo observaciones (1 oct 2026)** |
| Email SMTP | ✅ **Operativo** (app password vigente en `appsettings.json`); ⚠️ Gmail limita envíos repetidos muy seguidos (535/drop transitorio) |
| Microsoft OAuth | ⚠️ Configurado, faltan credenciales Azure (alcance externo) |

**Estado global (11 oct 2026):** 9 suites E2E/UI en verde con **276 aserciones** (26+17+40+18+16+18+79+44+18) — verificado tras migración total a SPs + limpieza BD + informe único + CRUD en perfil + responsive global + fix NG0103. Los pendientes restantes corresponden a otros módulos (ver *LO QUE NOS FALTA*).

**Credenciales de prueba:** `Antonio / 123` (Administrador), `Coordinador1 / 123` (solo observaciones), `FacEdu1 / 123` (Facilitador Educación), `JuanD / 123` (Facilitador Mujeres)  
**Frontend:** `http://localhost:4200` · **API:** `http://localhost:5070` · **Swagger:** `/swagger`

---

## LO QUE TENEMOS COMPLETADO

### Backend API

#### Endpoints funcionales
| Metodo | Ruta | Descripcion | Estado |
|---|---|---|---|
| POST | `/api/auth/login` | Login con JWT | ✅ |
| POST | `/api/auth/forgot-password` | Envio codigo recuperacion | ✅ (SMTP operativo 6 oct; 502 honesto si falla) |
| POST | `/api/auth/reset-password` | Reset contrasena | ✅ (6 oct: 6 dígitos, 15 min, un solo uso) |
| GET | `/api/usuarios` | Listar usuarios | ✅ |
| GET | `/api/usuarios/{id}` | Obtener usuario | ✅ |
| POST | `/api/usuarios` | Crear usuario | ✅ |
| PUT | `/api/usuarios/{id}` | Actualizar usuario | ✅ |
| DELETE | `/api/usuarios/{id}` | Eliminar usuario | ✅ |
| GET | `/api/roles` | Listar roles con conteo | ✅ |
| POST | `/api/roles` | Crear rol | ✅ |
| PUT | `/api/roles/{id}` | Actualizar rol | ✅ |
| PUT | `/api/roles/{id}/permisos` | Actualizar permisos | ✅ |
| DELETE | `/api/roles/{id}` | Eliminar rol | ✅ |
| GET | `/api/roles/modulos` | Listar modulos | ✅ |
| GET | `/api/roles/permisos` | Listar permisos | ✅ |
| GET | `/api/participantes` | Listar participantes | ✅ |
| GET | `/api/participantes/{id}` | Obtener participante | ✅ |
| POST | `/api/participantes` | Crear participante | ✅ |
| PUT | `/api/participantes/{id}` | Actualizar participante | ✅ |
| DELETE | `/api/participantes/{id}` | Desactivar participante | ✅ |
| GET | `/api/participantes/{id}/asistencia` | Asistencia participante | ✅ |
| POST | `/api/actividades/asistencia/{idProgramacion}` | Marcar asistencia | ✅ |
| GET | `/api/actividades/asistencia/{idProgramacion}` | Ver asistencia actividad | ✅ |
| GET | `/api/grupos` | Listar grupos con conteo | ✅ |
| GET | `/api/grupos/{id}` | Obtener grupo + participantes | ✅ |
| POST | `/api/grupos` | Crear grupo | ✅ |
| PUT | `/api/grupos/{id}` | Actualizar grupo | ✅ |
| DELETE | `/api/grupos/{id}` | Eliminar grupo | ✅ |
| POST | `/api/grupos/{id}/participantes` | Asignar participante | ✅ |
| DELETE | `/api/grupos/participantes/{id}` | Remover participante | ✅ |
| GET | `/api/academico/inscripciones/{id}` | Inscripciones participante | ✅ |
| POST | `/api/academico/inscripciones` | Crear inscripcion | ✅ |
| DELETE | `/api/academico/inscripciones/{id}` | Eliminar inscripcion | ✅ |
| GET | `/api/academico/historial/{id}` | Historial participante | ✅ |
| POST | `/api/academico/historial` | Registrar historial | ✅ |
| DELETE | `/api/academico/historial/{id}` | Eliminar historial | ✅ |
| GET | `/api/academico/ciclos` | Listar ciclos escolares | ✅ |
| GET | `/api/academico/grados` | Listar grados | ✅ |
| GET | `/api/academico/bloques` | Listar bloques academicos | ✅ |
| GET | `/api/academico/promedios/{id}` | Promedios inscripcion | ✅ |
| POST | `/api/academico/promedios` | Crear promedio | ✅ |
| GET | `/api/dashboard/stats` | Estadisticas dashboard | ✅ |
| GET | `/api/dashboard/actividad-reciente?limite=15` | Historial de actividad reciente (respetando alcance por programa) | ✅ |
| GET | `/api/dashboard/pendientes` | Contadores de pendientes (actividad vencida, sin monitoreo, evaluación sin resultado, beca sin monto) | ✅ |
| GET | `/api/catalog/*` | Catalogos (programas, categorias, comunidades) | ✅ |
| GET | `/api/actividades` | Listar todas las actividades | ✅ |
| POST | `/api/actividades` | Crear actividad + programacion | ✅ |
| PUT | `/api/actividades/{idAct}/{idProg}` | Actualizar actividad | ✅ |
| DELETE | `/api/actividades/{idAct}/{idProg}` | Eliminar actividad | ✅ |
| GET | `/api/actividades/tipos` | Tipos de actividad | ✅ |
| GET | `/api/actividades/programas` | Programas para select | ✅ |
| PUT | `/api/actividades/estado/{idProg}` | Cambiar estado rapido | ✅ |
| GET | `/api/actividades/participantes-disponibles/{idProg}` | Participantes del SP | ✅ |
| POST | `/api/actividades/asignar-participantes/{idProg}` | Asignar participantes | ✅ |
| GET | `/api/actividades/facilitadores-disponibles/{idProg}` | Facilitadores + flag asignado | ✅ (6 oct 2026) |
| POST | `/api/actividades/asignar-facilitadores/{idProg}` | Asignar/quitar facilitadores (400 si no es rol Facilitador) | ✅ (6 oct 2026) |
| GET | `/api/auth/permisos` | Permisos del usuario por modulo | ✅ |
| GET | `/api/monitoreo` | Listar monitoreos (alcance por rol) | ✅ |
| GET | `/api/monitoreo/{id}` | Ficha individual de monitoreo | ✅ |
| POST | `/api/monitoreo` | Crear monitoreo individual | ✅ |
| POST | `/api/monitoreo/lote` | Crear monitoreo masivo (N participantes) | ✅ |
| PUT | `/api/monitoreo/{id}` | Actualizar monitoreo | ✅ |
| DELETE | `/api/monitoreo/{id}` | Eliminar monitoreo | ✅ |
| GET | `/api/monitoreo/participantes` | Participantes por programa/categoria/grupo/actividad | ✅ |
| GET | `/api/monitoreo/areas` | Programas y categorias (filtrados por rol) | ✅ |
| GET | `/api/monitoreo/grupos` | Grupos con conteo | ✅ |
| GET | `/api/monitoreo/actividades` | Actividades programadas | ✅ |
| GET | `/api/monitoreo/permisos` | Permisos + alcance del modulo | ✅ |
| GET | `/api/evaluaciones` | Listar evaluaciones (alcance por rol) | ✅ |
| GET | `/api/evaluaciones/{id}` | Ficha con detalle de criterios | ✅ |
| POST | `/api/evaluaciones` | Crear evaluacion individual | ✅ |
| PUT | `/api/evaluaciones/{id}` | Actualizar evaluacion | ✅ |
| DELETE | `/api/evaluaciones/{id}` | Eliminar evaluacion | ✅ |
| POST | `/api/evaluaciones/lote` | Crear evaluaciones masivas (grupo/actividad) | ✅ |
| GET | `/api/evaluaciones/participantes` | Participantes del formulario (filtros grupo/actividad) | ✅ |
| GET | `/api/evaluaciones/grupos` | Grupos con conteo | ✅ |
| GET | `/api/evaluaciones/actividades` | Actividades programadas | ✅ |
| GET | `/api/evaluaciones/criterios` | Criterios de evaluacion | ✅ |
| GET | `/api/evaluaciones/permisos` | Permisos + alcance del modulo 7 | ✅ |
| GET | `/fotos/{archivo}` (estatico, `wwwroot/fotos`) | Foto del participante | ✅ (fix ruta 1 oct 2026) |
| GET/POST | `/api/backup` | Historial (archivos + `backup_historial`) / crear copia | ✅ (6 oct 2026) |
| GET | `/api/backup/archivo?nombre=` | Descargar .bak | ✅ |
| POST | `/api/backup/cargar` | **Cargar .bak desde el equipo** (valida ext/tamaño/firma) | ✅ (6 oct 2026) |
| DELETE | `/api/backup?nombre=` | Eliminar copia (anti-traversal) | ✅ |
| POST | `/api/backup/restaurar?nombre=` | Restaurar BD (solo Administrador) | ✅ |
| GET/PUT | `/api/backup/configuracion` | Programación automática (frecuencia/hora) | ✅ |
| GET | `/api/configuracion/apariencia` | Apariencia pública **[AllowAnonymous]** | ✅ (6 oct 2026) |
| PUT | `/api/configuracion/apariencia` | Guardar apariencia (colores/fuente/nombre/logo) | ✅ |

#### Servicios Backend
| Servicio | Archivo | Estado |
|---|---|---|
| AuthService | Services/AuthService.cs | ✅ Login JWT |
| EmailService | Services/EmailService.cs | ✅ SMTP Gmail operativo (app password 6 oct) + log accionable |
| BackupService | Services/BackupService.cs | ✅ Crear/descargar/restaurar/cargar .bak + historial |
| BackupProgramadoService | Services/BackupProgramadoService.cs | ✅ BackgroundService: respaldo automático en servidor |
| ConfiguracionService | Services/ConfiguracionService.cs | ✅ GET/PUT apariencia (validaciones + upsert) |
| UsuarioService | Services/UsuarioService.cs | ✅ CRUD con SPs |
| RolService | Services/RolService.cs | ✅ CRUD + permisos |
| ParticipanteService | Services/ParticipanteService.cs | ✅ CRUD + fotos |
| DashboardService | Services/DashboardService.cs | ✅ Stats COUNT |
| CatalogService | Services/CatalogService.cs | ✅ Catalogos |
| GrupoService | Services/GrupoService.cs | ✅ CRUD + asignacion |
| AcademicoService | Services/AcademicoService.cs | ✅ Inscripciones, historial, promedios |
| ActividadService | Services/ActividadService.cs | ✅ CRUD + SPs + participantes + **facilitadores** (async puro) |
| MonitoreoService | Services/MonitoreoService.cs | ✅ CRUD + lote + catalogos via 12 SPs |
| EvaluacionService | Services/EvaluacionService.cs | ✅ CRUD + lote + ficha + criterios (1 oct 2026) |
| PermisoService | Services/PermisoService.cs | ✅ Permisos por usuario (usuario_roles); error se propaga (500) en vez de devolver `[]` |
| RutasArchivos | Services/RutasArchivos.cs | ✅ Raíz del proyecto → `wwwroot` estable al ejecutar desde `bin\Run` (fix fotos) |

#### Controllers
| Controller | Archivo | Estado |
|---|---|---|
| AuthController | Controllers/AuthController.cs | ✅ |
| ControladorConPermisos | Controllers/ControladorConPermisos.cs | ✅ Base con permisos por modulo (2 oct 2026) |
| UsuariosController | Controllers/UsuariosController.cs | ✅ + permiso modulo 2 |
| RolesController | Controllers/RolesController.cs | ✅ + permiso modulo 9 |
| ParticipantesController | Controllers/ParticipantesController.cs | ✅ + permiso modulo 3 |
| DashboardController | Controllers/DashboardController.cs | ✅ + permiso modulo 1 |
| CatalogController | Controllers/CatalogController.cs | ✅ (solo [Authorize], catalogos de referencia) |
| GruposController | Controllers/GruposController.cs | ✅ + consulta con modulos 5/7/9, mutaciones Administrador |
| AcademicoController | Controllers/AcademicoController.cs | ✅ + permiso modulo 4 |
| ActividadesController | Controllers/ActividadesController.cs | ✅ + permiso modulo 5 + **asignar facilitadores** (6 oct 2026) |
| MonitoreoController | Controllers/MonitoreoController.cs | ✅ [Authorize] + permiso + alcance programa |
| EvaluacionesController | Controllers/EvaluacionesController.cs | ✅ [Authorize] + permiso + alcance programa |
| BackupController | Controllers/BackupController.cs | ✅ IdModulo=9; cargar/restaurar (6 oct 2026) |
| ConfiguracionController | Controllers/ConfiguracionController.cs | ✅ Apariencia: GET anónimo / PUT con permiso |

---

### Frontend Angular

#### Rutas activas
| Ruta | Componente | Estado |
|---|---|---|
| `/login` | LoginComponent | ✅ |
| `/forgot-password` | ForgotPasswordComponent | ✅ |
| `/reset-password` | ResetPasswordComponent | ✅ |
| `/dashboard` | DashboardComponent | ✅ |
| `/participantes` | ParticipantesComponent | ✅ |
| `/participantes/:id` | ParticipantePerfilComponent | ✅ |
| `/configuracion` | ConfiguracionComponent | ✅ |
| `/registro-academico` | AcademicoComponent | ✅ |
| `/actividades` | ActividadesComponent | ✅ |
| `/monitoreo` | MonitoreoComponent | ✅ (alias, abre Individual) |
| `/monitoreo/:tipo` | MonitoreoComponent | ✅ `individual` \| `grupo` \| `actividad` (solo con permisos del modulo 6) |
| `/evaluacion` | EvaluacionesComponent | ✅ (alias, abre Individual) |
| `/evaluacion/:tipo` | EvaluacionesComponent | ✅ `individual` \| `grupo` \| `actividad` (solo con permisos del modulo 7) |

Todas las rutas protegidas usan `[AuthGuard, permisoGuard(idModulo)]` (2 oct 2026): el guard carga los permisos desde `/api/auth/permisos` y redirige al primer modulo permitido (orden 7, 6, 5, 4, 3, 1) si el usuario no tiene acceso. El menú lateral solo muestra los módulos con permiso.

#### Login
| Funcionalidad | Estado |
|---|---|
| Login con credenciales | ✅ |
| JWT token + interceptor | ✅ |
| Recuperacion de contrasena (email) | ✅ Código 6 dígitos, 15 min, un solo uso, reenvío (6 oct) |
| "Ya tengo el código" + correo prellenado (`?correo=`) | ✅ (6 oct) |
| Bloqueo automatico al 3 intento + reactivar desbloquea | ✅ (6 oct) |
| Boton Microsoft OAuth | ⚠️ Necesita credenciales Azure |

#### Dashboard
| Funcionalidad | Estado |
|---|---|
| 6 stat cards animados | ✅ |
| Totales desde DB | ✅ |

#### Participantes
| Funcionalidad | Estado |
|---|---|
| Sub-tabs Educacion/Mujeres | ✅ Filtrado por programa |
| Busqueda por nombre | ✅ |
| Filtros categoria, genero, estado | ✅ |
| Orden A-Z / Z-A | ✅ |
| Crear participante (modal) | ✅ |
| Editar participante (modal) | ✅ |
| Eliminar participante (dialogo) | ✅ |
| Formulario: programa, categoria, datos personales | ✅ |
| Formulario: contacto, direccion, comunidad | ✅ |
| Formulario: tutor/encargado | ✅ |
| Upload de foto UUID | ✅ |
| Foto en tabla (avatar con fallback) | ✅ |
| Foto en perfil (hero card) | ✅ |
| Descarga de reporte PDF | ✅ |
| Descarga de reporte Excel | ✅ |
| Previsualizacion de reportes | ✅ Modal DomSanitizer |

#### Perfil del Participante - Tabs
| Tab | Estado |
|---|---|
| Datos personales | ✅ |
| Tutor/Encargado | ✅ |
| Programa | ✅ |
| Actividades | ⚠️ Placeholder |
| Monitoreo | ⚠️ Placeholder (el modulo `/monitoreo` ya existe; falta enlazar aqui) |
| Evaluaciones | ⚠️ Placeholder (el modulo `/evaluacion` ya existe; falta enlazar aqui) |
| Reg. Academico | ✅ (modulo separado `/registro-academico`) |
| Historial | ✅ Fecha registro |

#### Registro Academico
| Funcionalidad | Estado |
|---|---|
| Lista de estudiantes (solo Educacion) | ✅ |
| Busqueda y orden A-Z/Z-A | ✅ |
| Panel inscripciones + historial (tabs) | ✅ |
| Crear inscripcion (grado + ciclo) | ✅ |
| Eliminar inscripcion | ✅ |
| Registrar historial (grado + ciclo + promedio + resultado) | ✅ |
| Eliminar historial | ✅ |
| Calificaciones por bloque (I, II, III, IV) | ✅ |
| Promedio calculado en vivo | ✅ |
| Badge ANO ACTUAL | ✅ |
| Promedio final con circulo aprobado/reprobado | ✅ |

#### Modulo Actividades
| Funcionalidad | Estado |
|---|---|
| Lista de actividades con busqueda/filtros | ✅ |
| Filtro por estado + orden A-Z/Z-A | ✅ |
| Crear actividad (modal + dialogo confirm) | ✅ |
| Editar actividad (modal + dialogo confirm) | ✅ |
| Eliminar (dialogo confirm) | ✅ |
| Estado rapido (select en tabla) | ✅ |
| Modalidad Individual/Grupal | ✅ |
| Asignar participantes (modal checkboxes + busqueda) | ✅ |
| Pestañas **Actividades | Grupos** dentro del módulo (Grupos es una pestaña en la página, no una ventana emergente) | ✅ (1 oct 2026) |
| Pestaña Grupos: crear grupo (programa + nombre + descripción), buscar, lista con conteo de participantes creados | ✅ (1 oct 2026) |
| Panel de miembros: ver y remover participantes; "Agregar participantes" viene con **todos marcados por defecto** | ✅ (1 oct 2026) |
| Confirmaciones (dialogo rojo) para eliminar grupo y remover participante | ✅ (1 oct 2026) |
| Botón **Crear grupo** en cada actividad → abre la pestaña Grupos con nombre/programa prellenados y al crear **asigna automáticamente** los participantes de esa actividad (sin seleccionar nada) | ✅ (1 oct 2026) |
| Los grupos creados se usan en Monitoreo > Grupo (selector con los grupos y sus participantes) | ✅ (1 oct 2026) |
| Modal detalles (info + participantes asignados) | ✅ |
| Reporte general / finalizadas / en curso | ✅ |
| Reporte por actividad (preview modal) | ✅ |
| Reporte por participante | ✅ |
| Spinner + timeout HTTP (12-15s) en todos los calls | ✅ |
| Conteo "Asignados" usa totalParticipantes durante carga | ✅ |

#### Modulo Monitoreo (28 sep 2026 / 1 oct 2026)
| Funcionalidad | Estado |
|---|---|
| Submenu lateral (Individual / Grupo / Actividad) | ✅ Se elimino "Área / Categoría" |
| Una sola seccion visible a la vez (lista filtrada por tipo) | ✅ |
| Lista en tarjetas (cajitas) con titulo, fecha, responsable y detalles | ✅ |
| Seccion Actividad/Grupo: **una sola cajita por actividad / por grupo** (no una por participante) | ✅ (1 oct 2026) |
| Detalle de la cajita: tabla con todos los participantes monitoreados (nivel, fecha, observaciones) + ficha/editar/eliminar por fila | ✅ (1 oct 2026) |
| Reporte PDF desde la cajita y desde el detalle (todos los participantes de esa actividad/grupo) | ✅ (1 oct 2026) |
| Nombre de la actividad visible en cajita y detalle (se resuelve por `programacion_actividades`; `monitoreos.id_actividad` se llena al crear y se repararon 8 filas) | ✅ (1 oct 2026) |
| Registro individual en modal | ✅ |
| Seccion Grupo/Actividad (alta): lista de participantes con **todos marcados por defecto** (no hay que elegir uno a uno) | ✅ (1 oct 2026) |
| Guardado con `sp_Monitoreo_CrearLote`: 1 monitoreo por participante marcado, mismo nivel/fecha/observaciones | ✅ (1 oct 2026) |
| Registro masivo: participantes precargados con todos marcados + "Seleccionar todos" | ✅ (1 oct 2026) |
| Registro masivo en modal (no en la pagina) | ✅ |
| Seccion Actividad: al elegir la actividad aparecen sus participantes | ✅ (asistencia real de la programacion) |
| Seccion Grupo: al elegir el grupo aparecen **solo los participantes asignados al grupo** (`grupo_participantes`) | ✅ (1 oct 2026, antes cargaba el programa completo) |
| El selector de grupo carga los grupos creados en Actividades > Grupos (con su conteo de participantes) | ✅ (1 oct 2026) |
| Lista con busqueda, filtros programa/participacion | ✅ |
| Crear monitoreo individual (modal + dialogo confirm) | ✅ |
| Editar monitoreo (modal + dialogo confirm) | ✅ |
| Eliminar (dialogo confirm rojo) | ✅ |
| Monitoreo masivo (N participantes, checkbox + busqueda) | ✅ |
| Confirmacion azul obligatoria al guardar masivo | ✅ |
| Tipos: Individual / Participante / Area-Categoria / Grupo / Actividad | ✅ |
| Participacion: Excelente, Buena, Regular, Baja, No participo | ✅ |
| Observaciones libres por registro | ✅ |
| Ficha de monitoreo (detalle + participante + programacion) | ✅ |
| Reporte general (vista previa -> .html -> imprimir) | ✅ |
| Reporte descargable en **PDF multipagina** (html2canvas + jsPDF) | ✅ |
| Reporte por programa (Educacion / Mujeres) | ✅ |
| Reporte individual por participante | ✅ |
| Resumen en reporte (conteo por participacion) | ✅ |
| Permisos por rol (ocultar botones, 403 en API) | ✅ |
| Alcance por programa (Educacion / Mujeres) | ✅ |
| Spinner + timeout HTTP (12-20s) en todos los calls | ✅ |
| Botones coloreados: crear #1E3278, editar #F59E0B, eliminar #EF4444 | ✅ |
| Badge participacion con colores | ✅ |
| Tablas `monitoreos` y `observaciones_monitoreo` vacias (solo datos de prueba) | ✅ |

#### Modulo Evaluacion (1 oct 2026)
| Funcionalidad | Estado |
|---|---|
| Submenu lateral (Individual / Grupo / Actividad) | ✅ Entrada en el menu solo con permisos del modulo 7 |
| Una sola seccion visible a la vez (lista filtrada por tipo) | ✅ |
| Lista en tarjetas con participante, fecha, badge de nivel y acciones | ✅ |
| Registro individual en modal (fecha, tipo, nivel, resultado, observaciones) | ✅ |
| Niveles 1-5 en chips con preview (`Nivel n — texto → puntuación n×20/100 por criterio`) | ✅ |
| Criterios aplicables: Asistencia, Comprensión, Participación, Participación en actividad | ✅ |
| Seccion Grupo/Actividad (alta): lote con **todos los participantes marcados por defecto** + "Seleccionar todos" | ✅ |
| Dialogo de confirmacion antes de registrar (individual: participante + nivel; lote: cantidad + nivel) | ✅ |
| Editar evaluacion (modal + confirmacion) | ✅ |
| Eliminar (dialogo de confirmacion) | ✅ |
| Ficha de evaluacion (participante, programa, fecha, tipo, nivel, resultado, estado, evaluado por + criterios + promedio) | ✅ |
| Reporte PDF del registro y de la seccion | ✅ |
| **Coordinador "solo observaciones":** sin chips de nivel, observacion obligatoria, badge `Solo obs.`, dialogo "…registrando solo observaciones" | ✅ |
| Permisos por rol (ocultar botones/menu, 403 en API) + alcance por programa | ✅ |
| Validaciones: fecha obligatoria, nivel obligatorio (salvo solo-obs), minimo 1 participante marcado, grupo/actividad obligatorio | ✅ |
| Alerta + botón **Reintentar** si falla la carga de participantes del formulario | ✅ |
| Spinner + timeout HTTP + `retry(2)` en todos los calls | ✅ |
| Puntuacion persistida en `resultados_evaluacion.puntuacion` (nivel × 20) y resultado por criterio | ✅ |

#### Configuracion - Sub-secciones
| Sub-seccion | Estado |
|---|---|
| Usuarios | ✅ CRUD completo + reactivar resetea intentos de login |
| Roles | ✅ CRUD + conteo |
| Permisos | ✅ Toggle chips por modulo |
| Grupos | ✅ CRUD + asignacion participantes |
| Datos de empresa | ➖ Fuera de alcance (quitado 6 oct 2026) |
| Copia de seguridad | ✅ Manual + automática + historial + restaurar + cargar .bak |
| Apariencia | ✅ Logo, imagen login, colores+paleta, fuente, nombre (en caliente) |

#### Reportes
| Funcionalidad | Estado |
|---|---|
| Reporte general (tabla) | ✅ Logo ANADESA real |
| Reporte perfil (expediente) | ✅ Logo + foto base64 |
| Previsualizacion en modal | ✅ DomSanitizer |
| Descarga PDF | ✅ html2canvas + jsPDF |
| Descarga Excel | ✅ xlsx lazy load |
| Colores ANADESA | ✅ Navy, Verde, Azul, Amarillo |

#### Servicios Frontend
| Servicio | Archivo | Metodos |
|---|---|---|
| AuthService | auth.service.ts | login, logout, getCurrentUser |
| ParticipanteService | participante.service.ts | CRUD + SubirFotografia + getFotoUrl |
| UsuarioService | usuario.service.ts | CRUD usuarios |
| RolService | usuario.service.ts | CRUD roles + permisos |
| CatalogService | usuario.service.ts | Programas, categorias, comunidades |
| GrupoService | grupo.service.ts | CRUD + AsignarParticipante |
| AcademicoService | academico.service.ts | Inscripciones, historial, ciclos, grados, bloques, promedios |
| ActividadService | actividad.service.ts | CRUD, tipos, programas, participantes-disponibles, asignar, estado, **facilitadores-disponibles/asignar** |
| ReporteService | reporte.service.ts | Reportes PDF/Excel + generarPdfDeHtml (PDF multipagina desde HTML) |
| PermisoService | permiso.service.ts | cargar() con retry(2) y caché validada por token, tiene(), permisosDe(), alcancePrograma(), limpiar() |
| MonitoreoService | monitoreo.service.ts | CRUD, lote, participantes, areas, grupos, actividades, permisos |
| EvaluacionService | evaluacion.service.ts | CRUD, lote, ficha, participantes, grupos, actividades, criterios, permisos |
| AparienciaService | apariencia.service.ts | cargar(), guardar(), aplicar() — CSS vars, logo, document.title (en caliente) |
| BackupService | backup.service.ts | listar, crear, descargar, eliminar, restaurar, cargar (.bak), configuración |

#### Estilo Visual
| Elemento | Color/Valor |
|---|---|
| Primario (`--c-primario`) | desde BD (actual `#4B9CD3` Azul Lago) |
| Acento (`--c-acento`) | desde BD (actual `#0E6B23` Verde Institucional) |
| Verde (exito) | #228B22 |
| Amarillo sol | #F4A300 |
| Rojo (error) | #DC2626 |
| Purpura (mujeres) | #9333EA |
| Fuente | Arial / DM Sans, tamaño desde BD (`--fuente-base`) |
| Iconos | FontAwesome 6 |
| Paleta institucional (muestras) | Verde `#0E6B23`, Amarillo `#F5A623`, Azul Lago `#4B9CD3`, Café `#2B0F00`, Blanco `#FFFFFF`, Azul Claro `#EBF5FB` |

---

### Base de Datos

#### Tablas existentes (44+)
| Grupo | Tablas |
|---|---|
| Auth/Usuarios | tipos_usuario, usuarios (**intentos_fallidos**), roles, usuario_roles, modulos, permisos, rol_modulos, permisos, rol_modulo_permisos, usuario_modulos, recuperacion_contrasena |
| Participantes | programas, proyectos, categorias_participante, comunidades, participantes, fotografias_participante, contactos_participante, direcciones, familiares, participante_familiares |
| Grupos | grupos, grupo_participantes |
| Actividades | tipos_actividad, actividades, programacion_actividades, asignacion_facilitadores, asistencia |
| Monitoreo | monitoreos, observaciones_monitoreo |
| Evaluaciones | criterios_evaluacion, evaluaciones, resultados_evaluacion |
| Academico | asistencia, ciclos_escolares, grados, inscripciones_academicas, bloques_academicos, historial_academico, promedios |
| Sistema | reportes, notificaciones, expedientes_digitales, configuracion_apariencia, configuracion_backup, backup_historial |

### Base de Datos - Modulo Monitoreo (28 sep 2026)
| Elemento | Estado |
|---|---|
| Tablas | `monitoreos` + `observaciones_monitoreo` (FK `FK_observacion_monitoreo`) |
| Columnas usadas por el modulo | id_monitoreo, id_programacion, id_usuario, id_participante, id_grupo, id_actividad, tipo_monitoreo, fecha_monitoreo, participacion, observaciones, estado, fecha_registro |
| Columnas existentes SIN usar | `actividad_realizada`, `cantidad_planificada`, `cantidad_participantes`, `descripcion`, `resultado` (todas NULL, pendiente de exponer) |
| Constraint participacion | `CK_monitoreo_participacion` (Excelente/Buena/Regular/Baja/No participó/No participo) |
| Constraint cantidades | `CK_monitoreo_cantidades` (>= 0) |
| Constraint tipo | `CK_monitoreo_tipo` (recreado: Individual/Participante/Area-Categoria/Grupo/Actividad) |
| Permisos modulo 6 | `rol_modulo_permisos` sembrados por rol (Admin 1-7, Coordinador 2,3,5,6, Facilitadores 1,2,3,5,6) |
| SPs nuevos | 12 en `SQL/sp_monitoreo.sql` (re-ejecutable): ObtenerTodos/ObtenerPorId/Crear/Actualizar/Eliminar/CrearLote/Participantes/ObtenerAreas/ObtenerGrupos/ObtenerActividades/sp_ObtenerPermisosUsuario/sp_VerificarPermiso |
| Fix aplicado | Columna `veiene_de_asistencia` -> `viene_de_asistencia` en MonitoreoService (causaba IndexOutOfRangeException y devolvia `[]`) |
| Fix aplicado | `CONCAT_WS` de participantes ahora incluye `tercer_nombre` / `tercer_apellido` |
| Datos actuales | `monitoreos` = 0 filas, `observaciones_monitoreo` = 0 filas (limpiadas, identidad reseed a 1) |

### Base de Datos - Modulo Evaluacion (1 oct 2026)
| Elemento | Estado |
|---|---|
| Tablas | `criterios_evaluacion`, `evaluaciones`, `resultados_evaluacion` (tablas preexistentes, sin cambios de esquema) |
| Columnas de `evaluaciones` | id_evaluacion, id_programacion, id_participante, id_grupo, id_usuario, tipo_evaluacion, **fecha_evaluacion**, resultado_general, observaciones, estado |
| Columnas de `resultados_evaluacion` | id_resultado, id_evaluacion, id_criterio, puntuacion, resultado, observaciones (**no existe columna `nivel`**: el nivel se guarda como puntuación = nivel × 20) |
| Criterios | 4 filas: Asistencia, Comprensión, Participación, Participación en actividad |
| Permisos modulo 7 | `rol_modulo_permisos` sembrados: Admin 1-7; Coordinador 2,3,5,6 (sin "Crear" → solo observaciones); Facilitadores 1,2,3,5,6 |
| SPs | `SQL/sp_evaluacion.sql` (re-ejecutable): permisos del módulo + SPs de listado/ficha |
| Datos actuales | `evaluaciones` = **1** (id 39, participante 4, 2026-10-02, usuario 2), `resultados_evaluacion` = **3** (40 / Básico por criterio) |
| Fix BD | `AUTO_CLOSE OFF` en `DB_ANADESA` (antes la BD se cerraba sin conexiones y los siguientes queries fallaban) |

### Fix Criticos Resueltos
- **Problema**: System.Data.SqlClient con VARBINARY causaba hang en ASP.NET Core
- **Solucion**: Excluir fotografia de los SELECT en SPs
- **Problema**: Angular innerHTML saneaba estilos inline de reportes
- **Solucion**: Usar DomSanitizer.bypassSecurityTrustHtml()
- **Problema**: Fotos no aparecian en PDF generado
- **Solucion**: Convertir fotos a base64 antes de pasar a html2canvas
- **Problema**: `appsettings.json` tenia `;` final en connection string → crash `InvalidDataException` al arrancar
- **Solucion**: JSON valido; string sin `;` de sobra
- **Problema**: Timeout SQL intermitente de ~20s con `lpc:` (shared memory)
- **Solucion**: Cadena a TCP `Server=localhost,1433` + `Connection Timeout=15` + `CommandTimeout=15`
- **Problema**: `SqlException` no controlada en VS al usar `Task.Run` + sync ADO.NET
- **Solucion**: `ActividadService` y `AuthService.Login` en async puro (`OpenAsync`/`ExecuteReaderAsync`) con `catch (Exception)`
- **Problema**: Modal detalles mostraba "Asignados 0" mientras cargaba
- **Solucion**: Template usa `detalleItem.totalParticipantes` durante `cargandoDetalle`
- **Problema**: Spinner quedaba colgado si HTTP tardaba
- **Solucion**: `timeout(12000-15000)` en todos los calls del componente Actividades
- **Problema**: csproj con `System.Data.SqlClient` duplicado (NU1504)
- **Solucion**: Referencia unica eliminada
- **Problema**: Procesos zombi `AnadesaApi.exe` (5272, 7452, 9076) bloquean build de VS
- **Solucion temporal**: API corre desde `bin\Run` (`dotnet AnadesaApi.dll`); matar PIDs como admin o reiniciar PC
- **Problema**: API "colgada" sin escuchar en 5070 y el cliente quedaba esperando indefinidamente
- **Solucion**: reiniciar la API con log (`dotnet AnadesaApi.dll > api_log.txt 2>&1`) y verificar puerto antes de pruebas
- **Problema**: `RAISERROR` en un SP no detiene la ejecucion de las lineas siguientes
- **Solucion**: envolver en `BEGIN RAISERROR(...,16,1); RETURN; END`
- **Problema**: PowerShell colgaba sin salida en comandos largos con `Invoke-RestMethod`
- **Solucion**: scripts `.ps1` en Temp que escriben resultado a `.txt`, con `-TimeoutSec` y `-UseBasicParsing`
- **Problema**: build fallaba con MSB3027/MSB3021 porque el DLL estaba bloqueado por la API corriendo
- **Solucion**: detener la API antes de `dotnet build`
- **Problema**: fotos de participantes dejaron de cargar (la API corre desde `bin\Run` y `wwwroot` apuntaba a otra carpeta)
- **Solucion**: `Services/RutasArchivos.cs` resuelve la raíz del proyecto subiendo hasta `AnadesaApi.csproj` + fallback `PhysicalFileProvider` en `Program.cs` → `/fotos/*` responde 200
- **Problema**: cuando la BD fallaba, el menú y los botones desaparecían para toda la sesión (la API devolvía `200 []` y se guardaba como caché de permisos)
- **Solucion**: backend `PermisoService.ObtenerPermisosAsync` lanza el error (500); frontend conserva el caché, `retry(2)`, no sobrescribe con lista vacía y valida el caché contra el `token` vigente; `login/logout` limpian el caché
- **Problema**: `DB_ANADESA` tenía `AUTO_CLOSE ON` → timeouts intermitentes de conexión/comando
- **Solucion**: `ALTER DATABASE DB_ANADESA SET AUTO_CLOSE OFF`
- **Problema**: si la lista de participantes del formulario fallaba quedaba una lista obsoleta sin marcar (o vacía) y no había cómo reintentar
- **Solucion**: alerta con botón **Reintentar** + participante por defecto si la lista llega tarde + `retry(2)` en todas las listas
- **Problema**: si los permisos cargaban como "solo observaciones" con el modal abierto quedaba un nivel ya elegido
- **Solucion**: al cambiar a modo solo-observaciones se limpia nivel y resultado
- **Problema**: la prueba de UI borró una evaluación existente porque la lista inicial no pudo leerse
- **Solucion**: la prueba ahora solo limpia lo que creó (si la lista inicial no se lee, no borra nada) y la evaluación se restauró
- **Problema**: `GET /api/participantes/fotos/limpieza-rutas` estaba en `[AllowAnonymous]` y más de 20 endpoints (participantes, académico, actividades, usuarios, roles, dashboard, grupos) solo exigían `[Authorize]`: cualquier usuario autenticado los usaba sin importar su rol
- **Solucion**: base `ControladorConPermisos` con `PermisosModulo()`/`Puede()`/`SinPermiso()`; chequeo por módulo en todos esos controllers; limpieza de rutas ahora `[Authorize(Roles="Administrador")]` (2 oct 2026)
- **Problema**: las rutas del frontend solo tenían `AuthGuard` (token presente) y el menú mostraba todos los módulos
- **Solucion**: `permisoGuard(idModulo)` en `app.routes.ts` (redirige al primer módulo permitido o `/login`) + `*ngIf` por módulo en `layout.component.html` (2 oct 2026)

### Pruebas E2E Actividades (23 sep 2026)
| Endpoint | HTTP | Tiempo |
|---|---|---|
| POST /api/auth/login | 200 | 0.99s |
| GET /api/actividades | 200 | 0.21s |
| GET /tipos | 200 | 0.11s |
| GET /programas | 200 | 0.04s |
| GET /participantes-disponibles/1 | 200 | 0.11s |
| PUT /estado/1 | 200 | 0.04s |
| POST crear | 201 | 0.19s |
| PUT actualizar | 200 | 2.15s |
| POST asignar-participantes | 200 | 0.08s |
| DELETE | 200 | 0.16s |
| OPTIONS CORS | 204 | — |
| GET sin token | 401 | — |

### Pruebas E2E Monitoreo (28 sep 2026)
| Endpoint | HTTP | Resultado |
|---|---|---|
| POST /api/monitoreo (crear) | 201 | ✅ acentos OK |
| GET /api/monitoreo | 200 | ✅ lista con participante |
| PUT /api/monitoreo/{id} | 200 | ✅ |
| POST /api/monitoreo/lote | 200 | ✅ 3 creados |
| DELETE /api/monitoreo/{id} | 200 | ✅ |
| GET del eliminado | 404 | ✅ |
| GET /api/monitoreo sin token | 401 | ✅ |
| DELETE con rol Coordinador | 403 | ✅ (no tiene permiso 4) |
| GET lista con rol Coordinador | 200 | ✅ solo registros de su alcance |
| POST participante de otro programa | 400 | ✅ validacion de alcance |

**Usuarios de prueba creados:** `Coordinador1` (id 10, Roles[2]), `FacEdu1` (Roles[3]), `JuanD` (Roles[4]) — clave `123`.

---

## MODULO EVALUACION (1 oct 2026)

### Backend (`AnadesaApi`)
- **DTOs:** `DTOs/EvaluacionDTOs.cs` (EvaluacionDto, DetalleEvaluacionDto, Crear/Actualizar/Lote, ResultadoEvaluacion).
- **Servicio:** `Services/EvaluacionService.cs` (alcance por rol, validaciones, puntuación = nivel × 20 por criterio).
- **Controller:** `Controllers/EvaluacionesController.cs`:
  - `GET /api/evaluaciones` (lista + filtros), `GET /api/evaluaciones/{id}` (ficha con detalle)
  - `POST /api/evaluaciones` (individual), `PUT /api/evaluaciones/{id}`, `DELETE /api/evaluaciones/{id}`
  - `POST /api/evaluaciones/lote` (grupo/actividad)
  - `GET /api/evaluaciones/permisos` (permisos + alcance del módulo)
  - `GET /api/evaluaciones/participantes|grupos|actividades|criterios` (datos del formulario)
- **BD:** `SQL/sp_evaluacion.sql` (permisos del módulo 7, SPs de listado/ficha). Columnas reales: `resultados_evaluacion(id_resultado, id_evaluacion, id_criterio, puntuacion, resultado, observaciones)` — **no existe columna `nivel`**.
- **Permisos módulo 7 = Evaluación:** Admin 1-7; Coordinador → Consultar/Actualizar/Generar Reportes/Evaluar (sin "Crear"); Facilitadores → Crear/…/Evaluar.
- Compilado: `dotnet build -o bin\Run` OK. API E2E **47/47**.

### Frontend (`features/evaluaciones`)
- Rutas `/evaluacion/individual|grupo|actividad`, entrada en el menú (módulo 7), `EvaluacionService`.
- Secciones: Individual (1), Grupo y Actividad (lote, todos marcados por defecto).
- Niveles 1-5 con chips y preview (`Nivel n — texto → puntuación n×20/100`), resultado derivado o manual.
- Ficha de evaluación (campos + criterios + promedio), edición, eliminación con confirmación, reporte PDF.
- **Coordinador "solo observaciones":** sin chips de nivel, observación obligatoria, badge `Solo obs.`, diálogo "…registrando solo observaciones".
- Confirmaciones antes de registrar/actualizar/eliminar (individual y lote con cantidad y nivel).

### Correcciones incluidas en esta fase
1. **Fotos de participantes** no cargaban (ruta de `wwwroot` al ejecutar desde `bin\Run`): nuevo `Services/RutasArchivos.cs`, fallback `PhysicalFileProvider` en `Program.cs` → `/fotos/*.jpg|png` responde 200 y la UI muestra las fotos.
2. **Caché de permisos:** `PermisoService` conserva el caché ante fallos (no borra `localStorage`), `retry(2)`, no sobrescribe con lista vacía; `AuthService.login/logout` limpian el caché; el caché ahora se valida contra el `token` vigente (evita permisos de otro usuario).
3. **Backend `PermisoService.ObtenerPermisosAsync`** ahora propaga el error (500) en vez de devolver `[]`, para no confundir "fallo de BD" con "sin permisos".
4. **Monitoreo/Evaluaciones:** `retry` en grupos/actividades/participantes/criterios (count 2), un solo toast de aviso si fallan, botón **"Reintentar"** en la alerta de error de la lista y del modal.
5. **Formulario:** participante por defecto si la lista llega tarde/falla; si falla la carga de participantes del lote se muestra la alerta con "Reintentar" (ya no queda una lista obsoleta sin marcar); si los permisos cambian a "solo observaciones" con el modal abierto se limpia el nivel.
6. **BD `DB_ANADESA`:** `AUTO_CLOSE OFF` (antes la BD se cerraba al quedarse sin conexiones y los siguientes queries fallaban).

### Pruebas
- API E2E 47/47 (crear, ficha, editar, lote, permisos por rol, alcance, acentos).
- UI headless: fotos PASS, fallos de API simulados PASS (menú y permisos se conservan, botón Reintentar), flujo Individual + ficha + edición + Coordinador solo observaciones OK, diálogo de lote de Grupo OK ("Se registrarán 3 evaluación(es)…").
- **Restricción:** con el equipo saturado (CPU 70-90%, RAM libre <1 GB) los requests del navegador se atrasan y las corridas de UI quedan incompletas; con la máquina despejada pasan. La BD responde <300 ms cuando hay recursos.
- Scripts de prueba (en `C:\Users\Anton\AppData\Local\Temp\opencode\`): `test_ui_evaluacion.js` (flujo completo de UI), `test_ui_fotos_participantes.js`, `test_ui_fallos_api.js` (simula caída de API), `test_eva_api.mjs` (E2E API).

---

## SEGURIDAD POR MODULO (2 oct 2026)

Modelo tomado de la BD: tabla `modulos` (1 Dashboard, 2 Usuarios, 3 Participantes, 4 Académico, 5 Actividades, 6 Monitoreo, 7 Evaluación, 8 Reportes, 9 Configuración), tabla `permisos` y asignación `rol_modulo_permisos`:
- **Administrador** → módulos 1-9 con todos los permisos.
- **Coordinador** → módulos 6 (Monitoreo) y 7 (Evaluación).
- **Facilitadores** (Educación / Mujer) → módulos 6 y 7.

### Backend (obligatorio, no se puede saltar)
Nuevo base `Controllers/ControladorConPermisos.cs`: `IdModulo`/`NombreModulo`, `PermisosModulo()` (vía `PermisoService`), `Puede(permisos, ...acciones)`, `SinPermiso(accion)` → 403 con mensaje. Se aplica en:

| Módulo | Controller | GET | POST | PUT | DELETE |
|---|---|---|---|---|---|
| 1 | DashboardController | Consultar | — | — | — |
| 2 | UsuariosController | Consultar | — (Administrador) | — (Administrador) | — (Administrador) |
| 3 | ParticipantesController | Consultar | Crear | Actualizar (también foto) | Eliminar |
| 4 | AcademicoController | Consultar | Crear | — | Eliminar |
| 5 | ActividadesController | Consultar | Crear | Actualizar / estado | Eliminar |
| 6 | MonitoreoController | Consultar | Crear | Actualizar | Eliminar |
| 7 | EvaluacionesController | Consultar | Crear / lote | Actualizar | Eliminar |
| 9 | RolesController | Consultar | — (Administrador) | — (Administrador) | — (Administrador) |

- `GruposController`: lectura permitida si el usuario tiene `Consultar` en **5, 7 ó 9** (los grupos se ven desde Actividades, Evaluación y Configuración); mutaciones solo `Administrador`.
- `GET /api/participantes/fotos/limpieza-rutas` → **`[Authorize(Roles="Administrador")]`** (antes era `[AllowAnonymous]`).
- Se dejaron solo con `[Authorize]` (decisión): `CatalogController` (catálogos de referencia compartidos) y `GET /api/auth/permisos` (esencial para la sesión). `Auth/login`, `forgot-password` y `reset-password` son públicos por diseño.

### Frontend (comodidad, el backend manda)
- `core/guards/permiso.guard.ts` → `permisoGuard(idModulo)`; combinado con `AuthGuard` en todas las rutas: `dashboard`→1, `participantes`(+`:id`)→3, `registro-academico`→4, `actividades`→5, `monitoreo/:tipo`→6, `evaluacion/:tipo`→7, `configuracion`→9.
- Sin permiso → redirige al primer módulo permitido (orden 7, 6, 5, 4, 3, 1) o a `/login`. Si los permisos no se pueden cargar (API caída sin caché) deja pasar y decide el backend con 403.
- `layout.component.html`: cada `<li>` del menú con `*ngIf` por módulo (`tieneInicio`, `tieneParticipantes`, `tieneAcademico`, `tieneActividades`, `tieneMonitoreo`, `tieneEvaluacion`, `tieneConfiguracion`); si los permisos aún no cargan no se oculta nada (evita menú vacío con la API caída).

### Verificación (2 oct 2026)
- Probes API (`probe_permisos.mjs`): **Antonio** 200 en todos los módulos; **Coordinador1** y **FacEdu1** → 403 en 1/2/3/4/5/9 y 200 en 6, 7, grupos, catálogos y permisos; anónimo → 401. `POST /participantes/{id}/fotografia` como Coordinador → 403.
- UI (`test_ui_permisos.js`, 18/18 PASS): Coordinador al entrar a `/participantes` o `/dashboard` es redirigido a `/evaluacion`; su menú es solo **Monitoreo** y **Evaluación**; `/evaluacion/individual` sí carga; Antonio ve los 7 módulos y entra a `/participantes`.
- `dotnet build -o bin\Run` EXIT=0 y `npm run build` EXIT=0.

---

## ALCANCE POR PROGRAMA - EDUCACION / MUJERES (2 oct 2026)

Aislamiento de datos según el rol: **Facilitador Educación** solo opera el Programa de Educación (participantes, académico, actividades, grupos, monitoreo, evaluación, reportes); **Facilitador Mujeres** solo el Programa de Mujeres; **Administrador y Coordinador** ven los dos programas. Es el espejo de backend del menú de pestañas.

### Regla de alcance
`Services/AlcancePrograma.cs`: `DesdeRoles()/DesdeUsuario()` → fragmento `"Educac"`, `"Mujer"` o `null` (Administrador/Coordinador/sin rol de facilitador). `Coincide(alcance, nombre)` compara contra `programas.tipo_programa` / `programa_nombre`; `IdPorFragmento()` → 1 (Educación) / 2 (Mujeres). Monitoreo y Evaluación ya usaban este mismo fragmento en sus SPs (`@programa LIKE '%'+@fragmento+'%'`).

### Backend
- `Controllers/ControladorConPermisos.cs` ahora recibe `AlcanceService` y expone: `Alcance`, `IdProgramaDelAlcance`, `DeMiPrograma(nombre|idPrograma)`, `ProgramaAjeno()` (403) y `ParticipanteEnAlcanceAsync(id)`.
- **`Services/AlcanceService.cs` (nuevo)**: resolvers SQL por id — tipo de programa de un participante, participante de una inscripción/historial/promedio, programa de una programación de actividad / actividad / grupo, grupo de una asignación `grupo_participantes`.
- Cobertura por controller:

| Controller | Listado filtrado | Validación por id |
|---|---|---|
| Participantes (3) | `ObtenerTodos` usa `Alcance ?? programa`; `ParticipanteService` filtra en memoria por `programa_nombre` | ficha, actualizar, eliminar, subir foto (carga previa) y `id_programa` en crear → 403 |
| Académico (4) | — | inscripciones/historial/promedios por participante: 404 si no existe, 403 si es de otro programa (crear y eliminar) |
| Actividades (5) | `ObtenerTodas`, `programas`, `participantes-disponibles` | crear/actualizar (`id_programa`), actualizar/eliminar/estado por `id_programacion`, cada participante al asignar |
| Grupos | `ObtenerTodos` por `id_programa`/`programa_nombre` | ficha, crear/actualizar (`id_programa`), eliminar, asignar participante (grupo + participante), remover por `grupo_participantes` |
| Monitoreo (6) | `ObtenerTodos`/apoyos con `Alcance` (ya existente) | **refactorizado a `ControladorConPermisos`**: ficha, actualizar y eliminar validan `programa`; crear/lote validan cada participante |
| Evaluaciones (7) | igual que Monitoreo | ficha, actualizar, eliminar y cada participante de crear/lote |
| Dashboard (1) | conteos con `@idPrograma` condicional (participantes, monitoreos, evaluaciones, actividades, grupos); **usuarios sigue global** | — |

- `GET /monitoreo/permisos` y `/evaluaciones/permisos` devuelven `alcance` desde la base (mismo valor que antes).

### Permisos de módulo asignados (solo datos, vía `PUT /api/roles/{id}/permisos`)
| Rol | Módulos |
|---|---|
| Administrador | 1-9 |
| Coordinador | 6, 7 (ampliable desde Configuración > Permisos) |
| Facilitador Educación | 1, 3, 4, 5, 6, 7 (4 = Académico solo Educación) |
| Facilitador Mujeres | 1, 3, 5, 6, 7 (sin módulo 4) |

### Frontend
- `core/services/alcance.service.ts` (nuevo): `alcance` (deriva de `currentUser.roles`), `tabs` (solo las pestañas que el rol tiene permitidas), `inicial`, `etiqueta`/`color` para el chip, `claveDe/coincide/idDe`.
- `shared/components/programas-tabs/programas-tabs.component.ts` (nuevo): pestañas **Educación** (azul `#2563EB`) / **Mujeres** (morado `#9333EA`) con badge de conteo, mismo estilo que las de Participantes; muestra solo las pestañas del rol.
- Pestañas aplicadas en **Participantes** (migrado al componente compartido), **Actividades** (lista + sub-tab Grupos + selectores de programa), **Monitoreo** y **Evaluación** (sustituyen el desplegable `fPrograma`; también acotan grupos, actividades y participantes de los formularios).
- **Dashboard**: chip `<app-chip programa>` a la derecha del encabezado: "Programa de Educación", "Programa de Mujeres" o "Ambos programas".

### Verificación (2 oct 2026)
- `probe_alcance.mjs`: **45/45 OK** — FacEdu1 solo ve datos de Educación y recibe 403 en fichas/PUT/DELETE/crear de Mujeres (incluido DELETE cruzado sobre registro temporal: se crea como admin, FacEdu1 no lo borra, admin lo limpia); JuanD recíproco; Coordinador ve los dos programas en módulos que tiene; dashboard por programa igual al conteo real; anónimo 401.
- `test_ui_programas.js`: **34/34 PASS** — admin ve 2 pestañas y cambia de lista (participantes 4↔1, monitoreo badge 15/1, evaluaciones 1/0, actividades 2/0); FacEdu1 y JuanD ven 1 sola pestaña con su programa y chip correcto; 0 errores JS.
- Regresiones: `test_eva_api.mjs` 47/47, `test_ui_permisos.js` 18/18, `test_ui_evaluacion.js` flujo completo OK, `test_ui_fallos_api.js` PASS, `dotnet build` 0 errores, `npm run build` EXIT=0.

---

## GESTIÓN DE USUARIOS Y ROLES (3 oct 2026)

### Bug original
Al guardar un cambio de rol en **Configuración > Usuarios** aparecía `SqlException: El rol seleccionado no existe o está inactivo` (HTTP 500) y VS se rompía; además el modal **no precargaba** los roles disponibles y no validaba que el usuario tuviera al menos un rol.

### Backend (`AnadesaApi`)
- `Services/UsuarioService.cs`
  - `ObtenerTodosAsync`: después de `sp_ListarUsuarios` carga los `Roles` de cada usuario (query por lista de ids) → la tabla y el modal llegan con roles precargados.
  - `CrearAsync` y `ActualizarAsync`: lanzan `InvalidOperationException("Debe asignar al menos un rol al usuario.")` si `Roles` viene vacío.
- `Controllers/UsuariosController.cs`: `Actualizar` y `Eliminar` con `try/catch` → `BadRequest(new { message = ex.Message })` (nunca 500 con SqlException).
- **Importante:** `PUT /api/usuarios/{id}` reemplaza campos: los campos omitidos se guardan como `NULL` (el SP recibe `DBNull`). Hay que enviar el objeto completo (así lo hace el frontend).

### Frontend (`features/configuracion`)
- `configuracion.component.ts`: `cargarRoles()` al abrir el modal de crear/editar; validación `usuarioRoles.length === 0` → toast `Selecciona al menos un rol en "Roles asignados"` **sin enviar la petición**; toasts de error con `err.error?.message`.
- `configuracion.component.html`: sección de chips con label **"Roles asignados * (obligatorio)"**.

### Verificación (3 oct 2026)
- `test_usuario_rol.js` (API): **7/7 PASS** — lista con roles; PUT `roles=[3]` 200; PUT sin roles **400** con el mensaje; restauración a Administrador 200; estado final rol 1 / tipo 1.
- `test_ui_usuario_rol.js` (E2E UI): **16/16 PASS** — modal con 4 chips y rol actual precargado; sin rol no envía petición y el modal sigue abierto; cambio a Coordinador con toast de éxito + fila actualizada en la tabla; restauración a Facilitador Educación con toast; **caso especial:** al quitar tu propio rol admin, `GET /usuarios` responde `403` (los permisos se leen de la BD en vivo) y se restaura con el token vigente; 0 errores JS.
- Regresión: `test_ui_permisos.js` **18/18**, `test_ui_programas.js` **34/34**, `npm run build` EXIT=0, `dotnet build` 0 errores.

---

## PANEL DEL DASHBOARD + RESPONSIVE (3 oct 2026)

### Panel lateral izquierdo del Dashboard (historial + pendientes)
Mismo despliegue que el menú lateral: rail colapsado a la izquierda (60px, con contador de pendientes) que se expande a un panel de ~320px; en tablet/celular ocupa todo el ancho debajo del top-bar.

**Backend (`AnadesaApi`)**
- `DTOs/DashboardDTOs.cs` (nuevo): `ActividadRecienteDto {tipo,titulo,detalle,fecha,id_programa}` y `PendienteDto {tipo,titulo,detalle,severidad,cantidad}`.
- `Services/DashboardService.cs`
  - `ObtenerActividadRecienteAsync(int? idPrograma, int limite = 15)`: `UNION ALL` de participantes, monitoreos, evaluaciones, grupos y actividades (más usuarios solo cuando **no** hay filtro de programa), `TOP (@limite)` ordenado por `fecha DESC` y filtrado con `IdProgramaDelAlcance`.
  - `ObtenerPendientesAsync(int? idPrograma)`: contadores `actividad_vencida`, `sin_monitoreo`, `evaluacion_sin_resultado`, `beca_sin_monto`; solo devuelve los que tienen cantidad > 0, ordenados alta/media.
- `Controllers/DashboardController.cs`: `GET api/Dashboard/actividad-reciente?limite=15` y `GET api/Dashboard/pendientes`, ambos con `Puede(await PermisosModulo(), "Consultar")` + `IdProgramaDelAlcance`.

**Frontend**
- `core/services/participante.service.ts`: `DashboardService.ActividadReciente(limite)` y `.Pendientes()`.
- `shared/components/panel-historial/` (nuevo componente, declarado en `app.module`/`dashboard`):
  - `panel-historial.component.ts`: `expandido` (por defecto abierto si el viewport > 992px), `cargar()` con `forkJoin`, secciones Pendientes (severidad alta/media con contador) y Actividad reciente (timeline con icono por tipo y "hace X"), rail con badge de pendientes, estado `sticky`.
  - `panel-historial.component.html` / `.css`: botón desplegar/ocultar, botón refrescar, estado colapsado con "Historial y pendientes" (texto solo cuando no cabe la riel).
- `features/dashboard/dashboard.component.*`: plantilla envuelta en `.dashboard-layout` = `<app-panel-historial>` + `.dashboard-main`; tarjetas de módulos pasaron de `width:300px;height:300px` a `width:100%` con grids `minmax(min(300px,100%),1fr)`.

### Responsive (tablet/celular)
- `shared/components/layout/layout.component.*`: `esMovil`/`detectarMovil()` (breakpoint 992px), botón hamburguesa en el top-bar, drawer `translateX(-100%)` con overlay y botón ✕, cierre automático en `NavigationEnd` y al redimensionar.
- `layout.component.css` + `src/styles.scss`: media queries 992px/640px/768px — sidebar como drawer, `main-content margin-left:0`, `.table-anadesa` con scroll horizontal (`display:block;overflow-x:auto`), modales y toasts ajustados.
- Módulos que antes **no tenían ningún `@media`**: `academico` (layout de dos columnas 320px+1fr → una columna, modales `min(460px/540px, 94vw)`), `configuracion` (sidebar secundario → nav horizontal con scroll, `.roles-grid` y `.form-grid` a una columna, tablas con scroll), `participantes` (`.form-grid` a una columna, tabla con `min-width` + scroll, modal al 96%).
- `evaluaciones` y `monitoreo`: `.cards-grid` con `minmax(min(300px,100%),1fr)`.
- `actividades` ya tenía media query (filtros, `.grupo-crear-grid`, `.grupo-panel-cols` a una columna).

### Verificación (3 oct 2026)
- `npm run build` EXIT=0, `dotnet build -o bin\Run` 0 errores.
- **Pendiente de prueba manual** (backend nuevo debe estar corriendo): F5 en Visual Studio (recompila los endpoints nuevos), `Ctrl+F5` en el front, revisar el panel del Dashboard (desplegar/ocultar y refrescar) y F12 → modo dispositivo (390×844 y 768×1024) en Dashboard, Participantes, Configuración y Académico.

---

## MÓDULO CENTRAL DE REPORTES /reportes — TODO IN-PLACE (6 oct 2026)

Decisión del usuario: **todos** los reportes del módulo Reportes generan su vista previa **ahí mismo en `/reportes`, sin navegar** a otros módulos. Salidas **solo PDF y Excel** (sin HTML, sin imprimir).

### Implementación
- `features/reportes/reportes.component.ts` (reescrito):
  - Eliminado `modo`/`ruta`, import `Router` y el branch `router.navigate` de `generar()`.
  - Inyecta `MonitoreoService`/`EvaluacionService`/`ActividadService` con caches (`monitoreos`/`evaluaciones`/`actividades` + flags) y loaders `cargarMonitoreos/cargarEvaluaciones/cargarActividades`.
  - Generadores nuevos `generarMonitoreo/generarEvaluacion/generarActividades(tipo)` con filtros de alcance (`alcance.coincide(...)`), columnas vía `plantillaReporte`+`tablaHtml`, y helper `abrir(titulo, html)` que renderiza con `reporteModoHtml=true`.
  - `generar()` resuelve todo en modo directo: participantes, usuarios, académico, monitoreo, evaluación y actividades.
- `features/reportes/reportes.component.html`: eliminados la flecha y el pie "Abre el módulo"; pie siempre "PDF / Excel".
- Se conservaron (inofensivos, inalcanzables desde `/reportes`) los handlers `?reporte=`/`consumirReportePendiente` en monitoreo/evaluaciones/actividades.
- `reporte-preview`: modal solo con **Descargar PDF / Descargar Excel**.

### Robustez de los tests CDP (helpers nuevos reutilizables)
- `sesion()`: espera `location.origin === FRONT` (evita race con `localStorage` en `about:blank` y el logout por 401 del `JwtInterceptor`).
- `entrarA(ruta, selector)` con 3 reintentos, `navegar()` con restauración de token, `asegurarToken()`, kill de chromes strays al inicio.
- Resultado: `test_ui_reportes.js` **44/44 PASS** — admin 6 tarjetas, FacEdu1 sin Usuarios ni Mujeres, JuanD sin Usuarios/Académico ni Educación, perfil "Reporte actual" sin sección académica, monitoreo/actividades generan **sin salir de `/reportes`**, modal exactamente 2 salidas, 0 errores JS.

---

## FIX RESPONSIVE — SCROLL HORIZONTAL / VIEWPORT EXPANDIDO (6 oct 2026)

### Síntoma
En celular (390) el layout viewport **se expandía** (innerWidth 1021–1195 en vez de 390) y en desktop `/actividades` tenía scroll horizontal real (scrollWidth 1469 > 1440).

### Causa raíz
`layout-wrapper { display:flex }` + `.main-content { flex:1 }` sin `min-width:0` → flex item con `min-width:auto` = min-content: el contenido (tablas de ~1000–1170px) impedía que `.main-content` encogiera, forzaba la expansión del viewport (que a su vez desactivaba los `@media ≤768px` ya escritos) y producía el overflow del documento.

### Cambios (CSS, sin tocar estructura ni lógica)
- `shared/components/layout/layout.component.css`: `.main-content { min-width: 0 }`.
- `features/actividades/actividades.component.css`: `.table-card { overflow: hidden → overflow-x: auto }` (la tabla scrollea dentro de la tarjeta, también en desktop).
- `participantes` y `actividades`: en `@media (max-width:768px)` añadido `.page-header { flex-wrap: wrap; gap:12px }` y `.header-actions { flex-wrap: wrap }`.
- Ya existían y ahora sí se activan: `participantes`/`configuracion` `.table-container { overflow-x:auto }` + `.data-table { min-width:620px }`, `config-page` a columna, filtros con wrap.

### Verificación (6 oct 2026)
- `test_ui_responsive.js` **79/79 PASS** (celular 390 / tablet 768 / desktop 1440 en Dashboard, Participantes, Configuración, Actividades y Académico: `inner == scroll`, sidebar drawer, hamburguesa, drawer con overlay, 0 errores JS).
- Regresión: `test_ui_reportes.js` **44/44**, `test_ui_permisos.js` **18/18**, `npm run build` EXIT=0 (solo warnings CommonJS preexistentes).

---

## LOGIN — REDISEÑO AL MOCK + SIN MICROSOFT (6 oct 2026)

- Eliminado botón "Microsoft" y el método `loginMicrosoft()` (`login.component.html/.ts`); sin referencias en `Frontend/src` ni en tests.
- Nuevo layout split: panel izquierdo navy (burbujas + `LOGO_ANADESA.jpg` + títulos "Sistema de Gestión / ANADESA" + lema), panel der. claro con tarjeta blanca (input usuario/contraseña con iconos, toggle de ojo `mostrarContrasena`, alerta de error, botón verde con flecha, enlace "¿Olvidó su contraseña?", footer "Versión 1.0 / Política de privacidad / © 2026 ANADESA"). Responsive ≤992px compacta el panel.
- El panel izquierdo ahora usa `var(--c-primario)` (gradiente con `color-mix`) y el heading/botón/enlace `var(--c-acento)` → responden a Apariencia.
- Verificación: capturas + sondeo de píxeles; `npm run build` EXIT=0.

---

## CONFIGURACIÓN — COPIA DE SEGURIDAD REAL + APARIENCIA + SIN "EMPRESA" (6 oct 2026)

### Interpretación
Se eliminó **"Datos de la empresa"** (nav + sección placeholder). Se conservan Usuarios/Roles/Permisos/Grupos (núcleo funcional de la módulo); "Copia de seguridad" pasó de placeholder a **100% funcional** y se añadió la nueva sección **Apariencia**.

### Backend (compila: `dotnet build -o bin\Run` EXIT=0, 0 errores)
- Tabla BD: `configuracion_apariencia` (id=1; defaults `ANADESA`, `#1E3278`, `#26781E` — verde actual del sidebar, `mediana`, logo/imagen NULL).
- `DTOs/ConfiguracionDTOs.cs`: `AparienciaDto`, `BackupDto`.
- `Services/BackupService.cs`: listar `*.bak`, crear (`BACKUP … WITH INIT,FORMAT`, nombre `anadesa_yyyyMMdd_HHmmss.bak`, timeout 300, sin `COMPRESSION` — Express 2017), descargar, eliminar (anti-traversal), restaurar (SINGLE_USER → `RESTORE WITH REPLACE,RECOVERY` → MULTI_USER, conexión a `master`).
- `Services/ConfiguracionService.cs`: GET/PUT apariencia (valida hex `^#[0-9A-Fa-f]{6}$`, tamaños chica|mediana|grande, imágenes `data:image/` ≤4M chars, upsert id=1).
- `Controllers/BackupController.cs` y `Controllers/ConfiguracionController.cs`: `IdModulo=9`; rutas `GET/POST /api/backup`, `GET /api/backup/archivo?nombre=`, `DELETE /api/backup?nombre=`, `POST /api/backup/restaurar?nombre=` (solo rol Administrador), `GET/PUT /api/backup/configuracion`, `GET/PUT /api/configuracion/apariencia`.
- Directorio de copias: `Backend\AnadesaApi\Backups` (permisos concedidos a `NT SERVICE\MSSQL$SQLEXPRESS02` vía icacls; `BACKUP` de prueba OK).

### Respaldo automático — ejecución real en servidor (6 oct 2026)
- BD: `configuracion_backup` (id=1: activo, intervalo, hora, proxima_ejecucion, ultimo_respaldo, actualizado_en/por) y `backup_historial` (archivo, tipo Manual|Automatico, fecha, tamano_bytes, usuario_id, resultado).
- Frecuencias: **horario (cada hora), diario, semanal, mensual, anual** + hora `HH:mm`; validadas en `PUT /api/backup/configuracion` (400 en frecuencia/hora inválidas). `BackupService.CalcularProxima()` calcula la siguiente ejecución; `MarcarEjecucionAsync()` la recalcula tras cada corrida.
- **`BackupProgramadoService : BackgroundService`** (registrado en `Program.cs`): cada 45 s consulta la programación y, si `proxima_ejecucion` ya pasó, ejecuta `BACKUP DATABASE` real con tipo `Automatico` (sin depender del navegador). Éxito → `ultimo_respaldo` + nueva próxima; fallo → solo nueva próxima (evita bucle).
- Historial: cada creación inserta fila en `backup_historial`; `GET /api/backup` ahora fusiona **archivos en disco + registros del historial** → los registros sin archivo aparecen con `existe:false` (badge "Archivo eliminado"), los archivos sin registro asumen `tipo:Manual`.
- UI (estilo del mock del prototipo): tarjeta **Respaldo manual** (Crear copia ahora + última copia), tarjeta **Respaldo automático** (interruptor → frecuencia/hora, próxima ejecución, último automático, "Guardar configuración" con confirmación info) y **Historial de respaldos** (Tipo/Archivo/Fecha/Tamaño/Acciones con badges Manual/Automático/Archivo eliminado).

### Frontend (`npm run build` EXIT=0)
- Nuevos `core/services/apariencia.service.ts` (BehaviorSubject + localStorage-first + `aplicar()` → `--c-primario`, `--c-acento`, `--fuente-base`, `document.title`) y `core/services/backup.service.ts`.
- `app.component.ts`: `ngOnInit` → `apariencia.cargar()` (bootstrap en caliente).
- `styles.scss`: `:root` con `--c-primario #1E3278`, `--c-acento #26781E`, `--fuente-base 16px` + `html { font-size: var(--fuente-base) }` (mediana=16px = tamaño actual → sin regresión).
- `layout`: nombre/logo desde el servicio (sidebar `background: var(--c-acento)`); `login`: nombre/logo/colores desde el servicio; imagen de login opcional (`.con-imagen` con overlay de contraste).
- `configuracion`: nav sin "empresa" + "Apariencia" (fa-palette); sección **Copia de seguridad** real (tabla Archivo/Fecha/Tamaño/Acciones → descargar/restaurar/eliminar + "Crear copia ahora", confirmaciones con `mostrarDialogo`); sección **Apariencia** con 5 tarjetas: Logotipo, Imagen del inicio de sesión, Colores institucionales (picker + hex + 6 swatches de la paleta: Verde Institucional `#0E6B23`, Amarillo Sol `#F5A623`, Azul Lago `#4B9CD3`, Café Oscuro `#2B0F00`, Blanco Neutro `#FFFFFF`, Azul Claro `#EBF5FB`), Tamaño de fuente (chica/mediana/grande con preview) y Nombre mostrado; Guardar → PUT + aplica en caliente.

### Verificación (6 oct 2026)
- `test_ui_config.js` **26/26 PASS**: nav sin empresa y con Copia de seguridad/Apariencia, sin placeholders, 5 tarjetas, 12 swatches, opciones de fuente, vars globales (`--c-primario`, `--c-acento`, fuente raiz, sidebar = acento) **comparadas contra la BD** (no defaults fijos), login con heading/botón en color acento + logo, y **390 sin scroll horizontal**.
- `test_ui_backup.js` **17/17 PASS**: 3 tarjetas (Respaldo manual / Respaldo automático / Cargar respaldo), badge Cargado, interruptor que muestra frecuencia (5 opciones: Cada hora/Diario/Semanal/Mensual/Anual) y hora, cambio de frecuencia y **390 sin scroll horizontal**.
- **`test_e2e_config.js` 40/40 PASS (6 oct 2026, con API nueva)**: apariencia GET/PUT + validación hex, config respaldo GET/PUT + frecuencia/hora inválidas → 400, **ejecución real del scheduler automático** (se forzó `proxima_ejecucion` al pasado → el BackgroundService creó `anadesa_*.bak` con tipo `Automatico` en ≤45 s), creación manual, **descarga con firma `TAPE`**, carga de .bak (sección 5b), traversal rechazado, **restauración con rollback verificado** (marcador desaparece), DELETE conserva historial (`existe:false`), UI: badges Manual/Automático/Cargado/Archivo eliminado, guardar programación con diálogo → toast + "Próxima ejecución" visible, apariencia → sidebar/login reflejan nombre; preserva y restaura la configuración real del usuario.
- Regresión: `test_ui_responsive.js` **79/79** (con la nueva sección), `test_ui_reportes.js` **44/44**, `test_ui_permisos.js` **18/18**.
- **API desplegada**: binario corriendo en :5070 (`bin\Run\AnadesaApi.dll` con `dotnet`, fuera de VS). Para depurar en VS: primero detener esa instancia (`taskkill /IM AnadesaApi.exe /F`) y luego F5 (VS recompila con los archivos actuales).

---

## CARGAR RESPALDO + RECUPERACIÓN DE CONTRASEÑA + BLOQUEO 3 INTENTOS + NOMBRE DEL SISTEMA (6 oct 2026, tarde)

### 1. Cargar respaldo (.bak) desde el equipo
- `BackupService.CargarAsync` + `POST /api/backup/cargar` (multipart, `[RequestSizeLimit]`/`[RequestFormLimits]` 1 GB, permiso Crear): valida extensión `.bak`, tamaño 1 KB–1 GB, nombre seguro anti-colisión y **firma SQL Server** (`TAPE` o cabecera `01000000`); si falla borra el archivo temporal y devuelve 400.
- Historial: la carga registra fila con tipo **"Cargado"**.
- FE: 3ª tarjeta **"Cargar respaldo"** (entre manual y automática), input `.bak` oculto, validación cliente, toast de éxito y badge naranja **Cargado** en el historial.

### 2. Recuperación de contraseña — flujo completo
- Tras enviar el correo: nuevo enlace **"Ya tengo el código — restablecer contraseña"** → `/reset-password`; `?correo=` prellena el correo en esa página; enlace **"Reenviar código"**.
- Fixes que hacían imposible el flujo profundo: `GET /api/configuracion/apariencia` ahora **`[AllowAnonymous]`** (branding público) y el interceptor **no redirige** desde `/login`, `/forgot-password`, `/reset-password` (antes el 401 de apariencia rebotaba al usuario).
- Respuesta honesta: si SMTP falla, `AuthService.ForgotPasswordAsync` lanza `EMAIL_NO_ENVIADO` → `AuthController` devuelve **502** con mensaje claro (antes respondía "enviado" aunque fallara).
- `EmailService`: contraseña sin espacios + log accionable ante 535 (regenerar app password).
- `ResetPasswordAsync`: código de 6 dígitos, 15 min de vigencia, un solo uso, BCrypt en la nueva contraseña.

### 3. Bloqueo a los 3 intentos de login
- Columna `usuarios.intentos_fallidos` (INT NOT NULL DEFAULT 0).
- Fallo 1/2 → *"Contraseña incorrecta. Intentos restantes: N"*; fallo 3 → `estado=0` y *"Cuenta bloqueada tras 3 intentos fallidos…"*; acierto → contador a 0.
- `Login(request, out mensaje)`: sin filtro de estado en el SELECT (captura `intentos_fallidos`, ordinal 14); mensajes específicos para cuenta bloqueada/inactiva.
- Reactivar = poner **Activo** en Configuración → Usuarios: `UsuarioService.ActualizarAsync` resetea `intentos_fallidos` cuando `estado==1`.

### 4. Nombre del sistema + UI adaptativa
- `configuracion_apariencia.nombre_sistema` = **"Sistema de gestión, monitoreo y evaluación de participantes"** (59 chars, acentos verificados vía API).
- Sidebar: `.logo-text` adaptativo (nombre > 26 chars → 0.8rem / 4 líneas, sin desborde); topbar sin prefijo "Sistema " duplicado; login: marca a 22px (`.marca-larga`) y eliminada la línea estática "Sistema de Gestión"; `document.title` desde el servicio.

### Verificación (6 oct 2026, tarde) — TODO EN VERDE
- `test_bloqueo_login.js` **18/18**: ciclo completo con usuario temporal (`estado` 0→1), contador por fallo, bloqueo al 3er intento, reactivación lo desbloquea.
- `test_e2e_config.js` **40/40**: sección nueva 5b — carga válida → tipo `Cargado`; extensión/firma inválidas → 400; ningún archivo malo queda en disco; además preserva y restaura la apariencia/config reales del usuario.
- `test_ui_recupera.js` **16/16**: envío real de código (alerta de éxito), reset + login con contraseña nueva, restauración a `123`.
- `test_ui_config.js` **26/26**: aserciones ahora comparan contra la **BD** (nombre/colores actuales), no contra defaults fijos.
- `test_ui_backup.js` **17/17** (3 tarjetas + badge Cargado), `test_ui_responsive.js` **79/79**, `test_ui_reportes.js` **44/44**, `test_ui_permisos.js` **18/18**.
- SMTP: la app password `dxpy…` **sí envía** (250 durante los tests); mis ráfagas de diagnóstico repetidas disparan el 535 transitorio de Gmail — evitar envíos masivos muy seguidos.
- **API corriendo desde `bin\Run`** (`dotnet AnadesaApi.dll`, VS del usuario cerrado): para volver a VS, `taskkill /IM AnadesaApi.exe /F` y F5.

---

## ASIGNACIÓN DE FACILITADORES EN ACTIVIDADES (6 oct 2026, noche)

### Backend (compila 0 errores)
- `ActividadService`:
  - `ObtenerFacilitadoresDisponiblesAsync(idProgramacion)`: usuarios activos con rol `Facilitador%` (roles 3/4/5) + flag `asignado` (LEFT JOIN `asignacion_facilitadores` estado=1) + nombre completo.
  - `AsignarFacilitadoresAsync(idProgramacion, usuarios)`: en transacción — desactiva todo (`estado=0`) y reactiva/inserta los seleccionados con `fecha_asignacion=GETDATE()` (lista vacía = remover todos).
  - `ExisteProgramacionAsync`: evita inserts huérfanos.
- `ActividadesController` (módulo 5, respeta `BloqueoProgramacion`/alcance):
  - `GET /api/actividades/facilitadores-disponibles/{idProgramacion}` (permiso Consultar).
  - `POST /api/actividades/asignar-facilitadores/{idProgramacion}` body `{usuarios:[…]}` (permiso Crear/Actualizar): 404 si la programación no existe, **400 si algún id no es facilitador activo**.
- El SP `sp_Actividades_ObtenerTodas` ya calcula `responsable` = primer facilitador activo → la columna "Responsable" de la tabla se llena sola.

### Frontend (`npm run build` EXIT=0)
- `actividad.service.ts`: `ObtenerFacilitadoresDisponibles()` + `AsignarFacilitadores()` + interfaz `FacilitadorDisponible`.
- `actividades.component.*`: botón ámbar **Asignar facilitadores** (fa-chalkboard-teacher) en la columna Acciones; modal con lista de checkboxes (@usuario + correo), contador de seleccionados, spinner/vacío, guardar → toast del servidor + recarga (responsable se actualiza).

### Verificación (6 oct 2026)
- `api_fac_test.js` **11/11**: GET inicial [9,11], asignar → `9*`, responsable "Juan Tiney", no-facilitador → 400, programación inexistente → 404, sin token → 401, reasignar → solo `11*`, limpiar `[]` → nadie.
- `test_ui_facilitadores.js` **18/18**: botón en filas, modal con 2 facilitadores (Juan Diego / Pedro Alfonso), selección + contador, guardar → toast + "Juan Tiney" en Responsable, persistencia al reabrir, limpieza → toast "Facilitadores removidos" + responsable "—", 0 excepciones JS.
- Regresión: `test_ui_permisos.js` **FAIL (0)**, `test_ui_responsive.js` **79/79**.

---

## ESTADO POR MODULO (1 oct 2026)

| # | Modulo | Frontend | Backend / SPs | BD (filas actuales) | Estado |
|---|---|---|---|---|---|
| 1 | Login / Auth / Recupero | ✅ | ✅ | usuarios 10, roles 4 | ✅ Completo + recuperación total + bloqueo 3 intentos (6 oct) |
| 2 | Usuarios / Roles / Permisos | ✅ | ✅ | modulos, permisos poblados | ✅ Completo |
| 3 | Participantes | ✅ CRUD, fotos, reportes, perfil | ✅ | participantes 6 (5 activos) | ✅ Completo |
| 4 | Grupos | ✅ CRUD + asignacion | ✅ | grupos **1** (mostasilla, 3 participantes) | ✅ Completo |
| 5 | Catalogos / Dashboard | ✅ | ✅ | programas 2, categorias 4 | ✅ Completo |
| 6 | Registro Academico | ✅ | ✅ | inscripciones, historial, promedios | ✅ Completo |
| 7 | **Actividades** | ✅ CRUD + asignar participantes + asignar facilitadores + crear grupo + reportes | ✅ | programacion_actividades 4, asistencia 8, asignacion_facilitadores 2 (limpias tras test) | ✅ **CRUD + asignaciones** / ⚠️ falta asistencia UI |
| 8 | **Monitoreo** | ✅ CRUD + masivo + ficha + reportes + permisos | ✅ 12 SPs | monitoreos **13** (datos de prueba creados desde la UI, varía), observaciones_monitoreo **0** | ✅ **CRUD completo** / ⚠️ faltan observaciones + 5 columnas |
| 9 | **Evaluaciones** | ✅ CRUD + lote + ficha + reportes + permisos | ✅ Controller/Service/DTOs | criterios_evaluacion 4, evaluaciones **1** (id 39), resultados_evaluacion **3** | ✅ **CRUD completo** |
| 10 | Datos de empresa | ➖ Fuera de alcance (quitado del módulo Configuración) | — | — | ➖ Eliminado (6 oct) |
| 11 | Copia de seguridad | ✅ Manual + automática + historial + cargar .bak | ✅ Scheduler + cargar/restaurar | configuracion_backup, backup_historial | ✅ 100% (6 oct) |
| 12 | Notificaciones | ❌ No existe | ❌ No existe | notificaciones **0** | ❌ No iniciado |
| 13 | Expedientes digitales | ❌ No existe | ❌ No existe | expedientes_digitales 1 | ❌ No iniciado |
| 14 | Microsoft OAuth | ⚠️ Boton presente | ⚠️ Configurado | — | ⚠️ Faltan credenciales Azure |
| 15 | Email SMTP | ✅ Flujos completos | ✅ EmailService operativo | recuperacion_contrasena | ✅ App password vigente (6 oct) |

### Pendientes en detalle

**7. Actividades**
- ✅ Asignación de facilitadores completa (6 oct 2026): endpoints + modal con checkboxes + responsable en tabla.
- ✅ **Asistencia completada (11 oct 2026)**: checkmarks ✓/✗ en detalle actividad + endpoint `POST /actividades/asistencia/{idProgramacion}` + SP `sp_Asistencia_Marcar`.
- ✅ **Tab "Actividades" del perfil completada (11 oct 2026)**: CRUD asistencia con checkmarks + botón asignar a actividad programada.

**8. Monitoreo (lo que falta)**
- CRUD de `observaciones_monitoreo` (categoria, descripcion, recomendacion) dentro de la ficha.
- Exponer columnas existentes sin usar: `actividad_realizada`, `cantidad_planificada`, `cantidad_participantes`, `descripcion`, `resultado`.
- ✅ **Tab "Monitoreo" del perfil completada (11 oct 2026)**: CRUD completo (nuevo/editar/borrar filas) con botones en filas.
- Datos: tablas vacias a proposito (listas para pruebas).

**9. Evaluaciones (completado 1 oct 2026)**
- ✅ SPs, endpoints, servicio, componente, rutas y permisos del modulo 7 listos; E2E API 47/47.
- ✅ **Tab "Evaluaciones" del perfil completada (11 oct 2026)**: CRUD completo (nuevo/editar/borrar filas) con botones en filas.

**10. Datos de empresa (fuera de alcance)**
- Se eliminó del módulo Configuración (6 oct 2026): no hay nav ni sección. Si se requiere, reabrir como nuevo endpoint/tabla.

**11. Copia de seguridad (completado 6 oct 2026)**
- ✅ Manual + automática programada (BackgroundService real) + historial + restaurar + descargar + **cargar .bak desde el equipo**.

**12. Notificaciones (no iniciado)**
- Tabla `notificaciones` vacia; falta sistema interno + endpoint + badge en layout.

**14/15. OAuth y SMTP**
- SMTP: ✅ operativo (app password vigente; Gmail limita envíos repetidos muy seguidos).
- Azure AD: solo faltan las credenciales reales en `appsettings.json` (alcance externo).

### Tabs del perfil del participante (estado actual)
| Tab | Estado |
|---|---|
| Datos personales | ✅ |
| Tutor/Encargado | ✅ |
| Programa | ✅ |
| Actividades | ✅ CRUD asistencia (checkmarks ✓/✗) + asignar a actividad |
| Monitoreo | ✅ CRUD completo (nuevo/editar/borrar filas) |
| Evaluaciones | ✅ CRUD completo (nuevo/editar/borrar filas) |
| Reg. Academico | ✅ |
| Historial | ✅ |

---

## LO QUE NOS FALTA

| # | Modulo | Descripcion | Prioridad |
|---|---|---|---|
| 1 | Actividades - Asignacion facilitadores | ✅ Completado (6 oct 2026): endpoints + modal + responsable | — |
| 2 | Actividades - Asistencia | ✅ Completado (11 oct 2026): checkmarks ✓/✗ en detalle actividad + tab perfil | — |
| 3 | Actividades - Integrar en perfil participante | ✅ Completado (11 oct 2026): tab "Actividades" con CRUD | — |
| 4 | Monitoreo - observaciones | CRUD de `observaciones_monitoreo` (categoria, descripcion, recomendacion) dentro de la ficha | Alta |
| 4b | Monitoreo - columnas sin exponer | Mostrar `actividad_realizada`, `cantidad_planificada`, `cantidad_participantes`, `descripcion`, `resultado` en formularios y ficha | Media |
| 4c | Monitoreo - perfil participante | ✅ Completado (11 oct 2026): tab "Monitoreo" con CRUD | — |
| 5 | Evaluaciones | ✅ Completado (1 oct 2026): tab "Evaluaciones" con CRUD en perfil | — |
| 6 | Datos de empresa | ➖ Fuera de alcance: quitado de Configuración (6 oct 2026) | — |
| 7 | Copia de seguridad | ✅ Completado (6 oct 2026): manual + automática + historial + restaurar + cargar .bak | — |
| 8 | Reportes avanzados | Filtros por fecha, programa, participante | Media |
| 9 | Notificaciones | Sistema interno de notificaciones | Baja |
| 10 | Microsoft OAuth | Credenciales Azure AD reales | Baja |
| 11 | SMTP | ✅ App password vigente (6 oct 2026); cuidado con envíos repetidos muy seguidos (limita Gmail) | — |
| 12 | Optimizaciones | Paginación, loading spinners, guards de rol | Media |
| 13 | AcademicoService | Pasar a async + catch Exception (igual que ActividadService) | Media |
| 14 | Otros services | UsuarioService, RolService, ParticipanteService, etc.: mismo patron async/catch | Media |
| 15 | Limpieza zombis | Matar PIDs o reboot para que VS construya `bin\Debug` normal | Alta (entorno) |

### Fix Critico: SQL Server Shared Memory
- sqlcmd y Microsoft.Data.SqlClient cuelgan en Shared Memory
- System.Data.SqlClient 4.8.6 funciona pero falla con VARBINARY
- **Cadena actual:** TCP `localhost,1433` (no `lpc:`) + Pooling + Timeouts cortos
- SPs excluyen fotografia del SELECT principal

---

## REPORTE DE LIBRERÍAS Y TECNOLOGÍAS (6 oct 2026)

### Backend — .NET 8 (`AnadesaApi.csproj`)
| Paquete | Versión | Uso en el proyecto |
|---|---|---|
| BCrypt.Net-Next | 4.2.0 | Hash de contraseñas (login, reset, CRUD usuarios) |
| Microsoft.AspNetCore.Authentication.JwtBearer | 8.0.x | Emisión y validación de JWT |
| Microsoft.AspNetCore.Authentication.MicrosoftAccount | 8.0.x | OAuth Microsoft (botón login; faltan credenciales Azure) |
| Microsoft.EntityFrameworkCore.SqlServer | 8.0.x | Modelos EF Core (respaldos, apariencia, usuarios) |
| System.Data.SqlClient | 4.8.6 | Acceso SQL directo por TCP (evita bug Shared Memory de Express) |
| MailKit | 4.x | Cliente SMTP alternativo disponible |
| System.Net.Mail (BCL) | incluido | Envío real de correos (`EmailService`: recuperación, creación) |
| ClosedXML | 0.105.x | Exportación Excel en módulo de reportes |
| Swashbuckle.AspNetCore | 6.5.0 | Swagger / swagger-ui |

### Frontend — Angular 20 (`package.json`)
| Paquete | Versión | Uso en el proyecto |
|---|---|---|
| @angular/{core,common,forms,router,compiler,platform-browser} | 20.1.x | Framework SPA (módulos, forms, guards, interceptor) |
| @angular/cli + @angular/build | 20.1.x | Build y dev server (`ng serve` :4200) |
| rxjs | 7.8.x | Observables en services e interceptor HTTP |
| zone.js / tslib | 0.15.x / 2.x | Runtime Angular / helpers |
| xlsx | 0.18.5 | Exportar Excel desde el navegador |
| jspdf + jspdf-autotable | 4.2.1 / 5.0.8 | Generación de PDF con tablas (reportes) |
| file-saver | 2.0.x | Descargas (respaldos .bak, Excel, PDF) |
| ajv | 8.x | Validación de esquemas (tooling) |
| karma + jasmine | 6.x / 5.x | Tests unitarios (devDependencies) |
| prettier (config `.prettierrc`) | — | Formato de HTML/Angular templates |

### Infraestructura y herramientas de verificación
| Herramienta | Detalle |
|---|---|
| SQL Server Express 2017 | `Tonito\SQLEXPRESS02`, TCP `localhost,1433`; DB_ANADESA: 44 tablas, 43 SPs |
| sqlcmd (CLI) | Migraciones y aserciones de BD dentro de los tests |
| Node.js | Driver de los tests E2E propios (`test_*.js`, sin framework) |
| Chrome headless + CDP | 9 suites UI/E2E con **276 aserciones** totales; screenshots de evidencia |
| ws (WebSocket, transitiva de Angular) | Protocolo CDP de los tests |
| Kestrel / VS F5 | Ejecución de la API (`:5070`; hoy desde `bin\Run`) |
| SMTP | `smtp.gmail.com:587` STARTTLS + app password (SmtpSettings en `appsettings.json`) |

---

## ESTRUCTURA DE ARCHIVOS

### Backend (Backend/AnadesaApi/)
```
Controllers/
  ControladorConPermisos.cs
  AuthController.cs
  UsuariosController.cs
  RolesController.cs
  ParticipantesController.cs
  DashboardController.cs
  CatalogController.cs
  GruposController.cs
  AcademicoController.cs
  ActividadesController.cs
  MonitoreoController.cs
  EvaluacionesController.cs
  BackupController.cs
  ConfiguracionController.cs
Services/
  AuthService.cs
  AlcancePrograma.cs
  AlcanceService.cs
  EmailService.cs
  BackupService.cs
  BackupProgramadoService.cs
  ConfiguracionService.cs
  UsuarioService.cs
  RolService.cs
  ParticipanteService.cs
  DashboardService.cs
  CatalogService.cs
  GrupoService.cs
  AcademicoService.cs
  ActividadService.cs
  MonitoreoService.cs
  EvaluacionService.cs
  PermisoService.cs
  RutasArchivos.cs
DTOs/
  AuthDTOs.cs
  UsuarioDTOs.cs
  RolDTOs.cs
  ParticipanteDTOs.cs
  GrupoDTOs.cs
  ActividadDTOs.cs
  AcademicoDTOs.cs
  MonitoreoDTOs.cs
  EvaluacionDTOs.cs
  ConfiguracionDTOs.cs
SQL/
  sp_actividades.sql
  sp_monitoreo.sql
  sp_evaluacion.sql
  create_academic_tables.sql
  add_beca_monto.sql
Models/ (42 archivos EF Core)
Program.cs
appsettings.json
AnadesaApi.csproj
```

**Importante (ejecucion):**
- Build actual: `dotnet build ... -p:UseAppHost=false -o ".../bin/Run"`
- API: `dotnet AnadesaApi.dll` con WorkingDirectory = `Backend/AnadesaApi/bin/Run`
- No usar `Start-Process -RedirectStandard*` (cuelga el shell)
- La cadena de conexion vive en `appsettings.json` (raiz + copias en bin)

### Frontend (Frontend/src/app/)
```
app.routes.ts
app.config.ts
core/
  models/models.ts
  services/
    auth.service.ts
    participante.service.ts
    usuario.service.ts
    grupo.service.ts
    academico.service.ts
    actividad.service.ts
    reporte.service.ts
    permiso.service.ts
    alcance.service.ts
    monitoreo.service.ts
    evaluacion.service.ts
  guards/auth.guard.ts
  guards/permiso.guard.ts
  interceptors/jwt.interceptor.ts
features/
  login/
    login.component.*
    forgot-password.component.*
    reset-password.component.*
  dashboard/dashboard.component.*
  participantes/
    participantes.component.*
    perfil/participante-perfil.component.*
  configuracion/configuracion.component.*
  academico/academico.component.*
  actividades/actividades.component.*
  monitoreo/monitoreo.component.*
  evaluaciones/evaluaciones.component.*
shared/
  components/
    layout/layout.component.*
    reporte-preview/reporte-preview.component.*
    programas-tabs/programas-tabs.component.ts
```

---

## ORDEN DE PRIORIDAD

1. ~~Asignacion facilitadores~~ ✅ Completado (6 oct 2026)
2. ~~Asistencia en actividades + integración perfil~~ ✅ Completado (11 oct 2026): checkmarks ✓/✗ + tab Actividades con CRUD
3. Monitoreo - observaciones (`observaciones_monitoreo`) + 5 columnas sin exponer
4. ~~Monitoreo / Evaluaciones en perfil~~ ✅ Completado (11 oct 2026): tabs Monitoreo y Evaluaciones con CRUD completo
5. ~~Datos de empresa~~ ➖ Fuera de alcance (6 oct 2026) · ~~Copia de seguridad~~ ✅ Completada (6 oct 2026)
6. Reportes avanzados - Filtros por fecha/programa/participante
7. AcademicoService + demás services a async/catch
8. Notificaciones - Sistema interno
9. Optimizaciones - Paginación, loading, guards de rol
10. Microsoft OAuth - Credenciales Azure AD (SMTP ya operativo)

---

*Ultima actualizacion: 11 de octubre 2026 — Limpieza BD producción (4 tablas legacy + SPs huérfanos + modelos EF eliminados), migración total de 111 SQL inline a ~70 SPs en BD (API solo EXEC), informe único completo en perfil del participante (beca + académico todos los bloques + historial + evaluaciones + monitoreo + asistencia), **CRUD en perfil (Actividades/Monitoreo/Evaluaciones con checkmarks), responsive global en todo el sistema (login + 9 módulos + detalles, 79 aserciones a 390/768px), login responsive 3 breakpoints, fix NG0103 (visibleTabs getter → propiedad); 9 suites / 276 aserciones en verde*
