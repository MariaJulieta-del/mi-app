-- ============================================================
-- V10 - Agrega descanso_seg a rutina_ejercicios
-- Tiempo de descanso recomendado entre series (en segundos)
-- ============================================================
ALTER TABLE rutina_ejercicios
    ADD COLUMN IF NOT EXISTS descanso_seg INT;
