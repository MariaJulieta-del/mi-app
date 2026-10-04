-- V17: Agregar fecha_alta y telefono_tecnico a mantenimientos
ALTER TABLE mantenimientos
    ADD COLUMN fecha_alta       DATE         NULL COMMENT 'Fecha en que la máquina volvió a estar operativa',
    ADD COLUMN telefono_tecnico VARCHAR(60)  NULL COMMENT 'Teléfono / contacto del técnico';
