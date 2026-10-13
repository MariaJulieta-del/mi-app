-- ============================================================
-- V6 - Control de Acceso y Asistencia
-- ============================================================
CREATE TABLE IF NOT EXISTS asistencias (
    id           BIGSERIAL PRIMARY KEY,
    socio_id     BIGINT      NOT NULL,
    fecha        DATE        NOT NULL,
    hora         TIME        NOT NULL,
    tipo         VARCHAR(10) NOT NULL DEFAULT 'ENTRADA', -- ENTRADA / SALIDA
    permitido    BOOLEAN     NOT NULL DEFAULT TRUE,       -- FALSE = acceso denegado
    observacion  TEXT,
    CONSTRAINT fk_asistencias_socio FOREIGN KEY (socio_id) REFERENCES socios(id)
);

-- Índice para búsquedas frecuentes por socio + fecha
CREATE INDEX IF NOT EXISTS idx_asistencias_socio_fecha ON asistencias(socio_id, fecha);
