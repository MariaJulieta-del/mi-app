-- =============================================================
-- GymTrack – Sprint 2: Módulo Rutinas
-- BD: PostgreSQL
-- =============================================================

-- Tabla principal de rutinas
CREATE TABLE IF NOT EXISTS rutinas (
    id              BIGSERIAL       PRIMARY KEY,
    nombre          VARCHAR(50)     NOT NULL,
    descripcion     TEXT,
    socio_id        BIGINT          NOT NULL,
    fecha_creacion  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rutinas_socio
        FOREIGN KEY (socio_id)
        REFERENCES socios(id)
        ON DELETE CASCADE
);

-- Índice para acelerar las búsquedas por socio
CREATE INDEX IF NOT EXISTS idx_rutinas_socio_id ON rutinas(socio_id);

-- =============================================================
-- Tabla de ejercicios dentro de una rutina (N:N implícita)
-- =============================================================

CREATE TABLE IF NOT EXISTS rutina_ejercicios (
    id                  BIGSERIAL       PRIMARY KEY,
    rutina_id           BIGINT          NOT NULL,
    nombre_ejercicio    VARCHAR(100)    NOT NULL,
    series              INTEGER,
    repeticiones        INTEGER,
    peso_kg             DECIMAL(6,2),
    orden               INTEGER         NOT NULL DEFAULT 1,
    notas               TEXT,

    CONSTRAINT fk_rutina_ejercicios_rutina
        FOREIGN KEY (rutina_id)
        REFERENCES rutinas(id)
        ON DELETE CASCADE,

    -- El orden de un ejercicio debe ser único dentro de la misma rutina
    CONSTRAINT uq_rutina_orden UNIQUE (rutina_id, orden)
);

-- Índice para listar ejercicios de una rutina ordenados
CREATE INDEX IF NOT EXISTS idx_rutina_ejercicios_rutina_id ON rutina_ejercicios(rutina_id);

-- =============================================================
-- Datos de prueba (comentar en producción)
-- =============================================================

/*
INSERT INTO rutinas (nombre, descripcion, socio_id)
VALUES ('Rutina Fuerza A', 'Press banca + sentadilla + peso muerto', 1);

INSERT INTO rutina_ejercicios (rutina_id, nombre_ejercicio, series, repeticiones, peso_kg, orden)
VALUES
  (1, 'Press de banca', 4, 8, 80.0, 1),
  (1, 'Sentadilla', 4, 6, 100.0, 2),
  (1, 'Peso muerto', 3, 5, 120.0, 3);
*/
