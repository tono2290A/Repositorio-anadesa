/* ============================================================================
   MODULO EVALUACION - Stored Procedures  (DB_ANADESA)
   ----------------------------------------------------------------------------
   Respeta la estructura existente:
     evaluaciones        : id_programacion, id_participante, id_grupo, id_usuario,
                           tipo_evaluacion (CHECK: Participante|Grupo|Actividad),
                           fecha_evaluacion, resultado_general, observaciones, estado
     criterios_evaluacion: catalogo de criterios por programa (puntuacion_maxima=100)
     resultados_evaluacion: detalle por criterio (puntuacion 0-100, CASCADE)

   Regla de escala (acordada):
     Nivel 1..5  ->  puntuacion = nivel * 20  (1->20 ... 5->100)
     Nivel leido = ROUND(promedio(puntuacion) / 20)
     resultado_general = 'Aprobado' (4-5) | 'En proceso' (3) | 'Necesita apoyo' (1-2)
     Coordinador: nivel NULL -> sin filas en resultados_evaluacion (solo observaciones)

   Re-ejecutable: CREATE OR ALTER + inserciones protegidas con IF NOT EXISTS.
   Ejecutar con:  sqlcmd -S localhost,1433 -E -d DB_ANADESA -f 65001 -i sp_evaluacion.sql
   ============================================================================ */

SET NOCOUNT ON;
GO

/* ---------- 1. Permisos del modulo 7 (Evaluacion) por rol ----------------- */
/* Administrador ya tiene los 7 permisos. El resto se completa aqui.          */
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 2 AND id_modulo = 7 AND id_permiso = 2)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (2, 7, 2);  -- Coordinador: Consultar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 2 AND id_modulo = 7 AND id_permiso = 3)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (2, 7, 3);  -- Coordinador: Actualizar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 2 AND id_modulo = 7 AND id_permiso = 5)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (2, 7, 5);  -- Coordinador: Generar Reportes
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 2 AND id_modulo = 7 AND id_permiso = 7)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (2, 7, 7);  -- Coordinador: Evaluar

IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 3 AND id_modulo = 7 AND id_permiso = 1)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (3, 7, 1);  -- Fac. Educacion: Crear
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 3 AND id_modulo = 7 AND id_permiso = 2)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (3, 7, 2);  -- Fac. Educacion: Consultar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 3 AND id_modulo = 7 AND id_permiso = 3)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (3, 7, 3);  -- Fac. Educacion: Actualizar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 3 AND id_modulo = 7 AND id_permiso = 7)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (3, 7, 7);  -- Fac. Educacion: Evaluar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 3 AND id_modulo = 7 AND id_permiso = 5)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (3, 7, 5);  -- Fac. Educacion: Generar Reportes

IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 4 AND id_modulo = 7 AND id_permiso = 1)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (4, 7, 1);  -- Fac. Mujeres: Crear
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 4 AND id_modulo = 7 AND id_permiso = 2)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (4, 7, 2);  -- Fac. Mujeres: Consultar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 4 AND id_modulo = 7 AND id_permiso = 3)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (4, 7, 3);  -- Fac. Mujeres: Actualizar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 4 AND id_modulo = 7 AND id_permiso = 7)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (4, 7, 7);  -- Fac. Mujeres: Evaluar
IF NOT EXISTS (SELECT 1 FROM dbo.rol_modulo_permisos WHERE id_rol = 4 AND id_modulo = 7 AND id_permiso = 5)
    INSERT INTO dbo.rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES (4, 7, 5);  -- Fac. Mujeres: Generar Reportes
PRINT 'Permisos del modulo 7 (Evaluacion) verificados.';
GO

