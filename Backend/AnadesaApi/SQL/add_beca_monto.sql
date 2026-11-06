-- =============================================
-- Agregar campos beca y monto_beca a participantes
-- =============================================

-- 1. Agregar columnas a la tabla
ALTER TABLE participantes ADD beca BIT NULL DEFAULT 0;
ALTER TABLE participantes ADD monto_beca DECIMAL(10,2) NULL DEFAULT 0;

-- 2. Actualizar SP: sp_ListarParticipantesActivos
ALTER PROCEDURE sp_ListarParticipantesActivos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.id_participante AS IdParticipante,
        p.id_programa AS IdPrograma,
        p.id_proyecto AS IdProyecto,
        p.id_categoria AS IdCategoria,
        p.id_comunidad AS IdComunidad,
        p.primer_nombre AS PrimerNombre,
        p.segundo_nombre AS SegundoNombre,
        p.tercer_nombre AS TercerNombre,
        p.primer_apellido AS PrimerApellido,
        p.segundo_apellido AS SegundoApellido,
        p.tercer_apellido AS TercerApellido,
        p.fecha_nacimiento AS FechaNacimiento,
        p.sexo AS Sexo,
        p.dpi AS Dpi,
        p.telefono AS Telefono,
        p.correo AS Correo,
        p.estado AS Estado,
        p.fecha_registro AS FechaRegistro,
        p.beca AS Beca,
        p.monto_beca AS MontoBeca,
        pr.nombre AS NombrePrograma,
        c.nombre AS NombreCategoria,
        cm.nombre AS NombreComunidad,
        f.ruta_fotografia AS FotoUrl
    FROM participantes p
    LEFT JOIN programas pr ON p.id_programa = pr.id_programa
    LEFT JOIN categorias_participante c ON p.id_categoria = c.id_categoria
    LEFT JOIN comunidades cm ON p.id_comunidad = cm.id_comunidad
    LEFT JOIN fotografias_participante f ON p.id_participante = f.id_participante
    WHERE p.estado = 1
    ORDER BY p.fecha_registro DESC;
END;

-- 3. Actualizar SP: sp_ObtenerParticipantePorId
ALTER PROCEDURE sp_ObtenerParticipantePorId
    @id_participante INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        p.id_participante AS IdParticipante,
        p.id_programa AS IdPrograma,
        p.id_proyecto AS IdProyecto,
        p.id_categoria AS IdCategoria,
        p.id_comunidad AS IdComunidad,
        p.primer_nombre AS PrimerNombre,
        p.segundo_nombre AS SegundoNombre,
        p.tercer_nombre AS TercerNombre,
        p.primer_apellido AS PrimerApellido,
        p.segundo_apellido AS SegundoApellido,
        p.tercer_apellido AS TercerApellido,
        p.fecha_nacimiento AS FechaNacimiento,
        p.sexo AS Sexo,
        p.dpi AS Dpi,
        p.telefono AS Telefono,
        p.correo AS Correo,
        p.estado AS Estado,
        p.fecha_registro AS FechaRegistro,
        p.beca AS Beca,
        p.monto_beca AS MontoBeca,
        pr.nombre AS NombrePrograma,
        c.nombre AS NombreCategoria,
        cm.nombre AS NombreComunidad,
        f.ruta_fotografia AS FotoUrl
    FROM participantes p
    LEFT JOIN programas pr ON p.id_programa = pr.id_programa
    LEFT JOIN categorias_participante c ON p.id_categoria = c.id_categoria
    LEFT JOIN comunidades cm ON p.id_comunidad = cm.id_comunidad
    LEFT JOIN fotografias_participante f ON p.id_participante = f.id_participante
    WHERE p.id_participante = @id_participante;

    -- Tutor/Encargado
    SELECT 
        f.primer_nombre,
        f.segundo_nombre,
        f.primer_apellido,
        f.segundo_apellido,
        f.dpi,
        f.telefono,
        f.correo,
        pf.parentesco,
        pf.responsable
    FROM participante_familiares pf
    INNER JOIN familiares f ON pf.id_familiar = f.id_familiar
    WHERE pf.id_participante = @id_participante AND pf.responsable = 1;

    -- Contacto
    SELECT 
        telefono_principal,
        telefono_secundario,
        correo,
        contacto_emergencia,
        telefono_emergencia
    FROM contactos_participante
    WHERE id_participante = @id_participante;

    -- Dirección
    SELECT 
        id_comunidad,
        direccion,
        referencia
    FROM direcciones
    WHERE id_participante = @id_participante;
