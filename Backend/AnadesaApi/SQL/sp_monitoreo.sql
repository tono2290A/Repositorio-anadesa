/* =====================================================================
   MODULO MONITOREO - REPARACION DE BASE DE DATOS + ESQUEMA + SPs
   Base de datos : DB_ANADESA
   Servidor      : localhost,1433
   Ejecucion     : sqlcmd -S localhost,1433 -E -d DB_ANADESA -f 65001 -i sp_monitoreo.sql
   ===================================================================== */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
USE [DB_ANADESA];
GO

/* =========================================================================
   1. REPARACION DE LA BASE DE DATOS
   ========================================================================= */

-- 1.1 Tabla de recuperacion de contrasena: el backend (AuthService) escribe en
--     'recuperaciones_contrasena' con columna 'id', mientras que la tabla real
--     se llama 'recuperacion_contrasena' con columna 'id_recuperacion'.
--     Se crea una vista alias compatible con el backend (lectura/escritura).
IF OBJECT_ID('dbo.recuperaciones_contrasena', 'V') IS NULL
    AND OBJECT_ID('dbo.recuperacion_contrasena', 'U') IS NOT NULL
BEGIN
    EXEC('CREATE VIEW dbo.recuperaciones_contrasena AS
          SELECT id_recuperacion AS id, correo, codigo, fecha_solicitud, fecha_expiracion, usado
          FROM dbo.recuperacion_contrasena');
    PRINT '1.1 Vista alias recuperaciones_contrasena creada.';
END
GO

-- 1.2 Participantes con programa y categoria incoherentes (rompe los filtros
--     de Educacion / Mujeres del modulo de Monitoreo).
UPDATE p SET p.id_categoria = c2.id_categoria
FROM participantes p
INNER JOIN categorias_participante c1 ON c1.id_categoria = p.id_categoria
INNER JOIN programas pr                ON pr.id_programa   = p.id_programa
INNER JOIN categorias_participante c2  ON c2.tipo_programa = pr.tipo_programa
WHERE c1.tipo_programa <> pr.tipo_programa;
PRINT '1.2 Participantes con categoria incoherente corregidos.';
GO

-- 1.3 Verificacion de integridad referencial de las tablas del modulo.
DECLARE @huerfanas INT;
SELECT @huerfanas = COUNT(*)
FROM monitoreos m
LEFT JOIN participantes p ON p.id_participante = m.id_participante
WHERE p.id_participante IS NULL;
IF @huerfanas > 0
BEGIN
    DELETE FROM monitoreos WHERE id_participante IS NULL;
    PRINT '1.3 Monitoreos sin participante eliminados.';
END
ELSE PRINT '1.3 Integridad de monitoreos verificada.';
GO

/* =========================================================================
   2. ESQUEMA DE LA TABLA MONITOREOS (adaptado al modulo)
   ========================================================================= */

-- 2.1 Un monitoreo individual NO esta ligado a una programacion: es opcional.
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('monitoreos')
           AND name = 'id_programacion' AND is_nullable = 0)
    ALTER TABLE dbo.monitoreos ALTER COLUMN id_programacion INT NULL;

-- 2.2 Todo monitoreo pertenece a un participante (obligatorio en la interfaz).
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('monitoreos')
           AND name = 'id_participante' AND is_nullable = 1)
BEGIN
    DELETE FROM monitoreos WHERE id_participante IS NULL;
    ALTER TABLE dbo.monitoreos ALTER COLUMN id_participante INT NOT NULL;
END

-- 2.3 El usuario registrador puede no existir ya (baja de usuario).
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('monitoreos')
           AND name = 'id_usuario' AND is_nullable = 0)
    ALTER TABLE dbo.monitoreos ALTER COLUMN id_usuario INT NULL;

-- 2.4 Columnas nuevas requeridas por el modulo.
IF COL_LENGTH('monitoreos', 'id_actividad') IS NULL
    ALTER TABLE dbo.monitoreos ADD id_actividad INT NULL;
IF COL_LENGTH('monitoreos', 'participacion') IS NULL
    ALTER TABLE dbo.monitoreos ADD participacion VARCHAR(20) NULL;