/* ---------- 2. Listado general ------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_ObtenerTodos
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT e.id_evaluacion,
           e.id_participante,
           LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre,
                                 p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS participante,
           CONVERT(VARCHAR(10), e.fecha_evaluacion, 120)                                    AS fecha,
           ISNULL(pr.tipo_programa, pr.nombre)                                              AS programa,
           ISNULL(e.tipo_evaluacion, 'Participante')                                        AS tipo_evaluacion,
           ISNULL(e.resultado_general, '')                                                  AS resultado_general,
           ISNULL(e.observaciones, '')                                                      AS observaciones,
           CASE WHEN e.estado = 1 THEN 'Activo' ELSE 'Inactivo' END                         AS estado,
           d.nivel,
           CASE d.nivel WHEN 1 THEN 'Necesita mejorar'
                        WHEN 2 THEN 'Básico'
                        WHEN 3 THEN 'En proceso'
                        WHEN 4 THEN 'Satisfactorio'
                        WHEN 5 THEN 'Excelente'
                        ELSE '' END                                                          AS nivel_texto,
           CAST(ROUND(ISNULL(d.promedio, 0), 2) AS DECIMAL(10, 2))                          AS promedio,
           ISNULL(d.criterios, 0)                                                           AS criterios,
           LTRIM(RTRIM(CONCAT_WS(' ', u.primer_nombre, u.segundo_nombre,
                                 u.primer_apellido, u.segundo_apellido)))                   AS evaluado_por,
           ISNULL(e.id_grupo, 0)                                                            AS id_grupo,
           ISNULL(g.nombre, '')                                                             AS grupo,
           ISNULL(e.id_programacion, 0)                                                     AS id_programacion,
           ISNULL(a.nombre, '')                                                             AS actividad
    FROM dbo.evaluaciones e
    INNER JOIN participantes p  ON p.id_participante = e.id_participante
    LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
    LEFT  JOIN grupos g         ON g.id_grupo        = e.id_grupo
    LEFT  JOIN usuarios u       ON u.id_usuario      = e.id_usuario
    LEFT  JOIN programacion_actividades pa ON pa.id_programacion = e.id_programacion
    LEFT  JOIN actividades a                ON a.id_actividad    = pa.id_actividad
    OUTER APPLY (SELECT CAST(ROUND(AVG(rd.puntuacion) / 20.0, 0) AS INT) AS nivel,
                        AVG(rd.puntuacion)                               AS promedio,
                        COUNT(rd.id_resultado)                           AS criterios
                 FROM dbo.resultados_evaluacion rd
                 WHERE rd.id_evaluacion = e.id_evaluacion) d
    WHERE (@programa IS NULL OR @programa = '' OR pr.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY e.fecha_evaluacion DESC, participante ASC;
END
GO

/* ---------- 3. Ficha individual (registro + detalle por criterio) --------- */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_ObtenerPorId
    @id_evaluacion INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT e.id_evaluacion,
           e.id_participante,
           LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre,
                                 p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS participante,
           CONVERT(VARCHAR(10), e.fecha_evaluacion, 120)                                    AS fecha,
           ISNULL(pr.tipo_programa, pr.nombre)                                              AS programa,
           ISNULL(e.tipo_evaluacion, 'Participante')                                        AS tipo_evaluacion,
           ISNULL(e.resultado_general, '')                                                  AS resultado_general,
           ISNULL(e.observaciones, '')                                                      AS observaciones,
           CASE WHEN e.estado = 1 THEN 'Activo' ELSE 'Inactivo' END                         AS estado,
           d.nivel,
           CASE d.nivel WHEN 1 THEN 'Necesita mejorar'
                        WHEN 2 THEN 'Básico'
                        WHEN 3 THEN 'En proceso'
                        WHEN 4 THEN 'Satisfactorio'
                        WHEN 5 THEN 'Excelente'
                        ELSE '' END                                                          AS nivel_texto,
           CAST(ROUND(ISNULL(d.promedio, 0), 2) AS DECIMAL(10, 2))                          AS promedio,
           ISNULL(d.criterios, 0)                                                           AS criterios,
           LTRIM(RTRIM(CONCAT_WS(' ', u.primer_nombre, u.segundo_nombre,
                                 u.primer_apellido, u.segundo_apellido)))                   AS evaluado_por,
           ISNULL(e.id_grupo, 0)                                                            AS id_grupo,
           ISNULL(g.nombre, '')                                                             AS grupo,
           ISNULL(e.id_programacion, 0)                                                     AS id_programacion,
           ISNULL(a.nombre, '')                                                             AS actividad
    FROM dbo.evaluaciones e
    INNER JOIN participantes p  ON p.id_participante = e.id_participante
    LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
    LEFT  JOIN grupos g         ON g.id_grupo        = e.id_grupo
    LEFT  JOIN usuarios u       ON u.id_usuario      = e.id_usuario
    LEFT  JOIN programacion_actividades pa ON pa.id_programacion = e.id_programacion
    LEFT  JOIN actividades a                ON a.id_actividad    = pa.id_actividad
    OUTER APPLY (SELECT CAST(ROUND(AVG(rd.puntuacion) / 20.0, 0) AS INT) AS nivel,
                        AVG(rd.puntuacion)                               AS promedio,
                        COUNT(rd.id_resultado)                           AS criterios
                 FROM dbo.resultados_evaluacion rd
                 WHERE rd.id_evaluacion = e.id_evaluacion) d
    WHERE e.id_evaluacion = @id_evaluacion;

    SELECT rd.id_resultado,
           rd.id_criterio,
           c.nombre                                                        AS criterio,
           rd.puntuacion,
           ISNULL(rd.resultado, '')                                        AS resultado,
           ISNULL(rd.observaciones, '')                                    AS observaciones
    FROM dbo.resultados_evaluacion rd
    INNER JOIN criterios_evaluacion c ON c.id_criterio = rd.id_criterio
    WHERE rd.id_evaluacion = @id_evaluacion
    ORDER BY c.nombre;
