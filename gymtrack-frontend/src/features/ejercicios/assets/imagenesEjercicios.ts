// Índice liviano nombre → imagen (GIF) de cada ejercicio del catálogo.
// Se genera con: node scripts/generar-indice-imagenes.mjs
// (el catálogo completo, con instrucciones, pesa 1,1 MB y solo lo usa la página de Ejercicios)
import indice from './imagenesEjercicios.json'

const BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/'

/** Mapa nombre (minúsculas) → URL del GIF */
export const NAME_TO_STATIC_IMG: Record<string, string> = Object.fromEntries(
  Object.entries(indice as Record<string, string>).map(([nombre, codigo]) => [nombre, `${BASE}${codigo}.gif`]),
)

/**
 * Ejercicios con nombre en castellano (los que carga el gimnasio y la entrada en calor que se
 * agrega sola a cada rutina) → ejercicio del catálogo con el GIF equivalente.
 * Las claves van sin acentos; un nombre que EMPIEZA con una clave también la usa
 * ("Curl predicador (Scott)" → "curl predicador"). Si hay varias, gana la más larga.
 */
const ALIAS: Record<string, string> = {
  // Entrada en calor
  'caminata / trote suave': 'walking on incline treadmill',
  'rotacion de hombros': 'chest and front of shoulder stretch',
  'movilidad de cadera': 'circles knee stretch',
  'sentadilla de movilidad': 'potty squat',
  'estiramiento de isquiotibiales': 'hamstring stretch',
  // Pecho
  'press de banca con barra': 'barbell bench press',
  'press de banca plano': 'barbell bench press',
  'press de banca con mancuernas': 'dumbbell bench press',
  'press de banca inclinado': 'barbell incline bench press',
  'press de banca declinado': 'barbell decline bench press',
  'press de banca': 'barbell bench press',
  'press cerrado': 'barbell close-grip bench press',
  'aperturas con mancuernas': 'dumbbell fly',
  'aperturas': 'dumbbell fly',
  'pec deck': 'lever seated fly',
  'mariposa': 'lever seated fly',
  'fondos en paralelas': 'chest dip',
  'fondos en banco': 'bench dip (knees bent)',
  'flexiones de brazos': 'push-up',
  'flexiones': 'push-up',
  'push-up': 'push-up',
  'pull-over con mancuerna': 'dumbbell pullover',
  'pullover': 'dumbbell pullover',
  // Espalda
  'dominadas': 'pull-up',
  'jalon al pecho': 'cable lat pulldown full range of motion',
  'remo en polea baja': 'cable seated row',
  'remo sentado': 'cable seated row',
  'remo con barra': 'barbell bent over row',
  'remo con mancuerna': 'dumbbell bent over row',
  'remo en t': 'lever t bar row',
  'peso muerto rumano': 'barbell romanian deadlift',
  'peso muerto': 'barbell deadlift',
  'buenos dias': 'barbell good morning',
  'extension en banco romano': 'hyperextension',
  'hiperextensiones': 'hyperextension',
  'superman': 'superman push-up',
  'encogimientos de hombros': 'dumbbell shrug',
  // Hombros
  'press militar con mancuernas': 'dumbbell seated shoulder press',
  'press militar con barra': 'barbell seated overhead press',
  'press militar': 'barbell seated overhead press',
  'press de hombros': 'dumbbell seated shoulder press',
  'press arnold': 'dumbbell arnold press',
  'elevaciones laterales': 'dumbbell lateral raise',
  'elevaciones frontales': 'dumbbell front raise',
  'vuelo posterior': 'dumbbell rear fly',
  // Brazos
  'curl de biceps con barra': 'barbell curl',
  'curl de biceps con mancuernas': 'dumbbell biceps curl',
  'curl de biceps': 'dumbbell biceps curl',
  'curl martillo': 'dumbbell hammer curl',
  'curl concentrado': 'dumbbell concentration curl',
  'curl predicador': 'barbell preacher curl',
  'curl de muneca': 'barbell wrist curl',
  'extension de muneca': 'barbell reverse wrist curl',
  'extension de triceps en polea': 'cable pushdown',
  'extension de triceps sobre cabeza': 'dumbbell seated triceps extension',
  'rompecraneos': 'barbell lying triceps extension skull crusher',
  // Piernas
  'sentadilla sumo': 'dumbbell goblet squat',
  'sentadilla con barra': 'barbell full squat',
  'sentadilla': 'barbell full squat',
  'prensa de piernas': 'sled 45° leg press (side pov)',
  'prensa piernas': 'sled 45° leg press (side pov)',
  'prensa': 'sled 45° leg press (side pov)',
  'extension de cuadriceps': 'lever leg extension',
  'sillon de cuadriceps': 'lever leg extension',
  'curl femoral sentado': 'lever seated leg curl',
  'curl femoral': 'lever lying leg curl',
  'estocadas': 'dumbbell lunge',
  'zancadas': 'dumbbell lunge',
  'step-up': 'dumbbell step-up',
  'hip thrust': 'barbell glute bridge',
  'hip trust': 'barbell glute bridge',
  'puente de gluteos': 'barbell glute bridge',
  'elevacion de pantorrillas': 'lever standing calf raise',
  'elevacion de talones': 'barbell standing calf raise',
  // Abdomen
  'crunch en polea': 'cable kneeling crunch',
  'crunch': 'crunch floor',
  'abdominales': 'crunch floor',
  'elevacion de piernas': 'lying leg raise flat bench',
  'plancha': 'weighted front plank',
  'rotacion rusa': 'russian twist',
  'rueda abdominal': 'wheel rollerout',
}

/** minúsculas, sin acentos ni espacios de más */
const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

const ALIAS_ORDENADO = Object.entries(ALIAS).sort((a, b) => b[0].length - a[0].length)

function porAlias(nombre: string): string | undefined {
  const n = normalizar(nombre)
  const sinParentesis = n.replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()
  for (const candidato of [n, sinParentesis]) {
    if (ALIAS[candidato]) return NAME_TO_STATIC_IMG[ALIAS[candidato]]
  }
  const encontrado = ALIAS_ORDENADO.find(([clave]) => sinParentesis.startsWith(clave + ' ') || sinParentesis === clave)
  return encontrado ? NAME_TO_STATIC_IMG[encontrado[1]] : undefined
}

/** Imagen de un ejercicio por su nombre: alias en castellano, coincidencia exacta o el nombre más parecido */
export function resolverImagenEjercicio(nombre: string): string | undefined {
  const lower = nombre.trim().toLowerCase()
  if (NAME_TO_STATIC_IMG[lower]) return NAME_TO_STATIC_IMG[lower]
  const alias = porAlias(nombre)
  if (alias) return alias
  // Nombre en inglés entre paréntesis: "Rotación rusa (Russian twist)"
  const ingles = /\(([^)]+)\)/.exec(lower)?.[1]?.trim()
  if (ingles && NAME_TO_STATIC_IMG[ingles]) return NAME_TO_STATIC_IMG[ingles]
  const words = lower.split(/\s+/).filter(w => w.length >= 4)
  let best: { url: string; score: number } | null = null
  for (const [key, url] of Object.entries(NAME_TO_STATIC_IMG)) {
    const score = words.filter(w => key.includes(w)).length
    if (score > 0 && (!best || score > best.score)) best = { url, score }
  }
  return best?.url
}
