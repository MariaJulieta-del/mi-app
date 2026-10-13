-- Asocia los ejercicios del catálogo con las máquinas del gimnasio donde se pueden hacer,
-- para que el socio vea en cada ejercicio a qué máquina ir.
--
-- Se corre a mano (no es una migración): psql ... -f asociar_maquinas_ejercicios.sql
-- Busca por NOMBRE (sin importar mayúsculas ni espacios), así sirve en cualquier base.
-- Solo AGREGA: no borra asociaciones existentes. Se puede correr más de una vez.

BEGIN;

-- 0) Ejercicios que se usan en rutinas y faltaban en el catálogo
INSERT INTO public.ejercicios_catalogo (nombre, es_maquina, activo)
SELECT n, false, true FROM (VALUES ('Press de banca con mancuernas'), ('Press militar con mancuernas')) v(n)
WHERE NOT EXISTS (SELECT 1 FROM public.ejercicios_catalogo e WHERE lower(trim(e.nombre)) = lower(v.n));
INSERT INTO public.ejercicio_grupos (ejercicio_id, grupo)
SELECT e.id, g FROM public.ejercicios_catalogo e
JOIN (VALUES ('press de banca con mancuernas', 'Pecho'), ('press militar con mancuernas', 'Hombros')) v(n, g) ON lower(trim(e.nombre)) = v.n
WHERE NOT EXISTS (SELECT 1 FROM public.ejercicio_grupos x WHERE x.ejercicio_id = e.id);

