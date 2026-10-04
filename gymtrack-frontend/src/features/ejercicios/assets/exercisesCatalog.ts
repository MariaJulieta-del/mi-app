// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de ejercicios — 1 324 ejercicios con GIFs reales
// Fuente: exercises-dataset (MIT) + media © Gym visual (gymvisual.com)
// GIFs servidos desde jsDelivr CDN → sin dependencia de API externa
// ─────────────────────────────────────────────────────────────────────────────

import _data from './exercisesData.json'

export interface CatalogExercise {
  id: string
  name: string
  bodyPart: string     // grupo muscular en español
  equipment: string
  target: string
  gifUrl: string
  imageUrl: string     // thumbnail 180×180 (fallback más liviano)
  instructions: string[]
}

export const EXERCISES_CATALOG: CatalogExercise[] = _data as CatalogExercise[]

export const CATALOG_BODY_PARTS = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas',
  'Abdominales', 'Antebrazos', 'Cardio', 'Cuello',
]

// El mapa nombre → imagen está en imagenesEjercicios.ts (índice liviano)
