-- Cuántas semanas puede un socio hacer la misma rutina (lo define el admin)
ALTER TABLE public.configuracion_gimnasio ADD COLUMN IF NOT EXISTS semanas_rutina integer NOT NULL DEFAULT 6;
-- Última vez que el profe cambió los ejercicios de la rutina (desde ahí se cuenta su antigüedad)
ALTER TABLE public.rutinas ADD COLUMN IF NOT EXISTS fecha_renovacion timestamp(6) without time zone;
-- Plan que se cobró en cada pago (la membresía cambia de plan al renovar; el pago guarda el de ese momento)
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS tipo_plan character varying(20);
UPDATE public.pagos p SET tipo_plan = m.tipo_membresia FROM public.membresias m WHERE p.membresia_id = m.id AND p.tipo_plan IS NULL;
