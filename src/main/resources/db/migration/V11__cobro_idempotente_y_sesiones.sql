-- Cobro idempotente: la misma clave (un intento de cobro desde la pantalla) no registra dos pagos
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS clave_idempotencia character varying(64);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pagos_clave_idempotencia ON public.pagos (clave_idempotencia) WHERE clave_idempotencia IS NOT NULL;

-- Sesiones cerradas: el token deja de valer al salir aunque no haya vencido
CREATE TABLE IF NOT EXISTS public.tokens_revocados (
    jti character varying(64) PRIMARY KEY,
    expira timestamp(6) without time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_tokens_revocados_expira ON public.tokens_revocados (expira);

-- Índices para los listados y reportes con muchos socios
CREATE INDEX IF NOT EXISTS ix_pagos_fecha ON public.pagos (fecha_pago);
CREATE INDEX IF NOT EXISTS ix_asistencias_fecha ON public.asistencias (fecha);
CREATE INDEX IF NOT EXISTS ix_asistencias_socio_fecha ON public.asistencias (socio_id, fecha);
CREATE INDEX IF NOT EXISTS ix_membresias_socio ON public.membresias (socio_id);
