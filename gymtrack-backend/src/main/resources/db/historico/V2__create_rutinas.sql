-- ============================================================
-- V2 - Tablas: rutinas y rutina_ejercicios
-- Ejecutado manualmente en Sprint 2.
-- ============================================================
CREATE TABLE IF NOT EXISTS rutinas (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    descripcion    TEXT,
    fecha_creacion DATE         NOT NULL,
    socio_id       BIGINT       NULL,   -- NULL = rutina general/template sin socio asignado
    CONSTRAINT fk_rutinas_socio FOREIGN KEY (socio_id) REFERENCES socios(id)
);

CREATE TABLE IF NOT EXISTS rutina_ejercicios (
    id               BIGSERIAL PRIMARY KEY,
    rutina_id        BIGINT       NOT NULL,
    nombre_ejercicio VARCHAR(100) NOT NULL,
    series           INT,
    repeticiones     INT,
    peso_kg          DECIMAL(6,2),
    orden            INT,
    notas            TEXT,
    CONSTRAINT fk_rutina_ejercicios_rutina FOREIGN KEY (rutina_id)
        REFERENCES rutinas(id) ON DELETE CASCADE
);
