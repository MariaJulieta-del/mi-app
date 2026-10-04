-- Modelo de membresía: una por socio, sin fiado, con pases mensuales por plan.
-- (Hoy lo aplica MembresiaUnicaMigration al iniciar porque Flyway está desactivado.)

ALTER TABLE tarifas_membresia ADD COLUMN IF NOT EXISTS pases_mensuales INTEGER;
ALTER TABLE membresias        ADD COLUMN IF NOT EXISTS pases_mensuales INTEGER;

UPDATE membresias SET estado_membresia = 'CANCELADA' WHERE estado_membresia = 'PENDIENTE_PAGO';

WITH r AS (
    SELECT id, socio_id,
           ROW_NUMBER() OVER (PARTITION BY socio_id
               ORDER BY (estado_membresia = 'ACTIVA') DESC, fecha_vencimiento DESC, id DESC) AS rn
    FROM membresias
)
UPDATE pagos p SET membresia_id = keep.id
FROM r dup JOIN r keep ON keep.socio_id = dup.socio_id AND keep.rn = 1
WHERE dup.rn > 1 AND p.membresia_id = dup.id;

WITH r AS (
    SELECT id, socio_id,
           ROW_NUMBER() OVER (PARTITION BY socio_id
               ORDER BY (estado_membresia = 'ACTIVA') DESC, fecha_vencimiento DESC, id DESC) AS rn
    FROM membresias
)
DELETE FROM membresias m USING r WHERE r.id = m.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_membresias_socio ON membresias(socio_id);
