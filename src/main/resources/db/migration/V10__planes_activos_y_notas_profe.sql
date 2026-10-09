-- Planes que ya no se venden (no se borran si algún socio los usó)
ALTER TABLE public.tarifas_membresia ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
-- Indicaciones personales del profe en la rutina de un socio
ALTER TABLE public.rutinas ADD COLUMN IF NOT EXISTS notas_profe text;
-- Canales de cada aviso (la app siempre; mail y WhatsApp a elección)
ALTER TABLE public.notificaciones ADD COLUMN IF NOT EXISTS por_email boolean NOT NULL DEFAULT true;
ALTER TABLE public.notificaciones ADD COLUMN IF NOT EXISTS por_whatsapp boolean NOT NULL DEFAULT false;
