-- V18: Historial de cierres de caja diarios
CREATE TABLE cierre_caja (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha                DATE           NOT NULL UNIQUE COMMENT 'Un solo cierre por día',
    total_efectivo       DECIMAL(10,2)  NOT NULL DEFAULT 0 COMMENT 'Pagos en efectivo completados del día',
    total_tarjeta        DECIMAL(10,2)  NOT NULL DEFAULT 0 COMMENT 'Pagos con tarjeta completados del día',
    total_transferencia  DECIMAL(10,2)  NOT NULL DEFAULT 0 COMMENT 'Pagos por transferencia completados del día',
    total_egresos        DECIMAL(10,2)  NOT NULL DEFAULT 0 COMMENT 'Egresos registrados del día',
    balance_calculado    DECIMAL(10,2)  NOT NULL DEFAULT 0 COMMENT 'total_efectivo - total_egresos',
    monto_contado        DECIMAL(10,2)  NULL     COMMENT 'Lo que contó físicamente el encargado',
    diferencia           DECIMAL(10,2)  NULL     COMMENT 'monto_contado - balance_calculado',
    cantidad_pagos       INT            NOT NULL DEFAULT 0,
    observaciones        TEXT           NULL,
    creado_por           VARCHAR(100)   NULL,
    created_at           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
);
