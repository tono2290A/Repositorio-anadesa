USE [DB_ANADESA]
GO

IF OBJECT_ID('dbo.sp_Actividades_ObtenerTodas','P') IS NOT NULL DROP PROCEDURE dbo.sp_Actividades_ObtenerTodas;
GO
CREATE PROCEDURE dbo.sp_Actividades_ObtenerTodas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.id_actividad,
        ISNULL(pa.id_programacion, 0) AS id_programacion,
        a.id_programa, a.id_tipo_actividad,
        a.nombre, a.descripcion, a.objetivo,
        pr.nombre AS programa,
        ta.nombre AS tipo_actividad,
        CONVERT(varchar(10), pa.fecha_actividad, 23) AS fecha,
        CONVERT(varchar(5), pa.hora_inicio, 108) AS hora,
        CONVERT(varchar(5), pa.hora_fin, 108) AS hora_fin,
        pa.lugar, pa.estado, pa.observaciones, pa.cantidad_planificada,
        a.fecha_creacion, a.estado AS estado_activo, a.modalidad,
        ISNULL((SELECT COUNT(*) FROM asistencia asi WHERE asi.id_programacion = pa.id_programacion), 0) AS totalParticipantes,
        ISNULL((SELECT TOP 1 u.primer_nombre + ' ' + u.primer_apellido
            FROM asignacion_facilitadores af
            INNER JOIN usuarios u ON af.id_usuario = u.id_usuario
            WHERE af.id_programacion = pa.id_programacion AND af.estado = 1), '') AS responsable
    FROM actividades a
    INNER JOIN programas pr ON a.id_programa = pr.id_programa
    INNER JOIN tipos_actividad ta ON a.id_tipo_actividad = ta.id_tipo_actividad
    LEFT JOIN programacion_actividades pa ON a.id_actividad = pa.id_actividad
    WHERE a.estado = 1
    ORDER BY pa.fecha_actividad DESC, a.nombre;
END
GO

IF OBJECT_ID('dbo.sp_Actividades_ObtenerPorId','P') IS NOT NULL DROP PROCEDURE dbo.sp_Actividades_ObtenerPorId;
GO
CREATE PROCEDURE dbo.sp_Actividades_ObtenerPorId
    @id_actividad INT,
    @id_programacion INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.id_actividad,
        ISNULL(pa.id_programacion, 0) AS id_programacion,
        a.id_programa, a.id_tipo_actividad,
        a.nombre, a.descripcion, a.objetivo,
        pr.nombre AS programa,
        ta.nombre AS tipo_actividad,
        CONVERT(varchar(10), pa.fecha_actividad, 23) AS fecha,
        CONVERT(varchar(5), pa.hora_inicio, 108) AS hora,
        CONVERT(varchar(5), pa.hora_fin, 108) AS hora_fin,
        pa.lugar, pa.estado, pa.observaciones, pa.cantidad_planificada,
        a.fecha_creacion, a.estado AS estado_activo, a.modalidad,
        ISNULL((SELECT COUNT(*) FROM asistencia asi WHERE asi.id_programacion = pa.id_programacion), 0) AS totalParticipantes
    FROM actividades a
    INNER JOIN programas pr ON a.id_programa = pr.id_programa
    INNER JOIN tipos_actividad ta ON a.id_tipo_actividad = ta.id_tipo_actividad
    LEFT JOIN programacion_actividades pa ON a.id_actividad = pa.id_actividad
    WHERE a.id_actividad = @id_actividad
      AND (@id_programacion = 0 OR pa.id_programacion = @id_programacion);
END
GO

IF OBJECT_ID('dbo.sp_Actividades_ActualizarEstado','P') IS NOT NULL DROP PROCEDURE dbo.sp_Actividades_ActualizarEstado;
GO
CREATE PROCEDURE dbo.sp_Actividades_ActualizarEstado
    @id_programacion INT,
    @estado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE programacion_actividades SET estado = @estado WHERE id_programacion = @id_programacion;
    SELECT CASE WHEN @@ROWCOUNT > 0 THEN 1 ELSE 0 END AS resultado;
END
GO

IF OBJECT_ID('dbo.sp_Actividades_ParticipantesDisponibles','P') IS NOT NULL DROP PROCEDURE dbo.sp_Actividades_ParticipantesDisponibles;
GO
CREATE PROCEDURE dbo.sp_Actividades_ParticipantesDisponibles
    @id_programacion INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.id_participante,
        (p.primer_nombre + ' ' + ISNULL(p.segundo_nombre + ' ', '') + p.primer_apellido + ' ' + ISNULL(p.segundo_apellido, '')) AS nombre,
        p.dpi, p.telefono,
        pr.nombre AS programa, c.nombre AS categoria,
        CASE WHEN asi.id_participante IS NOT NULL THEN 1 ELSE 0 END AS presente
    FROM participantes p
    INNER JOIN programas pr ON p.id_programa = pr.id_programa
    INNER JOIN categorias_participante c ON p.id_categoria = c.id_categoria
    INNER JOIN programacion_actividades pa ON pa.id_programacion = @id_programacion
    LEFT JOIN asistencia asi ON asi.id_programacion = @id_programacion AND asi.id_participante = p.id_participante
    WHERE p.id_programa = (SELECT id_programa FROM actividades WHERE id_actividad = pa.id_actividad)
      AND p.estado = 1
    ORDER BY p.primer_apellido, p.primer_nombre;
END
GO

IF OBJECT_ID('dbo.sp_Actividades_AsignarParticipantes','P') IS NOT NULL DROP PROCEDURE dbo.sp_Actividades_AsignarParticipantes;
GO
CREATE PROCEDURE dbo.sp_Actividades_AsignarParticipantes
    @id_programacion INT,
    @participantes NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM asistencia WHERE id_programacion = @id_programacion;

        IF LEN(ISNULL(@participantes,'')) > 0
        BEGIN
            INSERT INTO asistencia (id_programacion, id_participante, presente, hora_registro)
            SELECT DISTINCT @id_programacion, CAST(LTRIM(RTRIM(value)) AS INT), 0, NULL
            FROM STRING_SPLIT(@participantes, ',')
            WHERE LEN(LTRIM(RTRIM(value))) > 0;
        END

        COMMIT TRANSACTION;
        SELECT 1 AS resultado;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

IF OBJECT_ID('dbo.sp_Actividades_ObtenerTipos','P') IS NOT NULL DROP PROCEDURE dbo.sp_Actividades_ObtenerTipos;
GO
CREATE PROCEDURE dbo.sp_Actividades_ObtenerTipos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_tipo_actividad, nombre, descripcion, estado
    FROM tipos_actividad WHERE estado = 1 ORDER BY nombre;
END
GO

IF OBJECT_ID('dbo.sp_Actividades_ObtenerProgramas','P') IS NOT NULL DROP PROCEDURE dbo.sp_Actividades_ObtenerProgramas;
GO
CREATE PROCEDURE dbo.sp_Actividades_ObtenerProgramas
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_programa, nombre, tipo_programa, estado
    FROM programas WHERE estado = 1 ORDER BY nombre;
END
GO

PRINT 'SPs de Actividades creados correctamente.';
GO