IF COL_LENGTH('monitoreos', 'fecha_registro') IS NULL
    ALTER TABLE dbo.monitoreos ADD fecha_registro DATETIME NULL;
PRINT '2.4 Columnas del modulo verificadas/creadas.';
GO

-- 2.5 Defaults por columna (se comprueba la columna, no el nombre de la restriccion).
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints
               WHERE parent_object_id = OBJECT_ID('monitoreos')
                 AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('monitoreos'), 'fecha_registro', 'ColumnId'))
    ALTER TABLE dbo.monitoreos ADD CONSTRAINT DF_monitoreo_fecha_registro DEFAULT (GETDATE()) FOR fecha_registro;

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints
               WHERE parent_object_id = OBJECT_ID('monitoreos')
                 AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('monitoreos'), 'estado', 'ColumnId'))
    ALTER TABLE dbo.monitoreos ADD CONSTRAINT DF_monitoreo_estado DEFAULT 'Registrado' FOR estado;

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints
               WHERE parent_object_id = OBJECT_ID('monitoreos')
                 AND parent_column_id = COLUMNPROPERTY(OBJECT_ID('monitoreos'), 'tipo_monitoreo', 'ColumnId'))
    ALTER TABLE dbo.monitoreos ADD CONSTRAINT DF_monitoreo_tipo DEFAULT 'Individual' FOR tipo_monitoreo;

-- 2.5 Los cinco niveles de participacion admitidos por la interfaz.
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name = 'CK_monitoreo_participacion' AND parent_object_id = OBJECT_ID('monitoreos'))
    ALTER TABLE dbo.monitoreos WITH CHECK ADD CONSTRAINT CK_monitoreo_participacion
        CHECK (participacion IS NULL OR participacion IN
               ('Excelente', 'Buena', 'Regular', 'Baja', 'No participo', 'No participó'));
PRINT '2.5 Defaults y CHECK de participacion aplicados.';
GO

-- 2.5b El CHECK original de tipo_monitoreo no contemplaba 'Individual' ni
--     'Area/Categoria', por lo que rechazaba cualquier registro nuevo.
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = 'CK_monitoreo_tipo' AND parent_object_id = OBJECT_ID('monitoreos'))
    ALTER TABLE dbo.monitoreos DROP CONSTRAINT CK_monitoreo_tipo;

ALTER TABLE dbo.monitoreos WITH CHECK ADD CONSTRAINT CK_monitoreo_tipo
    CHECK (tipo_monitoreo IN ('Individual', 'Participante', 'Area/Categoria', 'Grupo', 'Actividad'));
PRINT '2.5b CHECK de tipo_monitoreo corregido.';
GO

-- 2.6 Se liberan las FK que impedirian operaciones legitimas de otros modulos:
--     borrar una programacion o un grupo no debe borrar su historial de monitoreo.
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_monitoreo_programacion')
    ALTER TABLE dbo.monitoreos DROP CONSTRAINT FK_monitoreo_programacion;
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_monitoreo_grupo')
    ALTER TABLE dbo.monitoreos DROP CONSTRAINT FK_monitoreo_grupo;
PRINT '2.6 FK de programacion y grupo liberadas.';
GO

-- 2.7 FK del usuario registrador: al borrar un usuario se conserva el registro
--     sin su nombre (ON DELETE SET NULL).
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_monitoreo_usuario')
    ALTER TABLE dbo.monitoreos DROP CONSTRAINT FK_monitoreo_usuario;
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_monitoreo_usuario')
    ALTER TABLE dbo.monitoreos WITH CHECK ADD CONSTRAINT FK_monitoreo_usuario
        FOREIGN KEY (id_usuario) REFERENCES dbo.usuarios (id_usuario) ON DELETE SET NULL;
PRINT '2.7 FK de usuario registrador re-creada (SET NULL).';
GO

