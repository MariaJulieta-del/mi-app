-- ============================================================
-- V7 - Ficha Médico-Deportiva (1:1 con socios)
-- ============================================================
CREATE TABLE IF NOT EXISTS fichas_medicas (
    id                    BIGSERIAL PRIMARY KEY,
    socio_id              BIGINT      NOT NULL UNIQUE,
    lesiones              TEXT,
    nivel_aptitud         VARCHAR(20) NOT NULL DEFAULT 'PRINCIPIANTE',
    historial_gimnasio    TEXT,
    disponibilidad        VARCHAR(200),
    observaciones_medicas TEXT,
    fecha_actualizacion   DATE,
    CONSTRAINT fk_fichas_socio FOREIGN KEY (socio_id) REFERENCES socios(id)
);
