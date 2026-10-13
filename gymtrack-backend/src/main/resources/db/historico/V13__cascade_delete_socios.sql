-- V13 - Agregar ON DELETE CASCADE a todas las FK que referencian socios
-- Esto permite eliminar un socio permanentemente borrando en cascada
-- sus membresías, pagos, rutinas, asistencias y ficha médica.

-- membresias → socios
ALTER TABLE membresias DROP CONSTRAINT IF EXISTS fk_membresias_socio;
ALTER TABLE membresias ADD CONSTRAINT fk_membresias_socio
    FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE;

-- pagos → membresias (cuando se borra la membresía, se borran los pagos)
ALTER TABLE pagos DROP CONSTRAINT IF EXISTS fk_pagos_membresia;
ALTER TABLE pagos ADD CONSTRAINT fk_pagos_membresia
    FOREIGN KEY (membresia_id) REFERENCES membresias(id) ON DELETE CASCADE;

-- rutinas → socios
ALTER TABLE rutinas DROP CONSTRAINT IF EXISTS fk_rutinas_socio;
ALTER TABLE rutinas ADD CONSTRAINT fk_rutinas_socio
    FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE;

-- asistencias → socios
ALTER TABLE asistencias DROP CONSTRAINT IF EXISTS fk_asistencias_socio;
ALTER TABLE asistencias ADD CONSTRAINT fk_asistencias_socio
    FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE;

-- fichas_medicas → socios
ALTER TABLE fichas_medicas DROP CONSTRAINT IF EXISTS fk_fichas_socio;
ALTER TABLE fichas_medicas ADD CONSTRAINT fk_fichas_socio
    FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE;
