-- ============================================================
-- V3 - Tablas: membresias y pagos
-- Ejecutado manualmente en Sprint 2.
-- ============================================================
CREATE TABLE IF NOT EXISTS membresias (
    id               BIGSERIAL PRIMARY KEY,
    socio_id         BIGINT        NOT NULL,
    tipo_membresia   VARCHAR(15)   NOT NULL,
    estado_membresia VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE_PAGO',
    fecha_inicio     DATE          NOT NULL,
    fecha_vencimiento DATE         NOT NULL,
    precio           DECIMAL(10,2) NOT NULL,
    fecha_creacion   DATE          NOT NULL,
    CONSTRAINT fk_membresias_socio FOREIGN KEY (socio_id) REFERENCES socios(id),
    CONSTRAINT chk_precio_positivo CHECK (precio > 0),
    CONSTRAINT chk_vencimiento CHECK (fecha_vencimiento > fecha_inicio)
);

CREATE TABLE IF NOT EXISTS pagos (
    id            BIGSERIAL PRIMARY KEY,
    membresia_id  BIGINT        NOT NULL,
    monto         DECIMAL(10,2) NOT NULL,
    metodo_pago   VARCHAR(15)   NOT NULL,
    estado_pago   VARCHAR(15)   NOT NULL DEFAULT 'PENDIENTE',
    fecha_pago    DATE          NOT NULL,
    observaciones TEXT,
    CONSTRAINT fk_pagos_membresia FOREIGN KEY (membresia_id) REFERENCES membresias(id)
);
