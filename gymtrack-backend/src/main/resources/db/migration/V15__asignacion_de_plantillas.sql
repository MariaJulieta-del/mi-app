-- Asignar una plantilla a un socio ya no la copia: queda vinculada.
-- Así la plantilla sabe a qué socios está asignada y "De socios" muestra solo las rutinas personalizadas.
-- Las rutinas copiadas antes de este cambio siguen como rutinas personalizadas del socio.
CREATE TABLE rutina_asignaciones (
    id                BIGSERIAL PRIMARY KEY,
    rutina_id         BIGINT      NOT NULL REFERENCES rutinas(id) ON DELETE CASCADE,
    socio_id          BIGINT      NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    fecha_asignacion  TIMESTAMP   NOT NULL DEFAULT now(),
    asignada_por      VARCHAR(50),
    elegida_por_socio BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_rutina_asignacion UNIQUE (rutina_id, socio_id)
);

CREATE INDEX idx_rutina_asignaciones_socio ON rutina_asignaciones(socio_id);