-- 2.8 Indices de consulta.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_monitoreo_participante_fecha')
    CREATE INDEX IX_monitoreo_participante_fecha ON dbo.monitoreos (id_participante, fecha_monitoreo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_monitoreo_fecha')
    CREATE INDEX IX_monitoreo_fecha ON dbo.monitoreos (fecha_monitoreo);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_monitoreo_actividad')
    CREATE INDEX IX_monitoreo_actividad ON dbo.monitoreos (id_actividad);
PRINT '2.8 Indices creados.';
GO

/* =========================================================================
   3. PERMISOS DEL MODULO MONITOREO (id_modulo = 6)
      1 Crear | 2 Consultar | 3 Actualizar | 4 Eliminar
      5 Generar Reportes | 6 Monitorear | 7 Evaluar
   ========================================================================= */

-- 3.1 Administrador: todos.
INSERT INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso)
SELECT 1, 6, p.id_permiso
FROM permisos p
WHERE p.id_permiso IN (1, 2, 3, 4, 5, 6, 7)
  AND NOT EXISTS (SELECT 1 FROM rol_modulo_permisos WHERE id_rol = 1 AND id_modulo = 6 AND id_permiso = p.id_permiso);

-- 3.2 Coordinador: consulta, registra observaciones (monitorear), actualiza y reporta. NO elimina.
INSERT INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso)
SELECT 2, 6, p.id_permiso
FROM permisos p
WHERE p.id_permiso IN (2, 3, 5, 6)
  AND NOT EXISTS (SELECT 1 FROM rol_modulo_permisos WHERE id_rol = 2 AND id_modulo = 6 AND id_permiso = p.id_permiso);

-- 3.3 Facilitador de Educacion: crea, consulta, actualiza, monitorea y reporta. NO elimina.
INSERT INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso)
SELECT 3, 6, p.id_permiso
FROM permisos p
WHERE p.id_permiso IN (1, 2, 3, 5, 6)
  AND NOT EXISTS (SELECT 1 FROM rol_modulo_permisos WHERE id_rol = 3 AND id_modulo = 6 AND id_permiso = p.id_permiso);

-- 3.4 Facilitador de Mujeres: crea, consulta, actualiza, monitorea y reporta. NO elimina.
INSERT INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso)
SELECT 4, 6, p.id_permiso
FROM permisos p
WHERE p.id_permiso IN (1, 2, 3, 5, 6)
  AND NOT EXISTS (SELECT 1 FROM rol_modulo_permisos WHERE id_rol = 4 AND id_modulo = 6 AND id_permiso = p.id_permiso);

-- 3.5 Acceso al modulo: el rol Coordinador no tenia ningun modulo asignado.
INSERT INTO rol_modulos (id_rol, id_modulo)
SELECT 2, m.id_modulo
FROM modulos m
WHERE m.id_modulo IN (1, 3, 6, 8)
  AND NOT EXISTS (SELECT 1 FROM rol_modulos WHERE id_rol = 2 AND id_modulo = m.id_modulo);

-- 3.6 Acceso al modulo para los demas roles que participan en Monitoreo.
INSERT INTO rol_modulos (id_rol, id_modulo)
SELECT r.id_rol, 6
FROM roles r
WHERE r.id_rol IN (1, 2, 3, 4, 5)
  AND NOT EXISTS (SELECT 1 FROM rol_modulos WHERE id_rol = r.id_rol AND id_modulo = 6);
PRINT '3.x Permisos y acceso al modulo Monitoreo sembrados.';
GO

/* =========================================================================
   4. STORED PROCEDURES DEL MODULO
   ========================================================================= */

