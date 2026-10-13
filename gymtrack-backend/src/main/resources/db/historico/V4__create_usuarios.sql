-- ============================================================
-- V4 - Tabla: usuarios  (Sprint 3 — Seguridad)
-- Almacena credenciales con contraseña encriptada en BCrypt.
-- Se crea un usuario admin por defecto:
--   username: admin  /  password: admin123
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id       BIGSERIAL PRIMARY KEY,
    username VARCHAR(50)  NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(150),
    rol      VARCHAR(20)  NOT NULL DEFAULT 'EMPLEADO',
    activo   BOOLEAN      NOT NULL DEFAULT TRUE,
    socio_id BIGINT,
    CONSTRAINT fk_usuarios_socio FOREIGN KEY (socio_id) REFERENCES socios(id)
);

-- Usuario administrador por defecto
-- Hash BCrypt de "admin123"
INSERT INTO usuarios (username, password, email, rol, activo)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhuu',
    'admin@gymtrack.com',
    'ADMIN',
    TRUE
) ON CONFLICT (username) DO NOTHING;