-- 1) Ejercicio del catálogo → máquinas donde se hace
WITH pares(ejercicio, maquina) AS (VALUES
  -- Pecho
  ('Press de banca plano',            'Banco de Pesas Regulable'),
  ('Press de banca plano',            'Máquina Smith'),
  ('Press de banca plano',            'Máquina Press de Pecho'),
  ('barbell bench press',             'Banco de Pesas Regulable'),
  ('barbell bench press',             'Máquina Smith'),
  ('Press de banca inclinado',        'Banco de Pesas Regulable'),
  ('Press de banca inclinado',        'Máquina Smith'),
  ('Press de banca declinado',        'Banco de Pesas Regulable'),
  ('Aperturas con mancuernas',        'Banco de Pesas Regulable'),
  ('Aperturas con mancuernas',        'Pec Deck / Mariposa'),
  ('Cable crossover',                 'Polea Funcional (Cable Cross)'),
  ('Fondos en paralelas (dips)',      'Máquina de Fondos Asistida'),
  ('assisted triceps dip (kneeling)', 'Máquina de Fondos Asistida'),
  ('Pec deck (máquina mariposa)',     'Pec Deck / Mariposa'),
  -- Espalda
  ('dominadas',                       'Máquina de Dominadas Asistida'),
  ('Dominadas (pull-up)',             'Máquina de Dominadas Asistida'),
  ('Jalón al pecho',                  'Máquina de Jalón al Pecho (Lat Pulldown)'),
  ('Remo en polea baja',              'Máquina de Remo Sentado (Cable Row)'),
  ('Remo en polea baja',              'Polea'),
  ('Remo con barra inclinado',        'Máquina de Remo con Pecho (Chest Supported Row)'),
  ('Remo en T (T-bar row)',           'Máquina de Remo con Pecho (Chest Supported Row)'),
  ('Pull-over con mancuerna',         'Banco de Pesas Regulable'),
  ('Hiperextensiones',                'Máquina de Hiperextensiones (GHD)'),
  ('Extensión en banco romano',       'Máquina de Hiperextensiones (GHD)'),
  ('Peso muerto (deadlift)',          'Rack de Sentadillas / Power Rack'),
  -- Hombros
  ('PRESS MILITAR',                   'Máquina Press de Hombros'),
  ('PRESS MILITAR',                   'Máquina Smith'),
  ('Press militar con barra',         'Máquina Press de Hombros'),
  ('Press militar con barra',         'Máquina Smith'),
  ('Press militar con barra',         'Banco de Pesas Regulable'),
  ('Press Arnold',                    'Banco de Pesas Regulable'),
  ('Press Arnold',                    'Máquina Press de Hombros'),
  ('Elevaciones laterales',           'Máquina de Elevaciones Laterales'),
  ('Elevaciones laterales',           'Polea Funcional (Cable Cross)'),
  ('Elevaciones frontales',           'Polea Funcional (Cable Cross)'),
  ('Vuelo posterior (rear delt fly)', 'Pec Deck / Mariposa'),
  ('Vuelo posterior (rear delt fly)', 'Polea Funcional (Cable Cross)'),
  ('Encogimientos de hombros (shrugs)', 'Máquina Smith'),
  -- Brazos
  ('Curl de bíceps con barra',        'Polea Alta para Curl'),
  ('Curl de bíceps con mancuernas',   'Banco de Pesas Regulable'),
  ('Curl martillo',                   'Polea Funcional (Cable Cross)'),
  ('Curl predicador (Scott)',         'Máquina de Curl de Bíceps (Predicador)'),
  ('Curl concentrado',                'Banco de Pesas Regulable'),
  ('Press cerrado (close-grip bench)', 'Banco de Pesas Regulable'),
  ('Press cerrado (close-grip bench)', 'Máquina Smith'),
  ('Extensión de tríceps en polea',   'Polea Alta para Tríceps'),
  ('Extensión de tríceps en polea',   'Polea Funcional (Cable Cross)'),
  ('Extensión de tríceps en polea',   'Máquina de Tríceps (Extensión)'),
  ('Rompecráneos (skull crushers)',   'Banco de Pesas Regulable'),
  ('Extensión de tríceps sobre cabeza', 'Banco de Pesas Regulable'),
  ('Extensión de tríceps sobre cabeza', 'Polea Funcional (Cable Cross)'),
  ('Fondos en banco (tricep dips)',   'Banco de Pesas Regulable'),
  ('Extensión de muñeca',             'Banco de Pesas Regulable'),
  ('Curl de muñeca con barra',        'Banco de Pesas Regulable'),
  -- Piernas
  ('Prensa de piernas',               'Prensa de Piernas (Leg Press)'),
  ('lever horizontal one leg press',  'Prensa de Piernas (Leg Press)'),
  ('sled 45 degrees one leg press',   'Prensa de Piernas (Leg Press)'),
  ('sled 45в° leg press',             'Prensa de Piernas (Leg Press)'),
  ('Extensión de cuádriceps',         'Máquina de Extensión de Cuádriceps (Leg Extension)'),
  ('Extensión de cuádriceps',         'Sillón de cuádriceps'),
  ('Hack squat',                      'Hack Squat'),
  ('Estocadas (lunges)',              'Máquina Smith'),
  ('Sentadilla sumo',                 'Rack de Sentadillas / Power Rack'),
  ('Step-up en banco',                'Banco de Pesas Regulable'),
  ('Peso muerto rumano',              'Rack de Sentadillas / Power Rack'),
  ('barbell romanian deadlift',       'Rack de Sentadillas / Power Rack'),
  ('barbell single leg deadlift',     'Rack de Sentadillas / Power Rack'),
  ('Buenos días (good morning)',      'Rack de Sentadillas / Power Rack'),
  ('Buenos días (good morning)',      'Máquina Smith'),
  ('Curl femoral acostado',           'Máquina de Curl Femoral Acostado (Lying Leg Curl)'),
  ('Curl femoral de pie',             'Polea Funcional (Cable Cross)'),
  ('Hip thrust',                      'Hip trust'),
  ('Hip thrust',                      'Banco de Pesas Regulable'),
  ('barbell lying lifting (on hip)',  'Hip trust'),
  ('Patada de glúteo en polea',       'Polea Funcional (Cable Cross)'),
  ('Patada de glúteo en polea',       'Polea'),
  ('cable standing hip extension',    'Polea Funcional (Cable Cross)'),
  ('cable standing hip extension',    'Polea'),
  ('lever seated hip abduction',      'Máquina de Abductores'),
  ('Elevación de talones de pie',     'Máquina de Pantorrillas de Pie (Standing Calf Raise)'),
  ('Elevación de talones sentado',    'Máquina de Pantorrillas Sentado (Seated Calf Raise)'),
  ('Elevación de talones con barra',  'Rack de Sentadillas / Power Rack'),
  ('Elevación de talones con barra',  'Máquina Smith'),
  -- Abdomen
  ('Crunch',                          'Máquina de Crunch Abdominal'),
  ('Crunch en polea',                 'Polea Funcional (Cable Cross)'),
  ('Crunch en polea',                 'Polea'),
  ('Elevación de piernas',            'Banco de Pesas Regulable'),
  ('Press de banca con mancuernas',   'Banco de Pesas Regulable'),
  ('Press militar con mancuernas',    'Banco de Pesas Regulable'),
  ('Press militar con mancuernas',    'Máquina Press de Hombros')
)
INSERT INTO public.ejercicio_maquinas_requeridas (ejercicio_id, maquina_id)
SELECT DISTINCT e.id, m.id
FROM pares p
JOIN public.ejercicios_catalogo e ON lower(trim(e.nombre)) = lower(trim(p.ejercicio))
JOIN public.maquinas m            ON lower(trim(m.nombre)) = lower(trim(p.maquina))
WHERE NOT EXISTS (
  SELECT 1 FROM public.ejercicio_maquinas_requeridas r WHERE r.ejercicio_id = e.id AND r.maquina_id = m.id
);

