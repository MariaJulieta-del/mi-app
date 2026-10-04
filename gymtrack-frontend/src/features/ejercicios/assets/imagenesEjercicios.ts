// Índice liviano nombre → imagen (GIF) de cada ejercicio del catálogo.
// Se genera con: node scripts/generar-indice-imagenes.mjs
// (el catálogo completo, con instrucciones, pesa 1,1 MB y solo lo usa la página de Ejercicios)
import indice from './imagenesEjercicios.json'

const BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/'

/** Mapa nombre (minúsculas) → URL del GIF */
export const NAME_TO_STATIC_IMG: Record<string, string> = Object.fromEntries(
  Object.entries(indice as Record<string, string>).map(([nombre, codigo]) => [nombre, `${BASE}${codigo}.gif`]),
)

/** Imagen de un ejercicio por su nombre: coincidencia exacta o, si no, el nombre más parecido */
export function resolverImagenEjercicio(nombre: string): string | undefined {
  const lower = nombre.toLowerCase()
  if (NAME_TO_STATIC_IMG[lower]) return NAME_TO_STATIC_IMG[lower]
  const words = lower.split(/\s+/).filter(w => w.length >= 4)
  let best: { url: string; score: number } | null = null
  for (const [key, url] of Object.entries(NAME_TO_STATIC_IMG)) {
    const score = words.filter(w => key.includes(w)).length
    if (score > 0 && (!best || score > best.score)) best = { url, score }
  }
  return best?.url
}