END
GO

/* ---------- 4. Participantes (individual / grupo / actividad) ------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_Participantes
    @id_programa INT = NULL,
    @id_categoria INT = NULL,
    @id_grupo INT = NULL,
    @id_programacion INT = NULL,
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    /* Por actividad: lista real de asistencia de la programacion. */
    IF @id_programacion IS NOT NULL AND @id_programacion > 0
    BEGIN
        IF EXISTS (SELECT 1 FROM asistencia WHERE id_programacion = @id_programacion)
        BEGIN
            SELECT p.id_participante,
                   LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre,
                                         p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS nombre,
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

    /* Por grupo: solo miembros asignados. */
    IF @id_grupo IS NOT NULL AND @id_grupo > 0
    BEGIN
        SELECT p.id_participante,
               LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre,
                                     p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS nombre,
               ISNULL(pr.tipo_programa, pr.nombre)                           AS programa,
               ISNULL(c.nombre, '')                                          AS categoria,
               ISNULL(p.dpi, '')                                             AS dpi,
               0 AS viene_de_asistencia
        FROM grupo_participantes gp
        INNER JOIN participantes p  ON p.id_participante = gp.id_participante
        LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
        LEFT  JOIN categorias_participante c ON c.id_categoria = p.id_categoria
        WHERE gp.id_grupo = @id_grupo
          AND gp.estado = 1
          AND p.estado = 1
          AND (@programa IS NULL OR @programa = ''
               OR pr.tipo_programa LIKE '%' + @programa + '%')
        ORDER BY p.primer_apellido, p.primer_nombre;
        RETURN;
    END

    SELECT p.id_participante,
           LTRIM(RTRIM(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.tercer_nombre,
                                 p.primer_apellido, p.segundo_apellido, p.tercer_apellido))) AS nombre,
           ISNULL(pr.tipo_programa, pr.nombre)                           AS programa,
           ISNULL(c.nombre, '')                                          AS categoria,
           ISNULL(p.dpi, '')                                             AS dpi,
           0 AS viene_de_asistencia
    FROM participantes p
    LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
    LEFT  JOIN categorias_participante c ON c.id_categoria = p.id_categoria
    WHERE p.estado = 1
      AND (@id_programa IS NULL OR p.id_programa = @id_programa)
      AND (@id_categoria IS NULL OR p.id_categoria = @id_categoria)
      AND (@programa IS NULL OR @programa = ''
           OR pr.tipo_programa LIKE '%' + @programa + '%')
    ORDER BY p.primer_apellido, p.primer_nombre;
END
GO

/* ---------- 5. Grupos ------------------------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_ObtenerGrupos
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

/* ---------- 6. Actividades con su programacion --------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_ObtenerActividades
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

/* ---------- 7. Criterios de evaluacion ------------------------------------ */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_ObtenerCriterios
    @tipo_programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT c.id_criterio,
           c.nombre,
           ISNULL(c.descripcion, '')    AS descripcion,
           ISNULL(c.tipo_programa, '')  AS tipo_programa,
           ISNULL(c.puntuacion_maxima, 100) AS puntuacion_maxima
    FROM dbo.criterios_evaluacion c
    WHERE c.estado = 1
      AND (@tipo_programa IS NULL OR @tipo_programa = ''
           OR c.tipo_programa IS NULL OR c.tipo_programa = ''
           OR c.tipo_programa LIKE '%' + @tipo_programa + '%')
    ORDER BY c.nombre;
