// Genera src/features/ejercicios/assets/imagenesEjercicios.json a partir del catálogo completo.
// Es un índice liviano (nombre → código de la imagen) para no cargar 1,1 MB en el celular.
// Uso: node scripts/generar-indice-imagenes.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/'
const catalogo = JSON.parse(readFileSync('src/features/ejercicios/assets/exercisesData.json', 'utf8'))
const indice = {}
for (const ej of catalogo) {
  if (!ej.gifUrl?.startsWith(BASE) || !ej.gifUrl.endsWith('.gif')) continue
  indice[ej.name.toLowerCase()] = ej.gifUrl.slice(BASE.length, -4)
}
writeFileSync('src/features/ejercicios/assets/imagenesEjercicios.json', JSON.stringify(indice))
console.log(`${Object.keys(indice).length} ejercicios indexados`)