END;

-- 4. Actualizar SP: sp_CrearParticipante
ALTER PROCEDURE sp_CrearParticipante
    @id_programa INT,
    @id_proyecto INT = NULL,
    @id_categoria INT,
    @id_comunidad INT = NULL,
    @primer_nombre NVARCHAR(100),
    @segundo_nombre NVARCHAR(100) = NULL,
    @tercer_nombre NVARCHAR(100) = NULL,
    @primer_apellido NVARCHAR(100),
    @segundo_apellido NVARCHAR(100) = NULL,
    @tercer_apellido NVARCHAR(100) = NULL,
    @fecha_nacimiento DATE,
    @sexo NVARCHAR(20) = NULL,
    @dpi NVARCHAR(20) = NULL,
    @telefono NVARCHAR(20) = NULL,
    @correo NVARCHAR(100) = NULL,
    @beca BIT = NULL,
    @monto_beca DECIMAL(10,2) = NULL,
    @nombre_archivo NVARCHAR(255) = NULL,
    @ruta_fotografia NVARCHAR(500) = NULL,
    @tutor_primer_nombre NVARCHAR(100) = NULL,
    @tutor_segundo_nombre NVARCHAR(100) = NULL,
    @tutor_primer_apellido NVARCHAR(100) = NULL,
    @tutor_segundo_apellido NVARCHAR(100) = NULL,
    @tutor_parentesco NVARCHAR(50) = NULL,
    @tutor_dpi NVARCHAR(20) = NULL,
    @tutor_telefono NVARCHAR(20) = NULL,
    @nuevo_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO participantes (
        id_programa, id_proyecto, id_categoria, id_comunidad,
        primer_nombre, segundo_nombre, tercer_nombre,
        primer_apellido, segundo_apellido, tercer_apellido,
        fecha_nacimiento, sexo, dpi, telefono, correo,
        beca, monto_beca, estado, fecha_registro
    ) VALUES (
        @id_programa, @id_proyecto, @id_categoria, @id_comunidad,
        @primer_nombre, @segundo_nombre, @tercer_nombre,
        @primer_apellido, @segundo_apellido, @tercer_apellido,
        @fecha_nacimiento, @sexo, @dpi, @telefono, @correo,
        ISNULL(@beca, 0), ISNULL(@monto_beca, 0), 1, GETDATE()
    );
    SET @nuevo_id = SCOPE_IDENTITY();

    -- Crear fotografia si se proporciono
    IF @nombre_archivo IS NOT NULL AND @ruta_fotografia IS NOT NULL
    BEGIN
        INSERT INTO fotografias_participante (id_participante, nombre_archivo, ruta_fotografia)
        VALUES (@nuevo_id, @nombre_archivo, @ruta_fotografia);
    END

    -- Crear tutor si se proporciono
    IF @tutor_primer_nombre IS NOT NULL
    BEGIN
        DECLARE @id_familiar INT;
        INSERT INTO familiares (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, dpi, telefono)
        VALUES (@tutor_primer_nombre, @tutor_segundo_nombre, @tutor_primer_apellido, @tutor_segundo_apellido, @tutor_dpi, @tutor_telefono);
        SET @id_familiar = SCOPE_IDENTITY();

        INSERT INTO participante_familiares (id_participante, id_familiar, parentesco, responsable)
        VALUES (@nuevo_id, @id_familiar, @tutor_parentesco, 1);
    END
END;

