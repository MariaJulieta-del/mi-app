-- Caja: el cambio con el que arranca el día (lo que quedó del cierre anterior) y lo que se deja para el siguiente
ALTER TABLE public.cierre_caja ADD COLUMN IF NOT EXISTS fondo_inicial numeric(38,2) NOT NULL DEFAULT 0;
ALTER TABLE public.cierre_caja ADD COLUMN IF NOT EXISTS deja_en_caja numeric(38,2);
