-- V15: Crear tabla de mantenimientos de máquinas
CREATE TABLE IF NOT EXISTS mantenimientos (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    maquina_id          BIGINT          NOT NULL,
    tipo                VARCHAR(20)     NOT NULL COMMENT 'PENDIENTE | REALIZADO',
    descripcion         TEXT            NOT NULL,
    fecha_mantenimiento DATE,
    tecnico             VARCHAR(200),
    costo               DECIMAL(10, 2),
    observaciones       TEXT,
    fecha_creacion      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mantenimiento_maquina
        FOREIGN KEY (maquina_id) REFERENCES maquinas(id)
        ON DELETE CASCADE
);