END
GO

/* ---------- 7b. Criterios aplicables a un participante -------------------- */
/* Devuelve los criterios de su programa; si el programa no tiene criterios   */
/* propios, devuelve todos los activos.                                       */
CREATE OR ALTER FUNCTION dbo.fn_Evaluacion_CriteriosAplicables (@id_participante INT)
RETURNS TABLE
AS
RETURN
    WITH prog AS (
        SELECT ISNULL(MAX(pr.tipo_programa), '') AS tipo_prog
        FROM participantes p
        LEFT JOIN programas pr ON pr.id_programa = p.id_programa
        WHERE p.id_participante = @id_participante
    ),
    match AS (
        SELECT c.id_criterio,
               CASE WHEN ISNULL(c.tipo_programa, '') = ''
                     OR c.tipo_programa LIKE '%' + (SELECT tipo_prog FROM prog) + '%'
                    THEN 1 ELSE 0 END AS aplica
        FROM dbo.criterios_evaluacion c
        WHERE c.estado = 1
    )
    SELECT id_criterio FROM match WHERE aplica = 1
    UNION ALL
    SELECT id_criterio FROM match
    WHERE NOT EXISTS (SELECT 1 FROM match WHERE aplica = 1);
GO

/* ---------- 8. Crear evaluacion individual -------------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_Crear
    @id_participante INT,
    @fecha VARCHAR(10),
    @tipo_evaluacion VARCHAR(50) = 'Participante',
    @id_programacion INT = NULL,
    @id_grupo INT = NULL,
    @nivel INT = NULL,
    @resultado VARCHAR(500) = NULL,
    @observaciones VARCHAR(500) = NULL,
    @id_usuario INT = NULL,
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @fechaReal DATE;
    IF @fecha IS NULL OR LTRIM(RTRIM(@fecha)) = ''
        BEGIN RAISERROR ('La fecha de la evaluacion es obligatoria.', 16, 1); RETURN; END

    SET @fechaReal = COALESCE(TRY_CONVERT(DATE, @fecha, 23), TRY_CONVERT(DATE, @fecha, 120),
                              TRY_CONVERT(DATE, @fecha, 111), TRY_CONVERT(DATE, @fecha));
    IF @fechaReal IS NULL
        BEGIN RAISERROR ('La fecha de la evaluacion no es valida (formato YYYY-MM-DD).', 16, 1); RETURN; END

    /* El CHECK de la tabla solo admite Participante | Grupo | Actividad */
    IF @tipo_evaluacion = 'Individual' SET @tipo_evaluacion = 'Participante';
    IF @tipo_evaluacion IS NULL OR @tipo_evaluacion NOT IN ('Participante', 'Grupo', 'Actividad')
        BEGIN RAISERROR ('El tipo de evaluacion no es valido.', 16, 1); RETURN; END

    IF @id_participante IS NULL OR @id_participante <= 0
        BEGIN RAISERROR ('Seleccione un participante.', 16, 1); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM participantes WHERE id_participante = @id_participante AND estado = 1)
        BEGIN RAISERROR ('El participante seleccionado no existe o esta inactivo.', 16, 1); RETURN; END

    IF @programa IS NOT NULL AND @programa <> ''
       AND NOT EXISTS (SELECT 1 FROM participantes p
                       INNER JOIN programas pr ON pr.id_programa = p.id_programa
                       WHERE p.id_participante = @id_participante
                         AND pr.tipo_programa LIKE '%' + @programa + '%')
        BEGIN RAISERROR ('El participante no pertenece al programa que usted administra.', 16, 1); RETURN; END

    IF @nivel IS NOT NULL AND (@nivel < 1 OR @nivel > 5)
        BEGIN RAISERROR ('El nivel de desempeno debe estar entre 1 y 5.', 16, 1); RETURN; END

    SET @resultado   = NULLIF(LTRIM(RTRIM(ISNULL(@resultado, ''))), '');
    SET @observaciones = NULLIF(LTRIM(RTRIM(ISNULL(@observaciones, ''))), '');

    /* Sin nivel el registro es de cumplimiento: la observacion es obligatoria. */
    IF @nivel IS NULL AND @observaciones IS NULL
        BEGIN RAISERROR ('Registre la observacion de cumplimiento.', 16, 1); RETURN; END

    IF @id_programacion = 0 SET @id_programacion = NULL;
    IF @id_grupo = 0 SET @id_grupo = NULL;

    IF @tipo_evaluacion = 'Actividad' AND (@id_programacion IS NULL OR @id_programacion = 0)
        BEGIN RAISERROR ('La evaluacion por actividad requiere una actividad.', 16, 1); RETURN; END
    IF @tipo_evaluacion = 'Grupo' AND (@id_grupo IS NULL OR @id_grupo = 0)
        BEGIN RAISERROR ('La evaluacion por grupo requiere un grupo.', 16, 1); RETURN; END

    IF EXISTS (SELECT 1 FROM dbo.evaluaciones
               WHERE id_participante = @id_participante
                 AND fecha_evaluacion = @fechaReal
                 AND tipo_evaluacion = @tipo_evaluacion)
        BEGIN RAISERROR ('Ya existe una evaluacion para este participante en esa fecha. Edite el registro existente.', 16, 1); RETURN; END

    /* Resultado derivado del nivel cuando no viene texto. */
    IF @resultado IS NULL AND @nivel IS NOT NULL
        SET @resultado = CASE WHEN @nivel >= 4 THEN 'Aprobado'
                              WHEN @nivel = 3 THEN 'En proceso'
                              ELSE 'Necesita apoyo' END;

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @id INT;
        INSERT INTO dbo.evaluaciones
            (id_programacion, id_participante, id_grupo, id_usuario, tipo_evaluacion,
             fecha_evaluacion, resultado_general, observaciones, estado)
        VALUES
            (@id_programacion, @id_participante, @id_grupo, @id_usuario, @tipo_evaluacion,
             @fechaReal, @resultado, @observaciones, 1);

        SET @id = CAST(SCOPE_IDENTITY() AS INT);

        IF @nivel IS NOT NULL
            INSERT INTO dbo.resultados_evaluacion (id_evaluacion, id_criterio, puntuacion, resultado, observaciones)
            SELECT @id,
                   x.id_criterio,
                   CAST(@nivel * 20.0 AS DECIMAL(10, 2)),
                   CASE @nivel WHEN 1 THEN 'Necesita mejorar'
                               WHEN 2 THEN 'Básico'
                               WHEN 3 THEN 'En proceso'
                               WHEN 4 THEN 'Satisfactorio'
                               ELSE 'Excelente' END,
                   NULL
            FROM dbo.fn_Evaluacion_CriteriosAplicables(@id_participante) x;

        COMMIT;
        SELECT @id AS id_evaluacion, 'OK' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

