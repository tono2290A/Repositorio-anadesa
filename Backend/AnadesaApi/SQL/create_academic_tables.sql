-- =============================================
-- TABLAS ACADÉMICAS - Sistema ANADESA
-- Ejecutar este script en SQL Server
-- =============================================

-- 1. Ciclos Escolares
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ciclos_escolares' AND xtype='U')
CREATE TABLE ciclos_escolares (
    id_ciclo INT IDENTITY(1,1) PRIMARY KEY,
    anio INT NOT NULL,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    estado BIT NOT NULL DEFAULT 1
);

-- 2. Grados
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='grados' AND xtype='U')
CREATE TABLE grados (
    id_grado INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    nivel NVARCHAR(50) NULL,
    descripcion NVARCHAR(255) NULL,
    estado BIT NOT NULL DEFAULT 1
);

-- 3. Bloques Académicos
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='bloques_academicos' AND xtype='U')
CREATE TABLE bloques_academicos (
    id_bloque INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    numero_bloque INT NOT NULL,
    descripcion NVARCHAR(255) NULL,
    estado BIT NOT NULL DEFAULT 1
);

-- 4. Inscripciones Académicas
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inscripciones_academicas' AND xtype='U')
CREATE TABLE inscripciones_academicas (
    id_inscripcion INT IDENTITY(1,1) PRIMARY KEY,
    id_participante INT NOT NULL,
    id_grado INT NOT NULL,
    id_ciclo INT NOT NULL,
    fecha_inscripcion DATETIME NOT NULL DEFAULT GETDATE(),
    estado NVARCHAR(50) NOT NULL DEFAULT 'Activo',
    observaciones NVARCHAR(500) NULL,
    FOREIGN KEY (id_participante) REFERENCES participantes(id_participante),
    FOREIGN KEY (id_grado) REFERENCES grados(id_grado),
    FOREIGN KEY (id_ciclo) REFERENCES ciclos_escolares(id_ciclo)
);

-- 5. Historial Académico
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='historial_academico' AND xtype='U')
CREATE TABLE historial_academico (
    id_historial INT IDENTITY(1,1) PRIMARY KEY,
    id_participante INT NOT NULL,
    id_grado INT NOT NULL,
    id_ciclo INT NOT NULL,
    promedio_final DECIMAL(5,2) NULL,
    resultado NVARCHAR(50) NULL,
    observaciones NVARCHAR(500) NULL,
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (id_participante) REFERENCES participantes(id_participante),
    FOREIGN KEY (id_grado) REFERENCES grados(id_grado),
    FOREIGN KEY (id_ciclo) REFERENCES ciclos_escolares(id_ciclo)
);

-- 6. Promedios
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='promedios' AND xtype='U')
CREATE TABLE promedios (
    id_promedio INT IDENTITY(1,1) PRIMARY KEY,
    id_inscripcion INT NOT NULL,
    id_bloque INT NOT NULL,
    promedio DECIMAL(5,2) NOT NULL,
    observaciones NVARCHAR(500) NULL,
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (id_inscripcion) REFERENCES inscripciones_academicas(id_inscripcion),
    FOREIGN KEY (id_bloque) REFERENCES bloques_academicos(id_bloque)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Ciclos Escolares
IF NOT EXISTS (SELECT 1 FROM ciclos_escolares WHERE anio = 2025)
BEGIN
    INSERT INTO ciclos_escolares (anio, fecha_inicio, fecha_fin, estado) VALUES (2025, '2025-01-15', '2025-11-30', 1);
    INSERT INTO ciclos_escolares (anio, fecha_inicio, fecha_fin, estado) VALUES (2026, '2026-01-15', '2026-11-30', 1);
END;

-- Grados
IF NOT EXISTS (SELECT 1 FROM grados WHERE nombre = 'Primer Grado')
BEGIN
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Primer Grado', 'Primaria', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Segundo Grado', 'Primaria', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Tercer Grado', 'Primaria', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Cuarto Grado', 'Primaria', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Quinto Grado', 'Primaria', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Sexto Grado', 'Primaria', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Séptimo Grado', 'Básicos', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Octavo Grado', 'Básicos', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Noveno Grado', 'Básicos', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Décimo', 'Diversificado', 1);
    INSERT INTO grados (nombre, nivel, estado) VALUES ('Once', 'Diversificado', 1);
END;

-- Bloques Académicos
IF NOT EXISTS (SELECT 1 FROM bloques_academicos WHERE nombre = 'Bloque 1')
BEGIN
    INSERT INTO bloques_academicos (nombre, numero_bloque, estado) VALUES ('Bloque 1', 1, 1);
    INSERT INTO bloques_academicos (nombre, numero_bloque, estado) VALUES ('Bloque 2', 2, 1);
    INSERT INTO bloques_academicos (nombre, numero_bloque, estado) VALUES ('Bloque 3', 3, 1);
    INSERT INTO bloques_academicos (nombre, numero_bloque, estado) VALUES ('Bloque 4', 4, 1);
END;

PRINT 'Tablas y datos académicos creados correctamente.';
