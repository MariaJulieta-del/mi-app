-- Género del socio (FEMENINO, MASCULINO, NO_BINARIO; vacío = sin dato) para las métricas de público
ALTER TABLE public.socios ADD COLUMN IF NOT EXISTS genero character varying(20);
