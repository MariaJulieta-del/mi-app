-- ============================================================
-- V8 - Notificaciones y comunicaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id             BIGSERIAL PRIMARY KEY,
    titulo         VARCHAR(150) NOT NULL,
    mensaje        TEXT         NOT NULL,
    tipo           VARCHAR(20)  NOT NULL DEFAULT 'AVISO',  -- AVISO / RECORDATORIO / VENCIMIENTO
    destinatario   VARCHAR(20)  NOT NULL DEFAULT 'TODOS',  -- TODOS / DISCIPLINA / SOCIO
    socio_id       BIGINT,      -- null = todos
    fecha_creacion TIMESTAMP    NOT NULL DEFAULT NOW(),
    activa         BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_notif_socio FOREIGN KEY (socio_id) REFERENCES socios(id)
);
