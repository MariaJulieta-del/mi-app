-- V14 - Soporte de "fiado": ingresos con deuda pendiente
-- Un socio con membresía PENDIENTE_PAGO puede ingresar 1 vez.
-- Al segundo intento queda bloqueado hasta saldar la deuda.

ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS con_deuda BOOLEAN NOT NULL DEFAULT FALSE;
