import axiosInstance from '../../../shared/services/axiosInstance'

const API = '/api/v1/ejercicios'

/** Ejercicio del catálogo propio del gimnasio ("Mis ejercicios") */
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

export const listarTodosEjercicios = async (): Promise<Ejercicio[]> =>
  (await axiosInstance.get(`${API}/todos`)).data

export const crearEjercicio = async (e: Ejercicio): Promise<Ejercicio> =>
  (await axiosInstance.post(API, e)).data

export const actualizarEjercicio = async (id: number, e: Ejercicio): Promise<Ejercicio> =>
  (await axiosInstance.put(`${API}/${id}`, e)).data

export const desactivarEjercicio = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API}/${id}`)
}

export const activarEjercicio = async (id: number): Promise<Ejercicio> =>
  (await axiosInstance.patch(`${API}/${id}/activar`)).data

// ── Limpieza (solo admin) ──────────────────────────────────────────────────

export interface ItemLimpieza { id: number; nombre: string; activo: boolean; esMaquina: boolean }
export interface VistaLimpieza {
  /** Desactivados que ninguna rutina usa: se pueden borrar */
  borrables: ItemLimpieza[]
  /** Desactivados que están en alguna rutina: se conservan */
  desactivadosEnUso: ItemLimpieza[]
  /** Grupos de nombres casi iguales, para revisar a mano */
  posiblesDuplicados: ItemLimpieza[][]
  total: number
}

export const vistaLimpieza = async (): Promise<VistaLimpieza> => (await axiosInstance.get(`${API}/limpieza`)).data

/** Borra definitivamente los desactivados sin uso. Devuelve cuántos. */
export const limpiarEjercicios = async (): Promise<number> => (await axiosInstance.post(`${API}/limpieza`)).data.borrados

/** Borra uno definitivamente (solo si ninguna rutina lo usa) */
export const borrarEjercicio = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API}/${id}/permanente`)
}

export const GRUPOS_CATEGORIAS: { label: string; grupos: string[] }[] = [
  { label: 'Tren Superior', grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'] },
  { label: 'Tren Inferior', grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'] },
  { label: 'Core / Cardio', grupos: ['Abdominales', 'Core', 'Lumbares', 'Cardio', 'Full Body'] },
]
