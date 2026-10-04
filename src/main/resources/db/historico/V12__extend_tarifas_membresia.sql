-- V12: Agregar duracion_dias y nombre a tarifas_membresia
--      Ampliar tipo_membresia en membresias para soportar tipos custom
ALTER TABLE tarifas_membresia ADD COLUMN IF NOT EXISTS duracion_dias INT;
ALTER TABLE tarifas_membresia ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);

UPDATE tarifas_membresia SET duracion_dias = 30,  nombre = 'Plan Mensual'     WHERE tipo = 'MENSUAL';
UPDATE tarifas_membresia SET duracion_dias = 90,  nombre = 'Plan Trimestral'  WHERE tipo = 'TRIMESTRAL';
UPDATE tarifas_membresia SET duracion_dias = 180, nombre = 'Plan Semestral'   WHERE tipo = 'SEMESTRAL';
UPDATE tarifas_membresia SET duracion_dias = 365, nombre = 'Plan Anual'       WHERE tipo = 'ANUAL';

-- Ampliar columna tipo_membresia por si se agregan tipos personalizados
ALTER TABLE membresias ALTER COLUMN tipo_membresia TYPE VARCHAR(50);