-- 2) Ejercicios de rutinas cargados con nombre libre (sin vínculo al catálogo):
--    se vinculan al ejercicio del catálogo equivalente para que muestren sus máquinas.
WITH vinculos(nombre_rutina, nombre_catalogo) AS (VALUES
  ('Aperturas con mancuernas',         'Aperturas con mancuernas'),
  ('Curl de bíceps con barra',         'Curl de bíceps con barra'),
  ('Curl femoral en máquina',          'Curl femoral acostado'),
  ('Curl martillo',                    'Curl martillo'),
  ('Dominadas',                        'Dominadas (pull-up)'),
  ('Elevación de pantorrillas de pie', 'Elevación de talones de pie'),
  ('Elevaciones laterales',            'Elevaciones laterales'),
  ('Estocadas con mancuernas',         'Estocadas (lunges)'),
  ('Extensión de cuádriceps',          'Extensión de cuádriceps'),
  ('Extensión de tríceps en polea',    'Extensión de tríceps en polea'),
  ('Flexiones de brazos',              'Push-up (flexión de brazos)'),
  ('Fondos en paralelas',              'Fondos en paralelas (dips)'),
  ('Jalón al pecho (polea alta)',      'Jalón al pecho'),
  ('Peso muerto rumano',               'Peso muerto rumano'),
  ('Prensa de piernas',                'Prensa de piernas'),
  ('Press de banca con barra',         'Press de banca plano'),
  ('Press militar con mancuernas',     'Press militar con mancuernas'),
  ('Press de banca con mancuernas',    'Press de banca con mancuernas'),
  ('Remo con barra',                   'Remo con barra inclinado'),
  ('Remo en polea baja',               'Remo en polea baja'),
  ('Sentadilla con barra',             'Sentadilla (squat)')
)
UPDATE public.rutina_ejercicios re
SET ejercicio_catalogo_id = e.id
FROM vinculos v
JOIN public.ejercicios_catalogo e ON lower(trim(e.nombre)) = lower(trim(v.nombre_catalogo))
WHERE re.ejercicio_catalogo_id IS NULL
  AND NOT re.es_calentamiento
  AND lower(trim(re.nombre_ejercicio)) = lower(trim(v.nombre_rutina));

COMMIT;
