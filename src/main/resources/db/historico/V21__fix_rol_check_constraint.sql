-- Elimina el check constraint generado por Hibernate que no incluye PROFESOR
-- y lo recrea con los tres roles válidos del sistema.
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE usuarios
    ADD CONSTRAINT usuarios_rol_check
        CHECK (rol IN ('ADMIN', 'PROFESOR', 'SOCIO'));
