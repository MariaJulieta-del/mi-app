-- =============================================================
-- GymTrack – Sprint 2: Módulo Membresías y Pagos
-- BD: PostgreSQL
-- =============================================================

-- Tipos de membresía como enum nativo de PostgreSQL
DO $$ BEGIN
    CREATE TYPE tipo_membresia AS ENUM ('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_membresia AS ENUM ('PENDIENTE_PAGO', 'ACTIVA', 'VENCIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE metodo_pago AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_pago AS ENUM ('PENDIENTE', 'COMPLETADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================
-- Tabla membresias
-- =============================================================

CREATE TABLE IF NOT EXISTS membresias (
    id                  BIGSERIAL           PRIMARY KEY,
    socio_id            BIGINT              NOT NULL,
    tipo_membresia      VARCHAR(20)         NOT NULL,
    estado_membresia    VARCHAR(20)         NOT NULL DEFAULT 'PENDIENTE_PAGO',
    fecha_inicio        DATE                NOT NULL,
    fecha_vencimiento   DATE                NOT NULL,
    precio              NUMERIC(10, 2)      NOT NULL CHECK (precio > 0),
    fecha_creacion      TIMESTAMP           NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_membresias_socio
        FOREIGN KEY (socio_id)
        REFERENCES socios(id)
        ON DELETE RESTRICT,  -- No borrar socio si tiene membresías

    -- Validar que vencimiento sea posterior al inicio
    CONSTRAINT chk_fechas_membresia
        CHECK (fecha_vencimiento > fecha_inicio)
);

CREATE INDEX IF NOT EXISTS idx_membresias_socio_id       ON membresias(socio_id);
CREATE INDEX IF NOT EXISTS idx_membresias_estado         ON membresias(estado_membresia);
CREATE INDEX IF NOT EXISTS idx_membresias_vencimiento    ON membresias(fecha_vencimiento);

-- =============================================================
-- Tabla pagos
-- =============================================================

CREATE TABLE IF NOT EXISTS pagos (
    id              BIGSERIAL           PRIMARY KEY,
    membresia_id    BIGINT              NOT NULL,
    monto           NUMERIC(10, 2)      NOT NULL CHECK (monto > 0),
    metodo_pago     VARCHAR(20)         NOT NULL,
    estado_pago     VARCHAR(20)         NOT NULL DEFAULT 'COMPLETADO',
    fecha_pago      TIMESTAMP           NOT NULL DEFAULT NOW(),
    observaciones   TEXT,

    CONSTRAINT fk_pagos_membresia
        FOREIGN KEY (membresia_id)
        REFERENCES membresias(id)
        ON DELETE RESTRICT  -- No borrar membresía si tiene pagos
);

CREATE INDEX IF NOT EXISTS idx_pagos_membresia_id ON pagos(membresia_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago   ON pagos(fecha_pago DESC);

-- =============================================================
-- Datos de prueba (comentar en producción)
-- =============================================================

/*
-- Membresía mensual para socio 1
INSERT INTO membresias (socio_id, tipo_membresia, estado_membresia, fecha_inicio, fecha_vencimiento, precio)
VALUES (1, 'MENSUAL', 'PENDIENTE_PAGO', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 5000.00);

-- Pago que activa la membresía anterior
INSERT INTO pagos (membresia_id, monto, metodo_pago, estado_pago)
VALUES (1, 5000.00, 'EFECTIVO', 'COMPLETADO');
*/
