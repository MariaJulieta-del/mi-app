-- ============================================================
-- V1 - Tabla: socios
-- Creada por Hibernate en Sprint 1; migración para referencia.
-- ============================================================
CREATE TABLE IF NOT EXISTS socios (
    id        BIGSERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL,
    apellido  VARCHAR(100) NOT NULL,
    dni       VARCHAR(20)  NOT NULL UNIQUE,
    email     VARCHAR(150),
    telefono  VARCHAR(20),
    estado    VARCHAR(10)  NOT NULL DEFAULT 'ACTIVO'
);
