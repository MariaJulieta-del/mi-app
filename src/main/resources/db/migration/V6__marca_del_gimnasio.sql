-- Marca del gimnasio: nombre, logo y color que se ven en toda la app (una sola fila)
CREATE TABLE IF NOT EXISTS public.configuracion_gimnasio (
    id bigint PRIMARY KEY,
    nombre character varying(80) NOT NULL DEFAULT 'GymTrack',
    logo text,
    color_acento character varying(7),
    actualizado timestamp(6) without time zone
);
INSERT INTO public.configuracion_gimnasio (id, nombre) VALUES (1, 'GymTrack') ON CONFLICT (id) DO NOTHING;