-- 5. Actualizar SP: sp_ActualizarParticipante
ALTER PROCEDURE sp_ActualizarParticipante
    @id_participante INT,
    @id_programa INT,
    @id_proyecto INT = NULL,
    @id_categoria INT,
    @id_comunidad INT = NULL,
    @primer_nombre NVARCHAR(100),
    @segundo_nombre NVARCHAR(100) = NULL,
    @tercer_nombre NVARCHAR(100) = NULL,
    @primer_apellido NVARCHAR(100),
    @segundo_apellido NVARCHAR(100) = NULL,
    @tercer_apellido NVARCHAR(100) = NULL,
    @fecha_nacimiento DATE,
    @sexo NVARCHAR(20) = NULL,
    @dpi NVARCHAR(20) = NULL,
    @telefono NVARCHAR(20) = NULL,
    @correo NVARCHAR(100) = NULL,
    @estado BIT = NULL,
    @beca BIT = NULL,
    @monto_beca DECIMAL(10,2) = NULL,
    @nombre_archivo NVARCHAR(255) = NULL,
    @ruta_fotografia NVARCHAR(500) = NULL,
    @tutor_primer_nombre NVARCHAR(100) = NULL,
    @tutor_segundo_nombre NVARCHAR(100) = NULL,
    @tutor_primer_apellido NVARCHAR(100) = NULL,
    @tutor_segundo_apellido NVARCHAR(100) = NULL,
    @tutor_parentesco NVARCHAR(50) = NULL,
    @tutor_dpi NVARCHAR(20) = NULL,
    @tutor_telefono NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE participantes SET
        id_programa = @id_programa,
        id_proyecto = @id_proyecto,
        id_categoria = @id_categoria,
        id_comunidad = @id_comunidad,
        primer_nombre = @primer_nombre,
        segundo_nombre = @segundo_nombre,
        tercer_nombre = @tercer_nombre,
        primer_apellido = @primer_apellido,
        segundo_apellido = @segundo_apellido,
        tercer_apellido = @tercer_apellido,
        fecha_nacimiento = @fecha_nacimiento,
        sexo = @sexo,
        dpi = @dpi,
        telefono = @telefono,
        correo = @correo,
        beca = ISNULL(@beca, 0),
        monto_beca = ISNULL(@monto_beca, 0)
    WHERE id_participante = @id_participante;

    IF @estado IS NOT NULL
    BEGIN
        UPDATE participantes SET estado = @estado WHERE id_participante = @id_participante;
    END

    -- Actualizar fotografia si se proporciono
    IF @nombre_archivo IS NOT NULL AND @ruta_fotografia IS NOT NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM fotografias_participante WHERE id_participante = @id_participante)
        BEGIN
            UPDATE fotografias_participante 
            SET nombre_archivo = @nombre_archivo, ruta_fotografia = @ruta_fotografia
            WHERE id_participante = @id_participante;
        END
        ELSE
        BEGIN
            INSERT INTO fotografias_participante (id_participante, nombre_archivo, ruta_fotografia)
            VALUES (@id_participante, @nombre_archivo, @ruta_fotografia);
        END
    END

    -- Actualizar tutor si se proporciono
    IF @tutor_primer_nombre IS NOT NULL
    BEGIN
        DECLARE @id_familiar INT;
        SELECT TOP 1 @id_familiar = pf.id_familiar 
        FROM participante_familiares pf 
        WHERE pf.id_participante = @id_participante AND pf.responsable = 1;

        IF @id_familiar IS NOT NULL
        BEGIN
            UPDATE familiares SET
                primer_nombre = @tutor_primer_nombre,
                segundo_nombre = @tutor_segundo_nombre,
                primer_apellido = @tutor_primer_apellido,
                segundo_apellido = @tutor_segundo_apellido,
                dpi = @tutor_dpi,
                telefono = @tutor_telefono
            WHERE id_familiar = @id_familiar;

            UPDATE participante_familiares 
            SET parentesco = @tutor_parentesco
            WHERE id_participante = @id_participante AND id_familiar = @id_familiar;
        END
    END
END;
