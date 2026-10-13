-- Plantillas que el socio puede ver y elegir desde su app (el profe puede ocultar borradores)
ALTER TABLE public.rutinas ADD COLUMN IF NOT EXISTS visible_socios boolean NOT NULL DEFAULT true;
-- Rutina que el socio se asignó solo a partir de una plantilla (para limitar cuántas elige y que el profe lo sepa)
ALTER TABLE public.rutinas ADD COLUMN IF NOT EXISTS elegida_por_socio boolean NOT NULL DEFAULT false;
ALTER TABLE public.rutinas ADD COLUMN IF NOT EXISTS plantilla_origen_id bigint;

-- Pedidos de rutina personalizada: le llegan al staff como tarea pendiente hasta que se resuelven
CREATE TABLE IF NOT EXISTS public.solicitudes_rutina (
    id bigserial PRIMARY KEY,
    socio_id bigint NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
    objetivo character varying(20),
    dias_semana integer,
    mensaje character varying(500),
    estado character varying(12) NOT NULL,
    creada timestamp(6) without time zone NOT NULL,
    tomada_por character varying(50),
    tomada timestamp(6) without time zone,
    resuelta timestamp(6) without time zone,
    resuelta_por character varying(50),
    rutina_id bigint REFERENCES public.rutinas(id) ON DELETE SET NULL,
    motivo character varying(300),
    CONSTRAINT chk_solicitud_estado CHECK (estado IN ('PENDIENTE', 'EN_CURSO', 'HECHA', 'DESCARTADA', 'CANCELADA')),
    CONSTRAINT chk_solicitud_dias CHECK (dias_semana IS NULL OR dias_semana BETWEEN 1 AND 7)
);
-- Un solo pedido abierto por socio
CREATE UNIQUE INDEX IF NOT EXISTS uq_solicitud_rutina_abierta ON public.solicitudes_rutina (socio_id) WHERE estado IN ('PENDIENTE', 'EN_CURSO');
CREATE INDEX IF NOT EXISTS idx_solicitudes_rutina_estado ON public.solicitudes_rutina (estado, creada);