/* ---------- 4.1 Listado general (con alcance por programa del rol) ------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_ObtenerTodos
    @programa VARCHAR(50) = NULL   -- 'Educac' / 'Mujer' / NULL = todos
AS
BEGIN
    SET NOCOUNT ON;

    SELECT m.id_monitoreo,
           m.id_participante,
           LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre, p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS participante,
           CONVERT(VARCHAR(10), m.fecha_monitoreo, 120)                  AS fecha,
           ISNULL(COALESCE(m.id_actividad, pa.id_actividad), 0)         AS id_actividad,
           ISNULL(a.nombre, '')                                          AS actividad,
           ISNULL(m.participacion, '')                                   AS participacion,
           ISNULL(m.observaciones, '')                                   AS observaciones,
           ISNULL(m.estado, 'Registrado')                                AS estado,
           LTRIM(RTRIM(CONCAT_WS(' ', u.primer_nombre, u.segundo_nombre,
                                 u.primer_apellido, u.segundo_apellido))) AS registrado_por,
           ISNULL(pr.tipo_programa, pr.nombre)                           AS programa,
           ISNULL(m.tipo_monitoreo, 'Individual')                        AS tipo_monitoreo,
           ISNULL(m.id_grupo, 0)                                         AS id_grupo,
           ISNULL(g.nombre, '')                                          AS grupo,
           ISNULL(m.id_programacion, 0)                                  AS id_programacion
    FROM dbo.monitoreos m
    INNER JOIN participantes p  ON p.id_participante = m.id_participante
    LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
    LEFT  JOIN programacion_actividades pa ON pa.id_programacion = m.id_programacion
    LEFT  JOIN actividades a    ON a.id_actividad    = COALESCE(m.id_actividad, pa.id_actividad)
    LEFT  JOIN grupos g         ON g.id_grupo        = m.id_grupo
    LEFT  JOIN usuarios u       ON u.id_usuario      = m.id_usuario
    WHERE (@programa IS NULL OR @programa = '' OR pr.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY p.primer_apellido ASC, p.primer_nombre ASC;
END
GO

/* ---------- 4.2 Ficha individual ---------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_ObtenerPorId
    @id_monitoreo INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT m.id_monitoreo,
           m.id_participante,
           LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre, p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS participante,
           CONVERT(VARCHAR(10), m.fecha_monitoreo, 120)                  AS fecha,
           ISNULL(COALESCE(m.id_actividad, pa.id_actividad), 0)         AS id_actividad,
           ISNULL(a.nombre, '')                                          AS actividad,
           ISNULL(m.participacion, '')                                   AS participacion,
           ISNULL(m.observaciones, '')                                   AS observaciones,
           ISNULL(m.estado, 'Registrado')                                AS estado,
           LTRIM(RTRIM(CONCAT_WS(' ', u.primer_nombre, u.segundo_nombre,
                                 u.primer_apellido, u.segundo_apellido))) AS registrado_por,
           ISNULL(pr.tipo_programa, pr.nombre)                           AS programa,
           ISNULL(m.tipo_monitoreo, 'Individual')                        AS tipo_monitoreo,
           ISNULL(m.id_grupo, 0)                                         AS id_grupo,
           ISNULL(g.nombre, '')                                          AS grupo,
           ISNULL(m.id_programacion, 0)                                  AS id_programacion
    FROM dbo.monitoreos m
    INNER JOIN participantes p  ON p.id_participante = m.id_participante
    LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
    LEFT  JOIN programacion_actividades pa ON pa.id_programacion = m.id_programacion
    LEFT  JOIN actividades a    ON a.id_actividad    = COALESCE(m.id_actividad, pa.id_actividad)
    LEFT  JOIN grupos g         ON g.id_grupo        = m.id_grupo
    LEFT  JOIN usuarios u       ON u.id_usuario      = m.id_usuario
    WHERE m.id_monitoreo = @id_monitoreo;
END
GO

/* ---------- 4.3 Crear registro ------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_Crear
    @id_participante INT,
    @fecha VARCHAR(10),
    @id_actividad INT = NULL,
    @id_programacion INT = NULL,
    @participacion VARCHAR(20) = NULL,
    @observaciones VARCHAR(500) = NULL,
    @tipo_monitoreo VARCHAR(30) = 'Individual',
    @id_grupo INT = NULL,
    @id_usuario INT = NULL,
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @fechaReal DATETIME = COALESCE(TRY_CONVERT(DATETIME, @fecha, 23), TRY_CONVERT(DATETIME, @fecha, 120), TRY_CONVERT(DATETIME, @fecha, 111), TRY_CONVERT(DATETIME, @fecha));
    IF @fechaReal IS NULL
        BEGIN RAISERROR ('La fecha del monitoreo no es valida (formato YYYY-MM-DD).', 16, 1); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM participantes WHERE id_participante = @id_participante AND estado = 1)
        BEGIN RAISERROR ('El participante seleccionado no existe o esta inactivo.', 16, 1); RETURN; END

    IF @programa IS NOT NULL AND @programa <> ''
       AND NOT EXISTS (SELECT 1 FROM participantes p
                       INNER JOIN programas pr ON pr.id_programa = p.id_programa
                       WHERE p.id_participante = @id_participante
                         AND pr.tipo_programa LIKE '%' + @programa + '%')
        BEGIN RAISERROR ('El participante no pertenece al programa que usted administra.', 16, 1); RETURN; END

    IF @participacion = '' SET @participacion = NULL;
    IF @observaciones = '' SET @observaciones = NULL;
    IF @id_actividad = 0 SET @id_actividad = NULL;
    IF @id_programacion = 0 SET @id_programacion = NULL;
    IF @id_grupo = 0 SET @id_grupo = NULL;

    -- Si viene solo la programacion, se resuelve la actividad a la que pertenece.
    IF @id_actividad IS NULL AND @id_programacion IS NOT NULL
        SELECT @id_actividad = id_actividad FROM dbo.programacion_actividades WHERE id_programacion = @id_programacion;

    DECLARE @id INT;

    INSERT INTO dbo.monitoreos
        (id_programacion, id_usuario, id_participante, id_grupo, tipo_monitoreo,
         fecha_monitoreo, observaciones, estado, id_actividad, participacion, fecha_registro)
    VALUES
        (@id_programacion, @id_usuario, @id_participante, @id_grupo,
         ISNULL(@tipo_monitoreo, 'Individual'), @fechaReal, @observaciones,
         'Registrado', @id_actividad, @participacion, GETDATE());

    SET @id = CAST(SCOPE_IDENTITY() AS INT);
    SELECT @id AS id_monitoreo, 'OK' AS mensaje;
END
GO

/* ---------- 4.4 Actualizar registro ------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_Actualizar
    @id_monitoreo INT,
    @id_participante INT,
    @fecha VARCHAR(10),
    @id_actividad INT = NULL,
    @id_programacion INT = NULL,
    @participacion VARCHAR(20) = NULL,
    @observaciones VARCHAR(500) = NULL,
    @tipo_monitoreo VARCHAR(30) = 'Individual',
    @id_grupo INT = NULL,
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM monitoreos WHERE id_monitoreo = @id_monitoreo)
        BEGIN RAISERROR ('Registro de monitoreo no encontrado.', 16, 1); RETURN; END

    DECLARE @fechaReal DATETIME = COALESCE(TRY_CONVERT(DATETIME, @fecha, 23), TRY_CONVERT(DATETIME, @fecha, 120), TRY_CONVERT(DATETIME, @fecha, 111), TRY_CONVERT(DATETIME, @fecha));
    IF @fechaReal IS NULL
        BEGIN RAISERROR ('La fecha del monitoreo no es valida (formato YYYY-MM-DD).', 16, 1); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM participantes WHERE id_participante = @id_participante AND estado = 1)
        BEGIN RAISERROR ('El participante seleccionado no existe o esta inactivo.', 16, 1); RETURN; END

    IF @programa IS NOT NULL AND @programa <> ''
       AND NOT EXISTS (SELECT 1 FROM participantes p
                       INNER JOIN programas pr ON pr.id_programa = p.id_programa
                       WHERE p.id_participante = @id_participante
                         AND pr.tipo_programa LIKE '%' + @programa + '%')
        BEGIN RAISERROR ('El participante no pertenece al programa que usted administra.', 16, 1); RETURN; END

    IF @participacion = '' SET @participacion = NULL;
    IF @observaciones = '' SET @observaciones = NULL;
    IF @id_actividad = 0 SET @id_actividad = NULL;
    IF @id_programacion = 0 SET @id_programacion = NULL;
    IF @id_grupo = 0 SET @id_grupo = NULL;

    UPDATE dbo.monitoreos
       SET id_participante  = @id_participante,
           fecha_monitoreo  = @fechaReal,
           id_actividad     = @id_actividad,
           id_programacion  = @id_programacion,
           participacion    = @participacion,
           observaciones    = @observaciones,
           tipo_monitoreo   = ISNULL(@tipo_monitoreo, 'Individual'),
           id_grupo         = @id_grupo,
           estado           = ISNULL(estado, 'Registrado')
     WHERE id_monitoreo = @id_monitoreo;

    SELECT @id_monitoreo AS id_monitoreo, 'OK' AS mensaje;
END
GO

/* ---------- 4.5 Eliminar registro --------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_Eliminar
    @id_monitoreo INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM monitoreos WHERE id_monitoreo = @id_monitoreo)
        BEGIN RAISERROR ('Registro de monitoreo no encontrado.', 16, 1); RETURN; END

    DELETE FROM observaciones_monitoreo WHERE id_monitoreo = @id_monitoreo;
    DELETE FROM monitoreos WHERE id_monitoreo = @id_monitoreo;

    SELECT @id_monitoreo AS id_monitoreo, 'OK' AS mensaje;
END
GO

/* ---------- 4.6 Monitoreo masivo (una fila por participante) ------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_CrearLote
    @ids_participantes VARCHAR(MAX),
    @fecha VARCHAR(10),
    @id_actividad INT = NULL,
    @id_programacion INT = NULL,
    @participacion VARCHAR(20) = NULL,
    @observaciones VARCHAR(500) = NULL,
    @tipo_monitoreo VARCHAR(30) = 'Area/Categoria',
    @id_grupo INT = NULL,
    @id_usuario INT = NULL,
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @fechaReal DATETIME = COALESCE(TRY_CONVERT(DATETIME, @fecha, 23), TRY_CONVERT(DATETIME, @fecha, 120), TRY_CONVERT(DATETIME, @fecha, 111), TRY_CONVERT(DATETIME, @fecha));
    IF @fechaReal IS NULL
        BEGIN RAISERROR ('La fecha del monitoreo no es valida (formato YYYY-MM-DD).', 16, 1); RETURN; END

    IF @ids_participantes IS NULL OR LTRIM(RTRIM(@ids_participantes)) = ''
        BEGIN RAISERROR ('Debe seleccionar al menos un participante.', 16, 1); RETURN; END

    IF @participacion = '' SET @participacion = NULL;
    IF @observaciones = '' SET @observaciones = NULL;
    IF @id_actividad = 0 SET @id_actividad = NULL;
    IF @id_programacion = 0 SET @id_programacion = NULL;
    IF @id_grupo = 0 SET @id_grupo = NULL;

    -- Si viene solo la programacion, se resuelve la actividad a la que pertenece.
    IF @id_actividad IS NULL AND @id_programacion IS NOT NULL
        SELECT @id_actividad = id_actividad FROM dbo.programacion_actividades WHERE id_programacion = @id_programacion;

    DECLARE @antes INT = (SELECT COUNT(*) FROM dbo.monitoreos);

    INSERT INTO dbo.monitoreos
        (id_programacion, id_usuario, id_participante, id_grupo, tipo_monitoreo,
         fecha_monitoreo, observaciones, estado, id_actividad, participacion, fecha_registro)
    SELECT @id_programacion,
           @id_usuario,
           TRY_CAST(LTRIM(RTRIM(s.value)) AS INT),
           @id_grupo,
           ISNULL(@tipo_monitoreo, 'Area/Categoria'),
           @fechaReal,
           @observaciones,
           'Registrado',
           @id_actividad,
           @participacion,
           GETDATE()
    FROM STRING_SPLIT(@ids_participantes, ',') s
    WHERE TRY_CAST(LTRIM(RTRIM(s.value)) AS INT) IS NOT NULL
      AND EXISTS (SELECT 1 FROM participantes p
                   WHERE p.id_participante = TRY_CAST(LTRIM(RTRIM(s.value)) AS INT)
                     AND p.estado = 1
                     AND (@programa IS NULL OR @programa = ''
                          OR EXISTS (SELECT 1 FROM programas pr
                                      WHERE pr.id_programa = p.id_programa
                                        AND pr.tipo_programa LIKE '%' + @programa + '%')));

    DECLARE @creados INT = (SELECT COUNT(*) FROM dbo.monitoreos) - @antes;
    SELECT @creados AS creados, 'OK' AS mensaje;
END
GO

/* ---------- 4.7 Participantes para el monitoreo masivo -------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_Participantes
    @id_programa INT = NULL,
    @id_categoria INT = NULL,
    @id_grupo INT = NULL,
    @id_programacion INT = NULL,   -- monitoreo por actividad
    @programa VARCHAR(50) = NULL   -- alcance del rol
AS
BEGIN
    SET NOCOUNT ON;

    -- Por actividad: se usa la lista real de asistencia de la programacion.
    -- Si la actividad no tiene participantes asignados, se usa su programa.
    IF @id_programacion IS NOT NULL AND @id_programacion > 0
    BEGIN
        IF EXISTS (SELECT 1 FROM asistencia WHERE id_programacion = @id_programacion)
        BEGIN
            SELECT p.id_participante,
                   LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre, p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS nombre,
                   ISNULL(pr.tipo_programa, pr.nombre)                           AS programa,
                   ISNULL(c.nombre, '')                                          AS categoria,
                   ISNULL(p.dpi, '')                                             AS dpi,
                   1 AS viene_de_asistencia
            FROM asistencia a
            INNER JOIN participantes p  ON p.id_participante = a.id_participante
            LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
            LEFT  JOIN categorias_participante c ON c.id_categoria = p.id_categoria
            WHERE a.id_programacion = @id_programacion
              AND p.estado = 1
              AND (@programa IS NULL OR @programa = ''
                   OR pr.tipo_programa LIKE '%' + @programa + '%')
            ORDER BY p.primer_apellido, p.primer_nombre;
            RETURN;
        END

        SELECT @id_grupo = NULL;
        SELECT @id_programa = a.id_programa
          FROM programacion_actividades pa
          INNER JOIN actividades a ON a.id_actividad = pa.id_actividad
         WHERE pa.id_programacion = @id_programacion;
    END

    SELECT p.id_participante,
           LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre, p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS nombre,
           ISNULL(pr.tipo_programa, pr.nombre)                           AS programa,
           ISNULL(c.nombre, '')                                          AS categoria,
           ISNULL(p.dpi, '')                                             AS dpi,
           0 AS viene_de_asistencia
    FROM participantes p
    LEFT  JOIN programas pr     ON pr.id_programa = p.id_programa
    LEFT  JOIN categorias_participante c ON c.id_categoria = p.id_categoria
    WHERE p.estado = 1
      AND (@id_programa IS NULL OR p.id_programa = @id_programa)
      AND (@id_categoria IS NULL OR p.id_categoria = @id_categoria)
      AND (@id_grupo IS NULL OR EXISTS (SELECT 1 FROM grupo_participantes gp
                                         WHERE gp.id_grupo = @id_grupo
                                           AND gp.id_participante = p.id_participante
                                           AND gp.estado = 1))
      AND (@programa IS NULL OR @programa = ''
           OR pr.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY p.primer_apellido, p.primer_nombre;
END
GO

/* ---------- 4.8 Areas y categorias disponibles --------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_ObtenerAreas
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 'Programa' AS tipo,
           pr.id_programa AS id,
           pr.nombre,
           ISNULL(pr.tipo_programa, pr.nombre) AS programa,
           (SELECT COUNT(*) FROM participantes p
             WHERE p.id_programa = pr.id_programa AND p.estado = 1) AS cantidad
    FROM programas pr
    WHERE pr.estado = 1
      AND (@programa IS NULL OR @programa = '' OR pr.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY pr.nombre;

    SELECT 'Categoria' AS tipo,
           c.id_categoria AS id,
           c.nombre,
           ISNULL(c.tipo_programa, c.nombre) AS programa,
           (SELECT COUNT(*) FROM participantes p
             WHERE p.id_categoria = c.id_categoria AND p.estado = 1) AS cantidad
    FROM categorias_participante c
    WHERE c.estado = 1
      AND (@programa IS NULL OR @programa = '' OR c.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY c.nombre;
END
GO

/* ---------- 4.9 Grupos activos ------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_ObtenerGrupos
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT g.id_grupo,
           g.id_programa,
           g.nombre,
           ISNULL(g.descripcion, '') AS descripcion,
           ISNULL(pr.tipo_programa, 'General') AS programa,
           (SELECT COUNT(*) FROM grupo_participantes gp
             INNER JOIN participantes p ON p.id_participante = gp.id_participante AND p.estado = 1
             WHERE gp.id_grupo = g.id_grupo AND gp.estado = 1) AS cantidad
    FROM grupos g
    LEFT JOIN programas pr ON pr.id_programa = g.id_programa
    WHERE g.estado = 1
      AND (@programa IS NULL OR @programa = '' OR pr.tipo_programa IS NULL
           OR pr.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY g.nombre;
END
GO

/* ---------- 4.10 Actividades con su programizacion ----------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Monitoreo_ObtenerActividades
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT pa.id_programacion,
           a.id_actividad,
           a.nombre,
           ISNULL(pr.tipo_programa, pr.nombre) AS programa,
           CONVERT(VARCHAR(10), pa.fecha_actividad, 120) AS fecha,
           ISNULL(pa.lugar, '') AS lugar,
           ISNULL(pa.estado, 'Programada') AS estado,
           ISNULL(ta.nombre, '') AS tipo_actividad,
           ISNULL((SELECT COUNT(*) FROM asistencia asi WHERE asi.id_programacion = pa.id_programacion), 0) AS asignados
    FROM programacion_actividades pa
    INNER JOIN actividades a ON a.id_actividad = pa.id_actividad
    LEFT  JOIN programas pr   ON pr.id_programa  = a.id_programa
    LEFT  JOIN tipos_actividad ta ON ta.id_tipo_actividad = a.id_tipo_actividad
    WHERE a.estado = 1
      AND (@programa IS NULL OR @programa = '' OR pr.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY pa.fecha_actividad DESC, a.nombre;
END
GO

/* ---------- 4.11 Permisos del usuario autenticado ------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerPermisosUsuario
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT m.id_modulo,
           m.nombre AS modulo,
           ISNULL(p.nombre, '') AS permiso
    FROM rol_modulo_permisos rmp
    INNER JOIN modulos m   ON m.id_modulo  = rmp.id_modulo
    INNER JOIN permisos p  ON p.id_permiso = rmp.id_permiso
    INNER JOIN usuario_roles ur ON ur.id_rol = rmp.id_rol
    WHERE ur.id_usuario = @id_usuario
      AND m.estado = 1
      AND p.estado = 1
    ORDER BY m.id_modulo, p.id_permiso;
END
GO

/* ---------- 4.12 Verificacion de permiso (autorizacion en API) ----------- */
CREATE OR ALTER PROCEDURE dbo.sp_VerificarPermiso
    @id_usuario INT,
    @id_modulo INT,
    @nombre_permiso VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1
               FROM rol_modulo_permisos rmp
               INNER JOIN usuario_roles ur ON ur.id_rol = rmp.id_rol
               INNER JOIN permisos p ON p.id_permiso = rmp.id_permiso
               WHERE ur.id_usuario = @id_usuario
                 AND rmp.id_modulo = @id_modulo
                 AND p.nombre = @nombre_permiso)
        SELECT 1 AS tiene;
    ELSE
        SELECT 0 AS tiene;
END
GO

/* ---------- Reparacion de datos: id_actividad faltante ------------------ */
-- Solo rellena los registros donde id_actividad es NULL y hay programacion asociada.
UPDATE m
   SET id_actividad = pa.id_actividad
FROM dbo.monitoreos m
INNER JOIN dbo.programacion_actividades pa ON pa.id_programacion = m.id_programacion
WHERE m.id_actividad IS NULL;
PRINT 'Reparacion: monitoreos.id_actividad completados (solo NULL).';
GO

PRINT '=====================================================';
PRINT 'SPs del modulo Monitoreo creados correctamente.';
PRINT '=====================================================';
GO
