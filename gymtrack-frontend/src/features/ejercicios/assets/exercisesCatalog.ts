// ─────────────────────────────────────────────────────────────────
// Catálogo estático de ejercicios — sin dependencia de API externa
// ─────────────────────────────────────────────────────────────────

export interface CatalogExercise {
  id: string
  name: string
  bodyPart: string        // grupo muscular en español
  equipment: string
  target: string
  gifUrl: string
  instructions: string[]
}

const cat = (
  id: string, name: string, bodyPart: string, equipment: string,
  target: string, instructions: string[]
): CatalogExercise => ({ id, name, bodyPart, equipment, target, gifUrl: '', instructions })

export const EXERCISES_CATALOG: CatalogExercise[] = [

  // ── PECHO ───────────────────────────────────────────────────────
  cat('p01', 'Press de banca plano', 'Pecho', 'Barra', 'Pectorales', [
    'Acostarse en el banco con los pies apoyados en el suelo.',
    'Agarrar la barra con agarre ligeramente más ancho que los hombros.',
    'Bajar la barra controlada hasta tocar el pecho.',
    'Empujar la barra hacia arriba hasta extender los brazos completamente.',
  ]),
  cat('p02', 'Press de banca inclinado', 'Pecho', 'Barra', 'Pectorales superiores', [
    'Ajustar el banco a 30-45° de inclinación.',
    'Tomar la barra con agarre amplio.',
    'Bajar la barra hacia la parte superior del pecho.',
    'Empujar hacia arriba manteniendo los codos a 75°.',
  ]),
  cat('p03', 'Press de banca declinado', 'Pecho', 'Barra', 'Pectorales inferiores', [
    'Recostarse en banco declinado, asegurar los pies.',
    'Tomar la barra con agarre amplio.',
    'Bajar la barra hacia la parte inferior del pecho.',
    'Empujar hacia arriba extendiendo los codos.',
  ]),
  cat('p04', 'Aperturas con mancuernas', 'Pecho', 'Mancuernas', 'Pectorales', [
    'Acostarse en banco plano con una mancuerna en cada mano.',
    'Extender los brazos hacia arriba con una leve flexión de codo.',
    'Abrir los brazos en arco hacia los costados hasta sentir el estiramiento.',
    'Volver al centro juntando las mancuernas en arco.',
  ]),
  cat('p05', 'Push-up (flexión de brazos)', 'Pecho', 'Peso corporal', 'Pectorales', [
    'Colocarse en posición de plancha con manos a la altura de los hombros.',
    'Bajar el cuerpo doblando los codos hasta que el pecho casi toque el suelo.',
    'Empujar hacia arriba extendiendo los brazos.',
    'Mantener el cuerpo recto durante todo el movimiento.',
  ]),
  cat('p06', 'Cable crossover', 'Pecho', 'Polea', 'Pectorales', [
    'Pararse entre dos poleas altas con un cable en cada mano.',
    'Dar un paso al frente y llevar las manos al frente del cuerpo en arco.',
    'Juntar las manos frente al pecho cruzándolas levemente.',
    'Volver lentamente a la posición inicial.',
  ]),
  cat('p07', 'Fondos en paralelas (dips)', 'Pecho', 'Paralelas', 'Pectorales inferiores', [
    'Apoyarse en las paralelas con brazos extendidos.',
    'Inclinarse ligeramente hacia adelante para activar el pecho.',
    'Bajar el cuerpo doblando los codos hasta que la parte superior del brazo quede paralela al suelo.',
    'Empujar hacia arriba hasta extender los brazos.',
  ]),
  cat('p08', 'Pec deck (máquina mariposa)', 'Pecho', 'Máquina', 'Pectorales', [
    'Sentarse en la máquina con la espalda bien apoyada.',
    'Colocar los antebrazos en los almohadillados de la máquina.',
    'Juntar los brazos al frente contrayendo el pecho.',
    'Volver lentamente a la posición inicial.',
  ]),

  // ── ESPALDA ─────────────────────────────────────────────────────
  cat('e01', 'Dominadas (pull-up)', 'Espalda', 'Barra fija', 'Dorsal ancho', [
    'Colgarse de la barra con agarre prono (palmas hacia afuera) a ancho de hombros.',
    'Tirar del cuerpo hacia arriba hasta que la barbilla supere la barra.',
    'Bajar lentamente hasta extender los brazos por completo.',
  ]),
  cat('e02', 'Jalón al pecho', 'Espalda', 'Polea', 'Dorsal ancho', [
    'Sentarse en la máquina de jalón y tomar la barra con agarre amplio.',
    'Tirar la barra hacia el pecho manteniendo el torso ligeramente inclinado.',
    'Volver lentamente a la posición inicial extendiendo los brazos.',
  ]),
  cat('e03', 'Remo en polea baja', 'Espalda', 'Polea', 'Dorsal medio', [
    'Sentarse frente a la polea baja con las rodillas ligeramente flexionadas.',
    'Tomar el maneral y tirar hacia el abdomen apretando los omóplatos.',
    'Mantener la espalda recta durante el movimiento.',
    'Volver lentamente a la posición inicial.',
  ]),
  cat('e04', 'Remo con barra inclinado', 'Espalda', 'Barra', 'Dorsal medio', [
    'Pararse con piernas ligeramente flexionadas e inclinarse hacia adelante 45°.',
    'Tomar la barra con agarre prono.',
    'Tirar la barra hacia el abdomen apretando la espalda.',
    'Bajar controlado hasta extender los brazos.',
  ]),
  cat('e05', 'Peso muerto (deadlift)', 'Espalda', 'Barra', 'Lumbares', [
    'Pararse frente a la barra con los pies al ancho de cadera.',
    'Flexionar las caderas y rodillas para tomar la barra con agarre doble.',
    'Mantener la espalda recta y el pecho arriba.',
    'Levantarse extendiendo caderas y rodillas hasta quedar de pie.',
    'Bajar la barra de forma controlada.',
  ]),
  cat('e06', 'Remo en T (T-bar row)', 'Espalda', 'Barra', 'Dorsal medio', [
    'Colocar una barra en la esquina y cargarla de un extremo.',
    'Inclinarse y tomar el extremo cargado con ambas manos.',
    'Tirar la barra hacia el pecho apretando los omóplatos.',
    'Bajar controlado.',
  ]),
  cat('e07', 'Pull-over con mancuerna', 'Espalda', 'Mancuernas', 'Dorsal ancho', [
    'Acostarse en banco plano sosteniendo una mancuerna con ambas manos sobre el pecho.',
    'Bajar la mancuerna en arco hacia atrás de la cabeza, estirando el dorsal.',
    'Volver en arco hasta la posición inicial.',
  ]),
  cat('e08', 'Hiperextensiones', 'Espalda', 'Banco romano', 'Lumbares', [
    'Colocarse en el banco romano con la cadera al borde del apoyo.',
    'Cruzar los brazos sobre el pecho o colocarlos detrás de la cabeza.',
    'Bajar el torso hacia el suelo y luego subir hasta quedar recto.',
  ]),

  // ── HOMBROS ─────────────────────────────────────────────────────
  cat('h01', 'Press militar con barra', 'Hombros', 'Barra', 'Deltoides anterior', [
    'Sentarse o pararse con la barra a nivel de los hombros.',
    'Empujar la barra hacia arriba hasta extender los brazos.',
    'Bajar controlado hasta la posición inicial.',
  ]),
  cat('h02', 'Elevaciones laterales', 'Hombros', 'Mancuernas', 'Deltoides lateral', [
    'Pararse con una mancuerna en cada mano a los costados del cuerpo.',
    'Elevar los brazos hacia los costados hasta quedar paralelos al suelo.',
    'Bajar lentamente controlando el peso.',
  ]),
  cat('h03', 'Elevaciones frontales', 'Hombros', 'Mancuernas', 'Deltoides anterior', [
    'Pararse con mancuernas al frente del cuerpo.',
    'Elevar un brazo hacia adelante hasta quedar paralelo al suelo.',
    'Alternar entre brazos o levantar ambos juntos.',
  ]),
  cat('h04', 'Press Arnold', 'Hombros', 'Mancuernas', 'Deltoides completo', [
    'Sentarse con las mancuernas frente a la cara, palmas hacia adentro.',
    'Al empujar hacia arriba, rotar las palmas hacia afuera.',
    'Extender completamente los brazos arriba.',
    'Invertir el movimiento al bajar.',
  ]),
  cat('h05', 'Vuelo posterior (rear delt fly)', 'Hombros', 'Mancuernas', 'Deltoides posterior', [
    'Inclinarse hacia adelante con la espalda recta.',
    'Elevar los brazos hacia los costados haciendo foco en el deltoides posterior.',
    'Bajar lentamente.',
  ]),
  cat('h06', 'Encogimientos de hombros (shrugs)', 'Hombros', 'Barra', 'Trapecios', [
    'Pararse sosteniendo la barra al frente con agarre prono.',
    'Elevar los hombros lo más alto posible hacia las orejas.',
    'Sostener 1 segundo y bajar controlado.',
  ]),

  // ── BÍCEPS ──────────────────────────────────────────────────────
  cat('b01', 'Curl de bíceps con barra', 'Bíceps', 'Barra', 'Bíceps braquial', [
    'Pararse con la barra en las manos, palmas hacia arriba.',
    'Flexionar los codos llevando la barra hacia los hombros.',
    'Bajar lentamente hasta extender los brazos.',
  ]),
  cat('b02', 'Curl de bíceps con mancuernas', 'Bíceps', 'Mancuernas', 'Bíceps braquial', [
    'Pararse con una mancuerna en cada mano, palmas hacia adelante.',
    'Flexionar un codo llevando la mancuerna hacia el hombro.',
    'Alternar entre brazos o levantar ambos juntos.',
  ]),
  cat('b03', 'Curl martillo', 'Bíceps', 'Mancuernas', 'Braquioradial', [
    'Pararse con mancuernas con agarre neutro (palmas mirándose entre sí).',
    'Flexionar los codos manteniendo las palmas neutras.',
    'Bajar controlado.',
  ]),
  cat('b04', 'Curl predicador (Scott)', 'Bíceps', 'Barra', 'Bíceps braquial', [
    'Sentarse en el banco predicador con los brazos apoyados sobre el almohadón.',
    'Flexionar los codos llevando la barra hacia los hombros.',
    'Bajar lentamente hasta casi extender los brazos.',
  ]),
  cat('b05', 'Curl concentrado', 'Bíceps', 'Mancuernas', 'Bíceps braquial', [
    'Sentarse en un banco, apoyar el codo contra el muslo.',
    'Flexionar el codo llevando la mancuerna hacia el hombro.',
    'Bajar lentamente.',
  ]),

  // ── TRÍCEPS ─────────────────────────────────────────────────────
  cat('t01', 'Press cerrado (close-grip bench)', 'Tríceps', 'Barra', 'Tríceps', [
    'Acostarse en banco plano con agarre cerrado (manos separadas 20-30cm).',
    'Bajar la barra al pecho manteniendo los codos cerca del cuerpo.',
    'Empujar hacia arriba extendiendo los brazos.',
  ]),
  cat('t02', 'Extensión de tríceps en polea', 'Tríceps', 'Polea', 'Tríceps', [
    'Pararse frente a la polea alta tomando el maneral.',
    'Con los codos pegados al cuerpo, empujar el maneral hacia abajo.',
    'Extender completamente los brazos y volver controlado.',
  ]),
  cat('t03', 'Rompecráneos (skull crushers)', 'Tríceps', 'Barra', 'Tríceps', [
    'Acostarse en banco con la barra extendida sobre el pecho.',
    'Flexionar los codos bajando la barra hacia la frente.',
    'Extender los codos para volver a la posición inicial.',
  ]),
  cat('t04', 'Extensión de tríceps sobre cabeza', 'Tríceps', 'Mancuernas', 'Tríceps largo', [
    'Sentarse con una mancuerna sostenida con ambas manos sobre la cabeza.',
    'Flexionar los codos bajando la mancuerna detrás de la cabeza.',
    'Extender los codos para volver arriba.',
  ]),
  cat('t05', 'Fondos en banco (tricep dips)', 'Tríceps', 'Banco', 'Tríceps', [
    'Apoyar las manos en el borde de un banco con los pies hacia adelante.',
    'Flexionar los codos bajando el cuerpo hacia el suelo.',
    'Empujar para volver a la posición inicial.',
  ]),

  // ── CUÁDRICEPS ──────────────────────────────────────────────────
  cat('q01', 'Sentadilla (squat)', 'Cuádriceps', 'Barra', 'Cuádriceps', [
    'Colocar la barra sobre los trapecios, pies al ancho de hombros.',
    'Flexionar caderas y rodillas bajando hasta que los muslos queden paralelos al suelo.',
    'Mantener la espalda recta y el pecho arriba.',
    'Empujar hacia arriba para volver a la posición inicial.',
  ]),
  cat('q02', 'Prensa de piernas', 'Cuádriceps', 'Máquina', 'Cuádriceps', [
    'Sentarse en la máquina con los pies apoyados en la plataforma.',
    'Liberar el seguro y bajar la plataforma flexionando las rodillas a 90°.',
    'Empujar hacia arriba extendiendo las piernas sin trabar las rodillas.',
  ]),
  cat('q03', 'Extensión de cuádriceps', 'Cuádriceps', 'Máquina', 'Cuádriceps', [
    'Sentarse en la máquina con los tobillos bajo el rodillo.',
    'Extender las rodillas hasta quedar las piernas rectas.',
    'Bajar lentamente.',
  ]),
  cat('q04', 'Estocadas (lunges)', 'Cuádriceps', 'Mancuernas', 'Cuádriceps', [
    'Pararse con mancuernas en las manos.',
    'Dar un paso largo hacia adelante y bajar la rodilla trasera casi al suelo.',
    'Volver al centro y alternar la pierna.',
  ]),
  cat('q05', 'Hack squat', 'Cuádriceps', 'Máquina', 'Cuádriceps', [
    'Colocarse en la máquina hack squat con hombros bajo los almohadones.',
    'Bajar flexionando rodillas hasta 90°.',
    'Empujar hacia arriba para volver.',
  ]),

  // ── FEMORAL / ISQUIOTIBIALES ─────────────────────────────────────
  cat('f01', 'Peso muerto rumano', 'Femoral', 'Barra', 'Isquiotibiales', [
    'Pararse con la barra al frente, pies al ancho de cadera.',
    'Mantener las piernas casi rectas y bajar la barra por las piernas.',
    'Sentir el estiramiento en los isquiotibiales.',
    'Volver a la posición erguida apretando los glúteos.',
  ]),
  cat('f02', 'Curl femoral acostado', 'Femoral', 'Máquina', 'Isquiotibiales', [
    'Acostarse boca abajo en la máquina con los tobillos bajo el rodillo.',
    'Flexionar las rodillas llevando los talones hacia los glúteos.',
    'Bajar lentamente.',
  ]),
  cat('f03', 'Curl femoral de pie', 'Femoral', 'Máquina', 'Isquiotibiales', [
    'Pararse en la máquina apoyando un tobillo bajo el rodillo.',
    'Flexionar la rodilla llevando el talón hacia el glúteo.',
    'Bajar controlado y repetir.',
  ]),
  cat('f04', 'Buenos días (good morning)', 'Femoral', 'Barra', 'Lumbares y femoral', [
    'Colocar la barra sobre los trapecios.',
    'Inclinarse hacia adelante desde las caderas manteniendo la espalda recta.',
    'Bajar hasta quedar casi paralelo al suelo.',
    'Volver a la posición erguida.',
  ]),

  // ── GLÚTEOS ─────────────────────────────────────────────────────
  cat('g01', 'Hip thrust', 'Glúteos', 'Barra', 'Glúteos', [
    'Apoyar la parte superior de la espalda en un banco y colocar la barra sobre la cadera.',
    'Con los pies apoyados en el suelo, elevar la cadera hacia arriba.',
    'Apretar los glúteos en la parte superior del movimiento.',
    'Bajar controlado.',
  ]),
  cat('g02', 'Patada de glúteo en polea', 'Glúteos', 'Polea', 'Glúteos', [
    'Engancharse un tobillo a la polea baja de pie, de cara a la polea.',
    'Extender la pierna hacia atrás manteniendo el torso estable.',
    'Volver lentamente.',
  ]),
  cat('g03', 'Sentadilla sumo', 'Glúteos', 'Barra', 'Glúteos y abductores', [
    'Pararse con los pies más separados que el ancho de hombros, pies en 45°.',
    'Bajar la barra flexionando caderas y rodillas.',
    'Mantener el torso erguido.',
    'Volver empujando desde los talones.',
  ]),
  cat('g04', 'Step-up en banco', 'Glúteos', 'Mancuernas', 'Glúteos y cuádriceps', [
    'Pararse frente a un banco con mancuernas en las manos.',
    'Apoyar un pie en el banco y empujar para subir.',
    'Bajar lentamente y alternar piernas.',
  ]),

  // ── PANTORRILLAS ────────────────────────────────────────────────
  cat('c01', 'Elevación de talones de pie', 'Pantorrillas', 'Máquina', 'Gastrocnemio', [
    'Colocarse en la máquina con los hombros bajo los almohadones.',
    'Elevarse sobre las puntas de los pies lo más alto posible.',
    'Bajar hasta el estiramiento máximo.',
  ]),
  cat('c02', 'Elevación de talones sentado', 'Pantorrillas', 'Máquina', 'Sóleo', [
    'Sentarse en la máquina con las rodillas bajo el rodillo.',
    'Elevarse sobre las puntas de los pies.',
    'Bajar lentamente.',
  ]),
  cat('c03', 'Elevación de talones con barra', 'Pantorrillas', 'Barra', 'Gastrocnemio', [
    'Colocar la barra sobre los trapecios.',
    'Apoyar las puntas de los pies en un escalón o disco.',
    'Subir y bajar con el talón, controlando el movimiento.',
  ]),

  // ── ABDOMINALES / CORE ──────────────────────────────────────────
  cat('a01', 'Crunch', 'Abdominales', 'Peso corporal', 'Recto abdominal', [
    'Acostarse boca arriba con rodillas flexionadas.',
    'Entrelazar las manos detrás de la cabeza o cruzarlas sobre el pecho.',
    'Elevar el torso contrayendo el abdomen sin levantar la zona lumbar.',
    'Bajar lentamente.',
  ]),
  cat('a02', 'Plancha frontal', 'Abdominales', 'Peso corporal', 'Core completo', [
    'Apoyarse en antebrazos y puntas de los pies.',
    'Mantener el cuerpo en línea recta sin hundir ni elevar la cadera.',
    'Sostener la posición el tiempo indicado.',
  ]),
  cat('a03', 'Rotación rusa (Russian twist)', 'Abdominales', 'Peso corporal', 'Oblicuos', [
    'Sentarse con rodillas flexionadas y torso levemente inclinado.',
    'Rotar el torso de lado a lado.',
    'Agregar peso para mayor intensidad.',
  ]),
  cat('a04', 'Elevación de piernas', 'Abdominales', 'Peso corporal', 'Recto abdominal inferior', [
    'Acostarse boca arriba con las manos debajo de los glúteos.',
    'Elevar las piernas juntas hasta los 90°.',
    'Bajar lentamente sin que toquen el suelo.',
  ]),
  cat('a05', 'Crunch en polea', 'Abdominales', 'Polea', 'Recto abdominal', [
    'Arrodillarse frente a la polea alta tomando la cuerda.',
    'Flexionar el torso hacia adelante contrayendo el abdomen.',
    'Volver lentamente a la posición inicial.',
  ]),
  cat('a06', 'Rueda abdominal (ab wheel)', 'Abdominales', 'Rueda', 'Core completo', [
    'Arrodillarse con la rueda abdominal en el suelo.',
    'Rodar hacia adelante extendiendo el cuerpo lo más posible.',
    'Contraer el core para volver a la posición inicial.',
  ]),
  cat('a07', 'Mountain climbers', 'Abdominales', 'Peso corporal', 'Core y cardio', [
    'Comenzar en posición de plancha alta.',
    'Llevar una rodilla hacia el pecho y luego la otra de forma alternada.',
    'Mantener el ritmo continuo.',
  ]),

  // ── CARDIO ──────────────────────────────────────────────────────
  cat('cd01', 'Cinta de correr (trotadora)', 'Cardio', 'Máquina', 'Cardiovascular', [
    'Subir a la cinta y establecer velocidad y duración.',
    'Comenzar caminando para entrar en calor.',
    'Aumentar la velocidad progresivamente.',
    'Finalizar reduciendo la velocidad gradualmente.',
  ]),
  cat('cd02', 'Bicicleta estática', 'Cardio', 'Máquina', 'Cardiovascular', [
    'Ajustar el asiento a la altura correcta.',
    'Pedalear a un ritmo constante.',
    'Variar la resistencia para mayor intensidad.',
  ]),
  cat('cd03', 'Remo ergómetro', 'Cardio', 'Máquina', 'Cardiovascular y espalda', [
    'Sentarse en el remo y asegurar los pies.',
    'Empujar con las piernas, luego inclinar el torso atrás y tirar del maneral.',
    'Invertir el movimiento para volver.',
  ]),
  cat('cd04', 'Salto a la cuerda', 'Cardio', 'Soga', 'Cardiovascular', [
    'Pararse con la soga detrás de los talones.',
    'Girar la soga con las muñecas y saltar sobre ella.',
    'Mantener un ritmo constante.',
  ]),
  cat('cd05', 'Burpees', 'Cardio', 'Peso corporal', 'Cardiovascular y cuerpo completo', [
    'Pararse erguido.',
    'Bajar las manos al suelo y llevar los pies hacia atrás (posición de plancha).',
    'Hacer una flexión.',
    'Llevar los pies al pecho y saltar con los brazos arriba.',
  ]),
  cat('cd06', 'Elíptica', 'Cardio', 'Máquina', 'Cardiovascular', [
    'Subir a la elíptica y tomar las manijas.',
    'Realizar el movimiento elíptico con piernas y brazos de forma coordinada.',
    'Ajustar la resistencia según la intensidad deseada.',
  ]),

  // ── ANTEBRAZOS ──────────────────────────────────────────────────
  cat('af01', 'Curl de muñeca con barra', 'Antebrazos', 'Barra', 'Flexores del antebrazo', [
    'Sentarse en un banco con los antebrazos apoyados sobre los muslos.',
    'Tomar la barra con agarre supino.',
    'Flexionar las muñecas hacia arriba y bajar lentamente.',
  ]),
  cat('af02', 'Extensión de muñeca', 'Antebrazos', 'Barra', 'Extensores del antebrazo', [
    'Sentarse con los antebrazos sobre los muslos, palmas hacia abajo.',
    'Extender las muñecas hacia arriba y bajar lentamente.',
  ]),

  // ── LUMBARES ────────────────────────────────────────────────────
  cat('l01', 'Extensión en banco romano', 'Lumbares', 'Banco romano', 'Lumbares', [
    'Colocarse en el banco romano con la cadera al borde del apoyo.',
    'Bajar el torso hacia el suelo.',
    'Subir hasta quedar en línea recta con el cuerpo.',
  ]),
  cat('l02', 'Superman', 'Lumbares', 'Peso corporal', 'Lumbares y glúteos', [
    'Acostarse boca abajo con brazos extendidos al frente.',
    'Elevar simultáneamente brazos, pecho y piernas del suelo.',
    'Sostener 2 segundos y bajar lentamente.',
  ]),
]

