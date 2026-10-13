-- PB-17: recordatorio automático de vencimiento de cuota (lo configura el admin)
ALTER TABLE public.configuracion_gimnasio ADD COLUMN IF NOT EXISTS recordatorio_activo boolean NOT NULL DEFAULT true;
ALTER TABLE public.configuracion_gimnasio ADD COLUMN IF NOT EXISTS recordatorio_dias integer NOT NULL DEFAULT 3;
ALTER TABLE public.configuracion_gimnasio ADD COLUMN IF NOT EXISTS recordatorio_mail boolean NOT NULL DEFAULT true;
ALTER TABLE public.configuracion_gimnasio ADD COLUMN IF NOT EXISTS recordatorio_vencida boolean NOT NULL DEFAULT true;

-- Un recordatorio por socio, por vencimiento y por tipo (ANTES / VENCIDA): nunca se repite
CREATE TABLE IF NOT EXISTS public.recordatorios_cuota (
    id bigserial PRIMARY KEY,
    socio_id bigint NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
    fecha_vencimiento date NOT NULL,
    tipo character varying(10) NOT NULL,
    enviado timestamp(6) without time zone NOT NULL,
    por_mail boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_recordatorio_cuota UNIQUE (socio_id, fecha_vencimiento, tipo)
);
CREATE INDEX IF NOT EXISTS idx_recordatorios_cuota_enviado ON public.recordatorios_cuota (enviado);

-- PB-20: historial de copias de seguridad
CREATE TABLE IF NOT EXISTS public.backups (
    id bigserial PRIMARY KEY,
    fecha timestamp(6) without time zone NOT NULL,
    archivo character varying(200),
    destino character varying(20) NOT NULL,
    tamano bigint,
    tablas integer,
    filas bigint,
    duracion_ms bigint,
    estado character varying(10) NOT NULL,
    error character varying(500),
    manual boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_backups_fecha ON public.backups (fecha DESC);

-- Los recordatorios automáticos de cuota reemplazan al aviso "vence pronto" de retención
DELETE FROM public.acciones_retencion WHERE tipo = 'VENCE_PRONTO' AND estado = 'AUTOMATICA' AND creada < now() - interval '60 days';
