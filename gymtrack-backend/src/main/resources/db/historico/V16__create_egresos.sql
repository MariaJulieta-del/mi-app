-- V16: Tabla de egresos de caja (caja chica / gastos operativos)
CREATE TABLE egresos (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha       DATE         NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    monto       DECIMAL(10,2) NOT NULL,
    categoria   VARCHAR(50)  NOT NULL DEFAULT 'VARIOS',
    registrado_por VARCHAR(100),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