// ── Helpers para filtrado ──────────────────────────────────────────
export const CATALOG_BODY_PARTS = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas',
  'Abdominales', 'Lumbares', 'Antebrazos', 'Cardio',
]

// ── Nombres en inglés para búsqueda en ExerciseDB API ─────────────
// GET https://v2.exercisedb.io/api/exercises?name={name}&limit=1
export const ENGLISH_NAMES: Record<string, string> = {
  // Pecho
  p01: 'barbell bench press',
  p02: 'incline barbell bench press',
  p03: 'decline barbell bench press',
  p04: 'dumbbell fly',
  p05: 'push-up',
  p06: 'cable crossover',
  p07: 'chest dip',
  p08: 'pec deck fly',
  // Espalda
  e01: 'pull-up',
  e02: 'lat pulldown',
  e03: 'cable seated row',
  e04: 'barbell bent over row',
  e05: 'barbell deadlift',
  e06: 't-bar row',
  e07: 'dumbbell pullover',
  e08: 'hyperextension',
  // Hombros
  h01: 'barbell shoulder press',
  h02: 'dumbbell lateral raise',
  h03: 'dumbbell front raise',
  h04: 'arnold press',
  h05: 'rear lateral raise',
  h06: 'barbell shrug',
  // Bíceps
  b01: 'barbell curl',
  b02: 'dumbbell biceps curl',
  b03: 'hammer curl',
  b04: 'barbell preacher curl',
  b05: 'concentration curl',
  // Tríceps
  t01: 'close-grip bench press',
  t02: 'cable pushdown',
  t03: 'skull crusher',
  t04: 'overhead dumbbell triceps extension',
  t05: 'triceps dip',
  // Cuádriceps
  q01: 'barbell squat',
  q02: 'leg press',
  q03: 'leg extension',
  q04: 'dumbbell lunge',
  q05: 'hack squat',
  // Femoral
  f01: 'romanian deadlift',
  f02: 'lying leg curl',
  f03: 'standing leg curl',
  f04: 'good morning',
  // Glúteos
  g01: 'barbell hip thrust',
  g02: 'cable glute kickback',
  g03: 'sumo squat',
  g04: 'step-up',
  // Pantorrillas
  c01: 'standing calf raise',
  c02: 'seated calf raise',
  c03: 'barbell standing calf raise',
  // Abdominales
  a01: 'crunch',
  a02: 'plank',
  a03: 'russian twist',
  a04: 'leg raises',
  a05: 'cable crunch',
  a06: 'ab wheel rollout',
  a07: 'mountain climber',
  // Cardio
  cd01: 'treadmill',
  cd02: 'stationary bike',
  cd03: 'rowing',
  cd04: 'jump rope',
  cd05: 'burpee',
  cd06: 'elliptical',
  // Antebrazos
  af01: 'wrist curl',
  af02: 'wrist extension',
  // Lumbares
  l01: 'back extension',
  l02: 'superman',
}