/* ---------- 9. Crear evaluaciones masivas (transaccional) ----------------- */
/*  @filas = JSON: [{"id_participante":1,"nivel":4,"resultado":"...","observaciones":"..."}]  */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_CrearLote
    @filas NVARCHAR(MAX),
    @fecha VARCHAR(10),
    @tipo_evaluacion VARCHAR(50) = 'Participante',
    @id_programacion INT = NULL,
    @id_grupo INT = NULL,
    @id_usuario INT = NULL,
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @fechaReal DATE;
    IF @fecha IS NULL OR LTRIM(RTRIM(@fecha)) = ''
        BEGIN RAISERROR ('La fecha de la evaluacion es obligatoria.', 16, 1); RETURN; END

    SET @fechaReal = COALESCE(TRY_CONVERT(DATE, @fecha, 23), TRY_CONVERT(DATE, @fecha, 120),
                              TRY_CONVERT(DATE, @fecha, 111), TRY_CONVERT(DATE, @fecha));
    IF @fechaReal IS NULL
        BEGIN RAISERROR ('La fecha de la evaluacion no es valida (formato YYYY-MM-DD).', 16, 1); RETURN; END

    IF @tipo_evaluacion = 'Individual' SET @tipo_evaluacion = 'Participante';
    IF @tipo_evaluacion IS NULL OR @tipo_evaluacion NOT IN ('Participante', 'Grupo', 'Actividad')
        BEGIN RAISERROR ('El tipo de evaluacion no es valido.', 16, 1); RETURN; END

    IF @filas IS NULL OR LTRIM(RTRIM(@filas)) = '' OR LTRIM(RTRIM(@filas)) = '[]'
        BEGIN RAISERROR ('Debe seleccionar al menos un participante.', 16, 1); RETURN; END

    IF @id_programacion = 0 SET @id_programacion = NULL;
    IF @id_grupo = 0 SET @id_grupo = NULL;

    IF @tipo_evaluacion = 'Actividad' AND (@id_programacion IS NULL OR @id_programacion = 0)
        BEGIN RAISERROR ('La evaluacion por actividad requiere una actividad.', 16, 1); RETURN; END
    IF @tipo_evaluacion = 'Grupo' AND (@id_grupo IS NULL OR @id_grupo = 0)
        BEGIN RAISERROR ('La evaluacion por grupo requiere un grupo.', 16, 1); RETURN; END

    CREATE TABLE #tmp (
        id_participante INT NOT NULL PRIMARY KEY,
        nivel INT NULL,
        resultado VARCHAR(500) NULL,
        observaciones VARCHAR(500) NULL
    );

    INSERT INTO #tmp (id_participante, nivel, resultado, observaciones)
    SELECT j.id_participante,
           NULLIF(j.nivel, 0),
           NULLIF(LTRIM(RTRIM(ISNULL(j.resultado, ''))), ''),
           NULLIF(LTRIM(RTRIM(ISNULL(j.observaciones, ''))), '')
    FROM OPENJSON(@filas)
    WITH (id_participante INT '$.id_participante',
          nivel INT '$.nivel',
          resultado VARCHAR(500) '$.resultado',
          observaciones VARCHAR(500) '$.observaciones') j
    WHERE j.id_participante IS NOT NULL AND j.id_participante > 0;

    IF NOT EXISTS (SELECT 1 FROM #tmp)
        BEGIN RAISERROR ('Debe seleccionar al menos un participante.', 16, 1); RETURN; END

    IF EXISTS (SELECT 1 FROM #tmp WHERE nivel IS NOT NULL AND (nivel < 1 OR nivel > 5))
        BEGIN RAISERROR ('El nivel de desempeno debe estar entre 1 y 5.', 16, 1); RETURN; END

    /* Sin nivel todas las filas deben traer observacion de cumplimiento. */
    IF NOT EXISTS (SELECT 1 FROM #tmp WHERE nivel IS NOT NULL)
       AND EXISTS (SELECT 1 FROM #tmp WHERE observaciones IS NULL)
        BEGIN RAISERROR ('Registre la observacion de cumplimiento de cada participante.', 16, 1); RETURN; END

    /* Participantes inexistentes, inactivos o fuera del alcance del rol. */
    IF EXISTS (SELECT 1 FROM #tmp t
               WHERE NOT EXISTS (SELECT 1 FROM participantes p
                                  LEFT JOIN programas pr ON pr.id_programa = p.id_programa
                                  WHERE p.id_participante = t.id_participante
                                    AND p.estado = 1
                                    AND (@programa IS NULL OR @programa = ''
                                         OR pr.tipo_programa LIKE '%' + @programa + '%')))
        BEGIN RAISERROR ('Hay participantes que no existen, estan inactivos o no pertenecen a su programa.', 16, 1); RETURN; END

    IF EXISTS (SELECT 1 FROM #tmp t
               WHERE EXISTS (SELECT 1 FROM dbo.evaluaciones e
                              WHERE e.id_participante = t.id_participante
                                AND e.fecha_evaluacion = @fechaReal
                                AND e.tipo_evaluacion = @tipo_evaluacion))
        BEGIN RAISERROR ('Ya existe una evaluacion para uno de los participantes en esa fecha. Edite el registro existente.', 16, 1); RETURN; END

    BEGIN TRY
        BEGIN TRAN;

        CREATE TABLE #map (id_evaluacion INT NOT NULL PRIMARY KEY, id_participante INT NOT NULL);

        INSERT INTO dbo.evaluaciones
            (id_programacion, id_participante, id_grupo, id_usuario, tipo_evaluacion,
             fecha_evaluacion, resultado_general, observaciones, estado)
        OUTPUT INSERTED.id_evaluacion, INSERTED.id_participante INTO #map(id_evaluacion, id_participante)
        SELECT @id_programacion,
               t.id_participante,
               @id_grupo,
               @id_usuario,
               @tipo_evaluacion,
               @fechaReal,
               CASE WHEN t.resultado IS NOT NULL THEN t.resultado
                    WHEN t.nivel IS NOT NULL THEN (CASE WHEN t.nivel >= 4 THEN 'Aprobado'
                                                        WHEN t.nivel = 3 THEN 'En proceso'
                                                        ELSE 'Necesita apoyo' END)
                    ELSE NULL END,
               t.observaciones,
               1
        FROM #tmp t;

        CREATE TABLE #crit (id_participante INT NOT NULL, id_criterio INT NOT NULL);

        INSERT INTO #crit (id_participante, id_criterio)
        SELECT m.id_participante, c.id_criterio
        FROM #map m
        INNER JOIN #tmp t  ON t.id_participante = m.id_participante
        INNER JOIN participantes p  ON p.id_participante = m.id_participante
        LEFT  JOIN programas pr     ON pr.id_programa    = p.id_programa
        CROSS JOIN dbo.criterios_evaluacion c
        WHERE t.nivel IS NOT NULL
          AND c.estado = 1
          AND (ISNULL(c.tipo_programa, '') = ''
               OR c.tipo_programa LIKE '%' + ISNULL(pr.tipo_programa, '') + '%');

        /* Fallback: si el programa no tiene criterios propios, se usan todos los activos. */
        INSERT INTO #crit (id_participante, id_criterio)
        SELECT m.id_participante, c.id_criterio
        FROM #map m
        INNER JOIN #tmp t ON t.id_participante = m.id_participante
        CROSS JOIN dbo.criterios_evaluacion c
        WHERE t.nivel IS NOT NULL
          AND c.estado = 1
          AND NOT EXISTS (SELECT 1 FROM #crit x WHERE x.id_participante = m.id_participante);

        INSERT INTO dbo.resultados_evaluacion (id_evaluacion, id_criterio, puntuacion, resultado, observaciones)
        SELECT m.id_evaluacion,
               cr.id_criterio,
               CAST(t.nivel * 20.0 AS DECIMAL(10, 2)),
               CASE t.nivel WHEN 1 THEN 'Necesita mejorar'
                            WHEN 2 THEN 'Básico'
                            WHEN 3 THEN 'En proceso'
                            WHEN 4 THEN 'Satisfactorio'
                            ELSE 'Excelente' END,
               NULL
        FROM #map m
        INNER JOIN #tmp t  ON t.id_participante = m.id_participante
        INNER JOIN #crit cr ON cr.id_participante = m.id_participante
        WHERE t.nivel IS NOT NULL;

        DECLARE @creados INT = (SELECT COUNT(*) FROM #map);

        COMMIT;
        SELECT @creados AS creados, 'OK' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

/* ---------- 10. Actualizar evaluacion ------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_Actualizar
    @id_evaluacion INT,
    @id_participante INT,
    @fecha VARCHAR(10),
    @tipo_evaluacion VARCHAR(50) = 'Participante',
    @id_programacion INT = NULL,
    @id_grupo INT = NULL,
    @nivel INT = NULL,
    @resultado VARCHAR(500) = NULL,
    @observaciones VARCHAR(500) = NULL,
    @programa VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.evaluaciones WHERE id_evaluacion = @id_evaluacion)
        BEGIN RAISERROR ('La evaluacion no existe.', 16, 1); RETURN; END

    DECLARE @fechaReal DATE;
    IF @fecha IS NULL OR LTRIM(RTRIM(@fecha)) = ''
        BEGIN RAISERROR ('La fecha de la evaluacion es obligatoria.', 16, 1); RETURN; END

    SET @fechaReal = COALESCE(TRY_CONVERT(DATE, @fecha, 23), TRY_CONVERT(DATE, @fecha, 120),
                              TRY_CONVERT(DATE, @fecha, 111), TRY_CONVERT(DATE, @fecha));
    IF @fechaReal IS NULL
        BEGIN RAISERROR ('La fecha de la evaluacion no es valida (formato YYYY-MM-DD).', 16, 1); RETURN; END

    IF @tipo_evaluacion = 'Individual' SET @tipo_evaluacion = 'Participante';
    IF @tipo_evaluacion IS NULL OR @tipo_evaluacion NOT IN ('Participante', 'Grupo', 'Actividad')
        BEGIN RAISERROR ('El tipo de evaluacion no es valido.', 16, 1); RETURN; END

    IF @id_participante IS NULL OR @id_participante <= 0
        BEGIN RAISERROR ('Seleccione un participante.', 16, 1); RETURN; END

    IF NOT EXISTS (SELECT 1 FROM participantes WHERE id_participante = @id_participante AND estado = 1)
        BEGIN RAISERROR ('El participante seleccionado no existe o esta inactivo.', 16, 1); RETURN; END

    IF @programa IS NOT NULL AND @programa <> ''
       AND NOT EXISTS (SELECT 1 FROM participantes p
                       INNER JOIN programas pr ON pr.id_programa = p.id_programa
                       WHERE p.id_participante = @id_participante
                         AND pr.tipo_programa LIKE '%' + @programa + '%')
        BEGIN RAISERROR ('El participante no pertenece al programa que usted administra.', 16, 1); RETURN; END

    IF @nivel IS NOT NULL AND (@nivel < 1 OR @nivel > 5)
        BEGIN RAISERROR ('El nivel de desempeno debe estar entre 1 y 5.', 16, 1); RETURN; END

    SET @resultado     = NULLIF(LTRIM(RTRIM(ISNULL(@resultado, ''))), '');
    SET @observaciones = NULLIF(LTRIM(RTRIM(ISNULL(@observaciones, ''))), '');

    IF @nivel IS NULL AND @observaciones IS NULL
        BEGIN RAISERROR ('Registre la observacion de cumplimiento.', 16, 1); RETURN; END

    IF @id_programacion = 0 SET @id_programacion = NULL;
    IF @id_grupo = 0 SET @id_grupo = NULL;

    IF EXISTS (SELECT 1 FROM dbo.evaluaciones
               WHERE id_participante = @id_participante
                 AND fecha_evaluacion = @fechaReal
                 AND tipo_evaluacion = @tipo_evaluacion
                 AND id_evaluacion <> @id_evaluacion)
        BEGIN RAISERROR ('Ya existe otra evaluacion para este participante en esa fecha.', 16, 1); RETURN; END

    IF @resultado IS NULL AND @nivel IS NOT NULL
        SET @resultado = CASE WHEN @nivel >= 4 THEN 'Aprobado'
                              WHEN @nivel = 3 THEN 'En proceso'
                              ELSE 'Necesita apoyo' END;

    BEGIN TRY
        BEGIN TRAN;

        UPDATE dbo.evaluaciones
           SET id_participante  = @id_participante,
               fecha_evaluacion = @fechaReal,
               tipo_evaluacion  = @tipo_evaluacion,
               id_programacion  = @id_programacion,
               id_grupo         = @id_grupo,
               resultado_general = @resultado,
               observaciones    = @observaciones,
               estado           = 1
         WHERE id_evaluacion = @id_evaluacion;

        /* El detalle por criterio se reconstruye (o se elimina si no hay nivel). */
        DELETE FROM dbo.resultados_evaluacion WHERE id_evaluacion = @id_evaluacion;

        IF @nivel IS NOT NULL
            INSERT INTO dbo.resultados_evaluacion (id_evaluacion, id_criterio, puntuacion, resultado, observaciones)
            SELECT @id_evaluacion,
                   x.id_criterio,
                   CAST(@nivel * 20.0 AS DECIMAL(10, 2)),
                   CASE @nivel WHEN 1 THEN 'Necesita mejorar'
                               WHEN 2 THEN 'Básico'
                               WHEN 3 THEN 'En proceso'
                               WHEN 4 THEN 'Satisfactorio'
                               ELSE 'Excelente' END,
                   NULL
            FROM dbo.fn_Evaluacion_CriteriosAplicables(@id_participante) x;

        COMMIT;
        SELECT @id_evaluacion AS id_evaluacion, 'OK' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

/* ---------- 11. Eliminar evaluacion --------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.sp_Evaluacion_Eliminar
    @id_evaluacion INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.evaluaciones WHERE id_evaluacion = @id_evaluacion)
        BEGIN RAISERROR ('La evaluacion no existe.', 16, 1); RETURN; END

    BEGIN TRY
        BEGIN TRAN;
        DELETE FROM dbo.resultados_evaluacion WHERE id_evaluacion = @id_evaluacion;
        DELETE FROM dbo.evaluaciones WHERE id_evaluacion = @id_evaluacion;
        COMMIT;
        SELECT @id_evaluacion AS id_evaluacion, 'OK' AS mensaje;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END
GO

PRINT '=====================================================';
PRINT 'SPs del modulo Evaluacion creados correctamente.';
PRINT '=====================================================';
GO
