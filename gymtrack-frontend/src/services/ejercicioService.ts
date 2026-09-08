import axiosInstance from './axiosInstance'

const API = '/api/v1/ejercicios'

export interface Ejercicio {
  id?: number
  nombre: string
  descripcion?: string
  grupoMuscular?: string
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

export const asignarDisciplina = async (socioId: number, disciplinaId: number | null): Promise<void> => {
  const params = disciplinaId !== null ? { disciplinaId } : {}
  await axiosInstance.patch(`/api/v1/socios/${socioId}/disciplina`, null, { params })
}

export const GRUPOS_MUSCULARES = [
  'Pecho', 'Espalda', 'Hombros',
  'Bíceps', 'Tríceps', 'Antebrazos',
  'Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas',
  'Abdominales', 'Core', 'Lumbares',
  'Cardio', 'Full Body',
]

// Agrupación visual para filtros
export const GRUPOS_CATEGORIAS: { label: string; grupos: string[] }[] = [
  { label: 'Tren Superior', grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'] },
  { label: 'Tren Inferior', grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'] },
  { label: 'Core / Cardio', grupos: ['Abdominales', 'Core', 'Lumbares', 'Cardio', 'Full Body'] },
]
