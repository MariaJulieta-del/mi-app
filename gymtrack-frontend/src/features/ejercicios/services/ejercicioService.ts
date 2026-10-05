import axiosInstance from '../../../shared/services/axiosInstance'

const API = '/api/v1/ejercicios'

export interface Ejercicio {
  id?: number
  nombre: string
  descripcion?: string
  grupos?: string[]
  esMaquina: boolean
  activo?: boolean
  imagenUrl?: string
  maquinaIds?: number[]
}

export const listarEjercicios = async (grupo?: string): Promise<Ejercicio[]> => {
  const params = grupo ? { grupo } : {}
  const res = await axiosInstance.get(API, { params })
  return res.data
}

export const listarTodosEjercicios = async (): Promise<Ejercicio[]> => {
  const res = await axiosInstance.get(`${API}/todos`)
  return res.data
}

export const crearEjercicio = async (e: Ejercicio): Promise<Ejercicio> => {
  const res = await axiosInstance.post(API, e)
  return res.data
}

export const actualizarEjercicio = async (id: number, e: Ejercicio): Promise<Ejercicio> => {
  const res = await axiosInstance.put(`${API}/${id}`, e)
  return res.data
}

export const desactivarEjercicio = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API}/${id}`)
}

export const activarEjercicio = async (id: number): Promise<Ejercicio> => {
  const res = await axiosInstance.patch(`${API}/${id}/activar`)
  return res.data
}


// ── ExerciseDB catálogo ────────────────────────────────────────────────────

export interface ExDBExercise {
  exerciseId: string
  name: string
  gifUrl: string
  instructions: string[]
  bodyPart: string
  equipment: string
  target: string
  secondaryMuscles: string[]
}

export interface ExDBResponse {
  success: boolean
  data: {
    currentPage?: number
    totalPages?: number
    totalExercises?: number
    exercises?: ExDBExercise[]
  } | ExDBExercise[]
}

export const browseCatalogo = async (
  bodyPart?: string,
  q?: string,
  limit = 20,
  offset = 0
): Promise<ExDBExercise[]> => {
  const params: Record<string, string | number> = { limit, offset }
  if (bodyPart) params.bodyPart = bodyPart
  if (q) params.q = q
  // El backend puede devolver la lista en distintas formas según la versión de la API externa
  const res = await axiosInstance.get<unknown>(`${API}/catalogo`, { params })
  const raw = res.data
  if (Array.isArray(raw)) return raw as ExDBExercise[]
  const obj = (raw ?? {}) as { data?: unknown; exercises?: unknown }
  if (Array.isArray(obj.data)) return obj.data as ExDBExercise[]
  const anidado = (obj.data ?? {}) as { exercises?: unknown }
  if (Array.isArray(anidado.exercises)) return anidado.exercises as ExDBExercise[]
  if (Array.isArray(obj.exercises)) return obj.exercises as ExDBExercise[]
  console.warn('[browseCatalogo] formato inesperado, retornando []', raw)
  return []
}

export const getBodyParts = async (): Promise<string[]> => {
  const res = await axiosInstance.get<{ success: boolean; data: string[] }>(`${API}/catalogo/bodyparts`)
  return res.data?.data ?? []
}

export const EXDB_GRUPO_MAP: Record<string, string> = {
  'back':        'Espalda',
  'cardio':      'Cardio',
  'chest':       'Pecho',
  'lower arms':  'Antebrazos',
  'lower legs':  'Pantorrillas',
  'neck':        'Hombros',
  'shoulders':   'Hombros',
  'upper arms':  'Bíceps',
  'upper legs':  'Cuádriceps',
  'waist':       'Abdominales',
}

export interface WgerSuggestion {
  value: string
  data: { id: number; base_id: number; category: string; image?: string; image_thumbnail?: string }
}

export interface WgerSearchResult { suggestions: WgerSuggestion[] }

export interface WgerExerciseInfo {
  id: number; uuid: string; name: string; description: string
  category: { id: number; name: string }
  muscles: { id: number; name_en: string; name: string; is_front: boolean }[]
  muscles_secondary: { id: number; name_en: string; name: string }[]
  equipment: { id: number; name: string }[]
  images: { image: string; is_main: boolean }[]
  translations: { name: string; description: string; language: number }[]
}

export const buscarEjercicioExterno = async (q: string): Promise<WgerSearchResult> => {
  const res = await axiosInstance.get<WgerSearchResult>(`${API}/buscar-externo`, { params: { q } })
  return res.data
}

export const infoEjercicioExterno = async (baseId: number): Promise<WgerExerciseInfo> => {
  const res = await axiosInstance.get<WgerExerciseInfo>(`${API}/info-externo/${baseId}`)
  return res.data
}

export const WGER_GRUPO_MAP: Record<string, string> = {
  'Chest': 'Pecho', 'Back': 'Espalda', 'Shoulders': 'Hombros',
  'Biceps': 'Bíceps', 'Triceps': 'Tríceps', 'Forearms': 'Antebrazos',
  'Quadriceps': 'Cuádriceps', 'Hamstrings': 'Femoral', 'Glutes': 'Glúteos',
  'Calves': 'Pantorrillas', 'Abs': 'Abdominales', 'Core': 'Core',
  'Lower Back': 'Lumbares', 'Cardio': 'Cardio',
}

export const GRUPOS_MUSCULARES = [
  'Pecho', 'Espalda', 'Hombros',
  'Bíceps', 'Tríceps', 'Antebrazos',
  'Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas',
  'Abdominales', 'Core', 'Lumbares',
  'Cardio', 'Full Body',
]

export const GRUPOS_CATEGORIAS: { label: string; grupos: string[] }[] = [
  { label: 'Tren Superior', grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'] },
  { label: 'Tren Inferior', grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'] },
  { label: 'Core / Cardio', grupos: ['Abdominales', 'Core', 'Lumbares', 'Cardio', 'Full Body'] },
]
