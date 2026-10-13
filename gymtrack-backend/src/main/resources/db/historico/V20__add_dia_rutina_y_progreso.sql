-- V20: Día en rutina_ejercicios + tabla de progreso del socio

-- 1. Agregar columna "dia" a rutina_ejercicios (Día 1, Día 2, etc.)
ALTER TABLE rutina_ejercicios
    ADD COLUMN IF NOT EXISTS dia INTEGER NOT NULL DEFAULT 1;

-- 2. Tabla de progreso: el socio registra pesos/reps reales en cada sesión
CREATE TABLE IF NOT EXISTS progreso_ejercicio (
    id                  BIGSERIAL PRIMARY KEY,
    socio_id            BIGINT NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    rutina_ejercicio_id BIGINT NOT NULL REFERENCES rutina_ejercicios(id) ON DELETE CASCADE,
    fecha               DATE NOT NULL DEFAULT CURRENT_DATE,
    peso_kg             DECIMAL(6,2),
    repeticiones_reales INTEGER,
    series_realizadas   INTEGER,
    observacion         TEXT,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progreso_socio_fecha
    ON progreso_ejercicio(socio_id, fecha DESC);