/** Mapa nombre español → nombre inglés para buscar GIF por nombre de ejercicio DB.
 *  Construido a partir de EXERCISES_CATALOG + ENGLISH_NAMES. */
export const NAME_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  EXERCISES_CATALOG
    .filter(ex => ENGLISH_NAMES[ex.id])
    .map(ex => [ex.name.toLowerCase(), ENGLISH_NAMES[ex.id]])
)

// ─────────────────────────────────────────────────────────────────
// Imágenes desde GitHub repo yuhonas/free-exercise-db (sin dependencia local)
// ─────────────────────────────────────────────────────────────────
const _B = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const STATIC_IMG_IDS: Record<string, string> = {
  // Pecho
  p01: 'Barbell_Bench_Press_-_Medium_Grip',
  p02: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  p03: 'Decline_Barbell_Bench_Press',
  p04: 'Dumbbell_Flyes',
  p05: 'Push-Up',
  p06: 'Cable_Crossover',
  p07: 'Chest_Dip',
  p08: 'Pec_Deck_Fly',
  // Espalda
  e01: 'Pull-Up',
  e02: 'Lat_Pulldown',
  e03: 'Seated_Cable_Row',
  e04: 'Bent_Over_Barbell_Row',
  e05: 'Barbell_Deadlift',
  e06: 'T-Bar_Row',
  e07: 'Dumbbell_Pullover',
  e08: 'Hyperextensions',
  // Hombros
  h01: 'Barbell_Shoulder_Press',
  h02: 'Dumbbell_Lateral_Raise',
  h03: 'Dumbbell_Alternate_Front_Raise',
  h04: 'Arnold_Dumbbell_Press',
  h05: 'Rear_Lateral_Raise',
  h06: 'Barbell_Shrug',
  // Bíceps
  b01: 'Barbell_Curl',
  b02: 'Dumbbell_Bicep_Curl',
  b03: 'Alternate_Hammer_Curl',
  b04: 'Barbell_Preacher_Curl',
  b05: 'Concentration_Curls',
  // Tríceps
  t01: 'Close-Grip_Barbell_Bench_Press',
  t02: 'Cable_Pushdown',
  t03: 'Barbell_Skull_Crusher',
  t04: 'Dumbbell_One_Arm_Triceps_Extension',
  t05: 'Triceps_Dip',
  // Cuádriceps
  q01: 'Barbell_Squat',
  q02: 'Leg_Press',
  q03: 'Leg_Extensions',
  q04: 'Dumbbell_Lunges',
  q05: 'Barbell_Hack_Squat',
  // Femoral
  f01: 'Romanian_Deadlift',
  f02: 'Lying_Leg_Curls',
  f03: 'Standing_Leg_Curl',
  f04: 'Good_Morning',
  // Glúteos
  g01: 'Barbell_Hip_Thrust',
  g02: 'Cable_Hip_Adduction',
  g03: 'Sumo_Squat',
  g04: 'Barbell_Step_Ups',
  // Pantorrillas
  c01: 'Standing_Calf_Raises',
  c02: 'Barbell_Seated_Calf_Raise',
  c03: 'Barbell_Standing_Calf_Raise',
  // Abdominales
  a01: 'Crunch',
  a02: 'Plank',
  a03: 'Russian_Twist',
  a04: 'Leg_Raises',
  a05: 'Cable_Crunch',
  a06: 'Ab_Roller',
  a07: 'Mountain_Climber',
  // Cardio
  cd01: 'Treadmill',
  cd02: 'Bicycling_Stationary',
  cd03: 'Rowing_Ergometer',
  cd04: 'Jump_Rope',
  cd05: 'Burpees',
  cd06: 'Elliptical_Trainer',
  // Antebrazos
  af01: 'Wrist_Curl',
  af02: 'Wrist_Extension',
  // Lumbares
  l01: 'Back_Extension',
  l02: 'Superman',
}

// Aplicar URLs del repo yuhonas/free-exercise-db directamente
EXERCISES_CATALOG.forEach(ex => {
  if (STATIC_IMG_IDS[ex.id]) ex.gifUrl = `${_B}${STATIC_IMG_IDS[ex.id]}/0.jpg`
})

/** Mapa nombre español (lowercase) → URL de imagen estática.
 *  Usado en RutinasDetail como fallback cuando imagenUrl no está en DB. */
export const NAME_TO_STATIC_IMG: Record<string, string> = Object.fromEntries(
  EXERCISES_CATALOG
    .filter(ex => ex.gifUrl)
    .map(ex => [ex.name.toLowerCase(), ex.gifUrl])
)
