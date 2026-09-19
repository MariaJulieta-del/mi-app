// ── Catálogo estático de máquinas ─────────────────────────────────────────
// Sin dependencia externa — funciona offline y sin API.
// Los grupos usan el mismo vocabulario que los ejercicios para poder vincularlos.

export interface CatalogMaquina {
  id: string
  nombre: string
  grupos: string[]         // mismo vocabulario que Ejercicio.grupos
  tipo: string             // 'máquina' | 'polea' | 'rack' | 'cardio' | 'barra libre'
  descripcion: string
  instruccionesUso: string
  ajustes: string
}

const m = (
  id: string,
  nombre: string,
  grupos: string[],
  tipo: string,
  descripcion: string,
  instruccionesUso: string,
  ajustes: string,
): CatalogMaquina => ({ id, nombre, grupos, tipo, descripcion, instruccionesUso, ajustes })

export const MACHINES_CATALOG: CatalogMaquina[] = [

  // ── PECHO ────────────────────────────────────────────────────────────────
  m('maq-01', 'Máquina Press de Pecho', ['Pecho', 'Tríceps', 'Hombros'],
    'máquina',
    'Máquina guiada para press de pecho. Trabaja principalmente pectoral mayor, con participación de tríceps y deltoides anterior.',
    'Ajustar el asiento para que las manijas queden al nivel del pecho. Empujar hacia adelante extendiendo los brazos y retornar controladamente.',
    'Altura del asiento: manijas al nivel medio del pecho. Ancho de agarre: ligeramente mayor al ancho de hombros.'),

  m('maq-02', 'Pec Deck / Mariposa', ['Pecho'],
    'máquina',
    'Máquina de aperturas para pectoral. Aísla el pectoral mayor con movimiento de aducción horizontal.',
    'Ajustar los brazos de palanca para que los codos queden a 90° al inicio. Unir los brazos frente al pecho y retornar con control.',
    'Altura del asiento: codos a la altura del hombro. Apertura inicial: ángulo cómodo, sin sobreextender el hombro.'),

  m('maq-03', 'Máquina de Fondos Asistida', ['Pecho', 'Tríceps'],
    'máquina',
    'Permite realizar fondos con contrapeso para asistir el movimiento. Ideal para aprender fondos o trabajar con volumen alto.',
    'Seleccionar el peso de asistencia deseado. Colocar las rodillas en la plataforma y bajar el cuerpo doblando los codos hasta 90°, luego empujar hacia arriba.',
    'Peso de asistencia: mayor peso = mayor ayuda. Plataforma de rodillas a la altura correcta.'),

  // ── ESPALDA ──────────────────────────────────────────────────────────────
  m('maq-04', 'Máquina de Jalón al Pecho (Lat Pulldown)', ['Espalda', 'Bíceps'],
    'polea',
    'Polea alta con barra para jalón al pecho. Trabaja dorsal ancho, redondo mayor y bíceps.',
    'Colocar las rodillas bajo el rodillo de sujeción. Tomar la barra con agarre prono y ancho. Tirar hacia el pecho contrayendo la espalda, retornar controladamente.',
    'Altura del rodillo: justo sobre las rodillas para fijar el cuerpo. Ancho de agarre: ligeramente mayor al ancho de hombros.'),

  m('maq-05', 'Máquina de Remo Sentado (Cable Row)', ['Espalda', 'Bíceps', 'Lumbares'],
    'polea',
    'Polea baja con asiento y apoya pies para remo horizontal. Trabaja espalda media, romboides, trapecio inferior y bíceps.',
    'Sentarse con las rodillas ligeramente flexionadas y el torso recto. Tirar el manillar hacia el abdomen, apretar la espalda al final del recorrido y retornar con control.',
    'Posición del asiento: rodillas al nivel de la polea. Tipo de manillar: paralelo (neutral) para mayor recorrido.'),

  m('maq-06', 'Máquina de Remo con Pecho (Chest Supported Row)', ['Espalda', 'Bíceps'],
    'máquina',
    'Máquina con apoyo pectoral para remo. Elimina la participación lumbar, aislando la espalda media.',
    'Apoyar el pecho en el pad y tomar las manijas. Remar tirando los codos hacia atrás y juntando los omóplatos. Retornar con control.',
    'Altura del pad: permite posición cómoda con brazos extendidos. Inclinación del asiento: ajustar según la máquina.'),

  m('maq-07', 'Máquina de Hiperextensiones (GHD)', ['Lumbares', 'Glúteos', 'Femoral'],
    'máquina',
    'Banco de hiperextensiones para trabajar la cadena posterior: lumbares, glúteos y femorales.',
    'Colocar las caderas sobre el pad y los talones bajo el rodillo. Bajar el torso hasta 90° y subir hasta la posición neutra de la espalda. No hiperextender.',
    'Altura del pad: la articulación de la cadera debe quedar al borde del pad. Posición de pies: cadera-ancho.'),

  m('maq-08', 'Máquina de Dominadas Asistida', ['Espalda', 'Bíceps'],
    'máquina',
    'Permite realizar dominadas con contrapeso de asistencia. Trabaja dorsal ancho, bíceps y core.',
    'Seleccionar el peso de asistencia. Colocar las rodillas en la plataforma, tomar la barra con agarre prono y ancho, y tirar el cuerpo hacia arriba hasta que el mentón supere la barra.',
    'Peso de asistencia: mayor peso = mayor ayuda (contrabalanceo). Ajustar la plataforma según la estatura.'),

  // ── HOMBROS ──────────────────────────────────────────────────────────────
  m('maq-09', 'Máquina Press de Hombros', ['Hombros', 'Tríceps'],
    'máquina',
    'Máquina guiada para press militar. Trabaja deltoides anterior y lateral, con asistencia de tríceps.',
    'Ajustar el asiento para que las manijas queden a la altura del hombro. Empujar hacia arriba extendiendo los brazos y retornar sin soltar la tensión.',
    'Altura del asiento: manijas alineadas con los hombros. Respaldo: totalmente reclinado para soporte lumbar.'),

  m('maq-10', 'Máquina de Elevaciones Laterales', ['Hombros'],
    'máquina',
    'Máquina para elevaciones laterales de hombros. Aísla el deltoides lateral con movimiento guiado.',
    'Ajustar los brazos para que los codos queden ligeramente flexionados. Elevar los brazos hasta la altura del hombro y retornar con control.',
    'Ajuste del brazo de palanca: codo al nivel del hombro al inicio. Altura del asiento: codos a 90° en reposo.'),

  // ── BÍCEPS ───────────────────────────────────────────────────────────────
  m('maq-11', 'Máquina de Curl de Bíceps (Predicador)', ['Bíceps'],
    'máquina',
    'Máquina de predicador para curl de bíceps. Aísla el bíceps con apoyo del brazo en el pad.',
    'Colocar los brazos sobre el pad con los codos alineados con el eje de la máquina. Flexionar los codos levantando el peso y retornar de forma controlada.',
    'Ajuste del asiento: codos al nivel del borde superior del pad. Posición de manos: agarre supino, ancho de hombros.'),

  m('maq-12', 'Polea Alta para Curl', ['Bíceps', 'Espalda'],
    'polea',
    'Polea alta con cuerda o barra para curl de bíceps. Permite ángulo de ataque diferente al curl tradicional.',
    'De pie o sentado frente a la polea. Tirar el manillar hacia la frente o hacia atrás de la cabeza según el ejercicio. Mantener los codos fijos.',
    'Altura de la polea: según el ejercicio (curl frente: alta; curl inverso: alta; remo cara: media).'),

  // ── TRÍCEPS ──────────────────────────────────────────────────────────────
  m('maq-13', 'Máquina de Tríceps (Extensión)', ['Tríceps'],
    'máquina',
    'Máquina para extensión de tríceps. Trabaja las tres cabezas del tríceps braquial con movimiento guiado.',
    'Ajustar el asiento para que los codos queden alineados con el eje. Extender los brazos empujando el pad hacia abajo y retornar controladamente.',
    'Altura del asiento: codos al borde del pad. Posición del respaldo: vertical para mayor rango de movimiento.'),

  m('maq-14', 'Polea Alta para Tríceps', ['Tríceps'],
    'polea',
    'Polea alta con cuerda o barra recta para extensiones de tríceps. Ejercicio fundamental para definición de tríceps.',
    'Pararse frente a la polea con codos a los costados del cuerpo. Extender los antebrazos hacia abajo hasta bloquear los codos y retornar.',
    'Altura de la polea: nivel de la cabeza o superior. Accesorio: cuerda para mejor activación de cabeza lateral.'),

  // ── CUÁDRICEPS ───────────────────────────────────────────────────────────
  m('maq-15', 'Prensa de Piernas (Leg Press)', ['Cuádriceps', 'Glúteos', 'Femoral'],
    'máquina',
    'Máquina de prensa para tren inferior. Trabaja cuádriceps, glúteos y femorales según la posición de los pies.',
    'Ajustar el asiento y colocar los pies en la plataforma a ancho de caderas. Flexionar las rodillas hasta 90° y empujar la plataforma extendiendo las piernas sin bloquear.',
    'Posición de pies: alta = más glúteo/femoral; baja = más cuádriceps; ancha = aductores. Rango: 90° mínimo sin dolor lumbar.'),

  m('maq-16', 'Máquina de Extensión de Cuádriceps (Leg Extension)', ['Cuádriceps'],
    'máquina',
    'Máquina de extensión para aislar el cuádriceps. Especialmente útil para rehabilitación y definición.',
    'Ajustar el pad sobre el tobillo y el respaldo para que las rodillas queden al borde del asiento. Extender las piernas hasta la posición horizontal y retornar.',
    'Altura del rodillo: tobillo (no pie, no espinilla). Posición de rodillas: al borde del asiento. Punta del pie: neutra o ligeramente hacia adentro.'),

  m('maq-17', 'Hack Squat', ['Cuádriceps', 'Glúteos', 'Femoral'],
    'máquina',
    'Máquina de sentadilla inclinada con plataforma guiada. Permite gran volumen de cuádriceps con menor estrés lumbar.',
    'Apoyar la espalda en el respaldo y los hombros en los soportes. Liberar los seguros, flexionar hasta 90° o más y extender empujando con los talones.',
    'Posición de pies: alta = más glúteo; baja = más cuádriceps; ancha = aductores. Rango de movimiento: hasta paralelo o más profundo.'),

  // ── FEMORAL ──────────────────────────────────────────────────────────────
  m('maq-18', 'Máquina de Curl Femoral Acostado (Lying Leg Curl)', ['Femoral', 'Glúteos'],
    'máquina',
    'Máquina para curl de femoral en posición prona. Aísla bíceps femoral, semitendinoso y semimembranoso.',
    'Acostarse boca abajo con el pad sobre los tobillos y las rodillas justo al borde del pad. Flexionar las rodillas llevando los talones hacia los glúteos y retornar controladamente.',
    'Posición del rodillo: tobillos (no pantorrillas). Caderas: pueden elevarse ligeramente para mayor rango.'),

  m('maq-19', 'Máquina de Curl Femoral Sentado (Seated Leg Curl)', ['Femoral'],
    'máquina',
    'Máquina de curl femoral en posición sentada. Activa mejor la cabeza larga del bíceps femoral.',
    'Ajustar el respaldo para que las rodillas queden al borde del asiento. Bajar el pad superior sobre los muslos y flexionar las rodillas tirando hacia abajo.',
    'Rango de movimiento: hasta ~90° de flexión. Respaldo: reclinado ligeramente para mejor activación.'),

  // ── GLÚTEOS ──────────────────────────────────────────────────────────────
  m('maq-20', 'Máquina de Abductores', ['Glúteos', 'Cuádriceps'],
    'máquina',
    'Máquina para separar las piernas (abducción). Trabaja glúteo mayor, glúteo medio y tensor de la fascia lata.',
    'Sentarse con los pads en la cara externa de los muslos. Empujar las piernas hacia afuera hasta la apertura máxima y retornar con control.',
    'Ancho inicial: posición cómoda con las caderas alineadas. Rango: no sobreextender para proteger articulación sacroilíaca.'),

  m('maq-21', 'Máquina de Aductores', ['Glúteos', 'Cuádriceps'],
    'máquina',
    'Máquina para juntar las piernas (aducción). Trabaja aductores del muslo y activa glúteo secundariamente.',
    'Sentarse con los pads en la cara interna de los muslos. Juntar las piernas contra la resistencia y retornar controladamente.',
    'Apertura inicial: cómoda, sin sobrecargar la cadera. Velocidad: lenta y controlada para evitar lesiones.'),

  // ── PANTORRILLAS ─────────────────────────────────────────────────────────
  m('maq-22', 'Máquina de Pantorrillas de Pie (Standing Calf Raise)', ['Pantorrillas'],
    'máquina',
    'Máquina para elevación de talones de pie. Trabaja gemelo (gastrocnemius) con rodilla extendida.',
    'Apoyar los hombros en el pad y las puntas de los pies en la plataforma. Elevar los talones lo más alto posible, mantener 1 segundo en la cima y bajar lentamente.',
    'Altura de la plataforma: punta del pie en el borde. Posición de pies: paralelos (gemelo), hacia afuera (cabeza interna), hacia adentro (cabeza externa).'),

  m('maq-23', 'Máquina de Pantorrillas Sentado (Seated Calf Raise)', ['Pantorrillas'],
    'máquina',
    'Máquina para elevación de talones sentado. Trabaja principalmente el soleo con rodilla flexionada.',
    'Sentarse con las rodillas bajo el pad y las puntas de los pies en la plataforma. Elevar los talones, mantener en la cima y bajar con control.',
    'Posición de rodillas: a 90° bajo el pad. Rango completo: bajar los talones por debajo del nivel de la plataforma para mayor estiramiento.'),

  // ── ABDOMINALES / CORE ───────────────────────────────────────────────────
  m('maq-24', 'Máquina de Crunch Abdominal', ['Abdominales', 'Core'],
    'máquina',
    'Máquina guiada para crunch abdominal. Aísla el recto abdominal con movimiento de flexión del torso.',
    'Ajustar el pad sobre los pectorales o hombros. Flexionar el torso hacia adelante contrayendo el abdomen y retornar lentamente.',
    'Altura del pad: pecho o hombros según la máquina. Posición de pies: planos en el suelo o en la plataforma.'),

  m('maq-25', 'Máquina de Rotación de Tronco', ['Abdominales', 'Core'],
    'máquina',
    'Máquina para rotación lateral del tronco. Trabaja oblicuos, recto abdominal lateral y core profundo.',
    'Sentarse con los brazos cruzados en el pad. Rotar el torso hacia un lado hasta el rango máximo cómodo y retornar. Alternar lados o realizar series por lado.',
    'Peso: moderado; el movimiento debe ser fluido, no brusco. Posición: caderas fijas, el movimiento es solo del torso.'),

  // ── CARDIO ───────────────────────────────────────────────────────────────
  m('maq-26', 'Cinta de Correr', ['Cardio', 'Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'],
    'cardio',
    'Máquina de cardio para caminar, trotar o correr. Trabaja todo el tren inferior y el sistema cardiovascular.',
    'Comenzar caminando y aumentar la velocidad gradualmente. Mantener postura erguida, brazos relajados y mirada al frente.',
    'Velocidad: caminar 4-6 km/h, trote 7-10 km/h, carrera 11+ km/h. Inclinación: 0% plano, 5-10% para mayor quema calórica.'),

  m('maq-27', 'Bicicleta Estática', ['Cardio', 'Cuádriceps', 'Glúteos', 'Femoral'],
    'cardio',
    'Máquina de cardio de bajo impacto para trabajar el tren inferior. Ideal para calentamiento y recuperación activa.',
    'Ajustar el asiento para que la rodilla quede ligeramente flexionada en la posición baja del pedal. Pedalear a un ritmo constante manteniendo cadencia adecuada.',
    'Altura del asiento: rodilla a 5-10° de extensión en la posición baja. Resistencia: baja para cardio, alta para fuerza.'),

  m('maq-28', 'Elíptica', ['Cardio', 'Cuádriceps', 'Glúteos', 'Femoral', 'Pantorrillas'],
    'cardio',
    'Máquina de cardio de impacto cero con movimiento elíptico. Trabaja cuerpo completo involucrando brazos y piernas.',
    'Subir a los pedales y tomar los manillares. Mover los pedales en movimiento elíptico sin despegar los pies. Empujar y tirar los manillares para activar el tren superior.',
    'Resistencia: ajustar según el objetivo. Inclinación: mayor = más glúteos. Variación: pedalear hacia atrás para más femoral.'),

  m('maq-29', 'Remo Ergómetro', ['Cardio', 'Espalda', 'Bíceps', 'Cuádriceps', 'Core'],
    'cardio',
    'Máquina de remo para cardio total-body. Trabaja el 86% de los músculos del cuerpo en un movimiento coordinado.',
    'Sentarse con los pies en los soportes. Empujar con las piernas extendiendo las rodillas, luego inclinar el torso hacia atrás y tirar del manillar hacia el abdomen. Retornar en orden inverso.',
    'Resistencia del abanico: palanca de 1 (mínimo) a 10 (máximo). Para cardio: 3-5; para potencia: 6-8. Postura: espalda recta durante todo el movimiento.'),

  m('maq-30', 'Escaladora (StairMaster)', ['Cardio', 'Glúteos', 'Cuádriceps', 'Femoral', 'Pantorrillas'],
    'cardio',
    'Máquina que simula subir escaleras. Alto impacto calórico que trabaja todo el tren inferior y el sistema cardiovascular.',
    'Subir a los pedales y comenzar a pisar de forma alternada a un ritmo constante. Mantener el torso levemente inclinado hacia adelante y las manos en los laterales solo como apoyo.',
    'Velocidad: 40-60 escalones/min para principiantes; 70-100 para avanzados. No apoyar el peso en los laterales para maximizar el esfuerzo.'),

  // ── RACK / BARRA LIBRE ───────────────────────────────────────────────────
  m('maq-31', 'Rack de Sentadillas / Power Rack', ['Cuádriceps', 'Glúteos', 'Femoral', 'Lumbares', 'Core'],
    'rack',
    'Estructura de seguridad para sentadillas con barra libre. Permite sentadillas libres con salvadores de seguridad. Versátil para múltiples ejercicios compuestos.',
    'Colocar la barra en los soportes a la altura de los hombros. Posicionarse bajo la barra, apoyarla en la parte alta de la espalda y descolgarla. Realizar la sentadilla y devolver la barra a los soportes.',
    'Altura de los soportes: a la altura de los hombros. Salvadores: a la altura más baja de la sentadilla para seguridad.'),

  m('maq-32', 'Máquina Smith', ['Cuádriceps', 'Pecho', 'Hombros', 'Glúteos', 'Lumbares'],
    'rack',
    'Barra guiada en rieles verticales. Más segura que la barra libre para principiantes. Limita el movimiento a un plano fijo.',
    'Cargar el peso y ajustar la altura de la barra según el ejercicio. Para sentadilla: colocarla en la espalda alta. Para press: a la altura del pecho. Desbloquear rotando la barra.',
    'Altura de la barra: según el ejercicio. Posición de los pies: ligeramente adelantados para sentadilla (compensa el movimiento guiado).'),

  m('maq-33', 'Banco de Pesas Regulable', ['Pecho', 'Hombros', 'Bíceps', 'Tríceps'],
    'barra libre',
    'Banco ajustable para ejercicios con mancuernas o barra libre. Permite press plano, inclinado y declinado, además de ejercicios de aislamiento.',
    'Ajustar el banco al ángulo deseado. Para press: acostarse con los pies en el suelo y tomar las mancuernas con agarre prono. Presionar hacia arriba y retornar controladamente.',
    'Ángulo plano (0°): pectoral mayor completo. Inclinado (30-45°): pectoral superior. Declinado: pectoral inferior.'),

  m('maq-34', 'Polea Funcional (Cable Cross)', ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Core'],
    'polea',
    'Torre de poleas ajustable en altura para ejercicios desde cualquier ángulo. Sumamente versátil para aislar músculos y trabajar en planos de movimiento variados.',
    'Ajustar la polea a la altura necesaria para el ejercicio. Tomar el accesorio correspondiente y posicionarse de pie, arrodillado o sentado según el movimiento.',
    'Altura de la polea: alta para jalones y tríceps; media para cruces de pecho; baja para curls y abdominales. Accesorios: barra recta, cuerda, manillar individual, barra EZ.'),
]

// Grupos con conteos para el chip de filtro
export const CATALOG_MACHINE_GROUPS = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas',
  'Abdominales', 'Core', 'Lumbares', 'Cardio', 'Full Body',
]

export const CATALOG_MACHINE_TIPOS = [
  'máquina', 'polea', 'rack', 'cardio', 'barra libre',
]
