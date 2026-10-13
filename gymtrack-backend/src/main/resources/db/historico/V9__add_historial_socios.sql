-- ============================================================
-- V9 - Historial trazable en socios
-- Agrega fecha de creación y última modificación
-- ============================================================

ALTER TABLE socios
    ADD COLUMN IF NOT EXISTS fecha_creacion     TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS fecha_modificacion TIMESTAMP DEFAULT NOW();

-- Poblar los registros existentes con la fecha actual
UPDATE socios SET
    fecha_creacion     = NOW(),
    fecha_modificacion = NOW()
WHERE fecha_creacion IS NULL;
