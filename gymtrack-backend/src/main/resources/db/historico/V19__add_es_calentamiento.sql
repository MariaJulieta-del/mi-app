-- V19: Marca si un ejercicio de rutina pertenece al bloque de Entrada en Calor.
-- Los ejercicios con es_calentamiento = true son inamovibles y van siempre primero.
ALTER TABLE rutina_ejercicios
    ADD COLUMN es_calentamiento BOOLEAN NOT NULL DEFAULT FALSE;
