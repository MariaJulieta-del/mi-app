-- V11: Tarifario de membresías — precio editable por tipo
CREATE TABLE IF NOT EXISTS tarifas_membresia (
    tipo        VARCHAR(20) PRIMARY KEY,
    precio      NUMERIC(10,2) NOT NULL,
    descripcion TEXT,
    incluye     TEXT
);

INSERT INTO tarifas_membresia (tipo, precio, descripcion, incluye) VALUES
  ('MENSUAL',    15000.00, 'Membresía mensual', 'Acceso completo al gimnasio por 30 días. Clases grupales incluidas.'),
  ('TRIMESTRAL', 40000.00, 'Membresía trimestral', 'Acceso completo por 90 días. Ahorrás $5.000 vs 3 meses por separado.'),
  ('SEMESTRAL',  70000.00, 'Membresía semestral', 'Acceso completo por 180 días. Ahorrás $20.000 vs 6 meses por separado.'),
  ('ANUAL',     120000.00, 'Membresía anual', 'Acceso completo por 365 días. Ahorrás $60.000 vs 12 meses por separado.')
ON CONFLICT (tipo) DO NOTHING;
