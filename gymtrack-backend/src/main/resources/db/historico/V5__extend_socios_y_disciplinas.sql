-- ============================================================
-- V5 - Extender socios + crear disciplinas
-- ============================================================

-- Extender socios con dirección (fechaNacimiento ya existe en el modelo)
ALTER TABLE socios ADD COLUMN IF NOT EXISTS direccion VARCHAR(200);

-- Tabla: disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
    id           BIGSERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    descripcion  TEXT,
    instructor   VARCHAR(100),
    horario      VARCHAR(200),
    cupo_maximo  INT,
    activa       BOOLEAN NOT NULL DEFAULT TRUE
);
