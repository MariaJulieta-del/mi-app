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

/**
 * El catálogo lo usan varias pantallas (Ejercicios, Máquinas, armar y ver rutinas): se pide una vez y se
 * reutiliza un minuto al pasar de una a otra. Cualquier cambio en el catálogo lo vuelve a pedir.
 */
const VIGENCIA_MS = 60_000
let catalogo: { datos: Promise<Ejercicio[]>; hasta: number } | null = null

export const olvidarCatalogo = () => { catalogo = null }

export const listarTodosEjercicios = (): Promise<Ejercicio[]> => {
  if (!catalogo || catalogo.hasta < Date.now()) {
    const datos = axiosInstance.get<Ejercicio[]>(`${API}/todos`).then(r => r.data)
    datos.catch(olvidarCatalogo)
    catalogo = { datos, hasta: Date.now() + VIGENCIA_MS }
  }
  return catalogo.datos
}

/** Ejecuta un cambio en el catálogo y descarta la copia guardada */
const cambiando = <T,>(p: Promise<T>): Promise<T> => p.finally(olvidarCatalogo)

export const crearEjercicio = async (e: Ejercicio): Promise<Ejercicio> =>
  (await cambiando(axiosInstance.post(API, e))).data

export const actualizarEjercicio = async (id: number, e: Ejercicio): Promise<Ejercicio> =>
  (await cambiando(axiosInstance.put(`${API}/${id}`, e))).data

export const desactivarEjercicio = async (id: number): Promise<void> => {
  await cambiando(axiosInstance.delete(`${API}/${id}`))
}

export const activarEjercicio = async (id: number): Promise<Ejercicio> =>
  (await cambiando(axiosInstance.patch(`${API}/${id}/activar`))).data

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
export const limpiarEjercicios = async (): Promise<number> => (await cambiando(axiosInstance.post(`${API}/limpieza`))).data.borrados

/** Borra uno definitivamente (solo si ninguna rutina lo usa) */
export const borrarEjercicio = async (id: number): Promise<void> => {
  await cambiando(axiosInstance.delete(`${API}/${id}/permanente`))
}

export const GRUPOS_CATEGORIAS: { label: string; grupos: string[] }[] = [
  { label: 'Tren Superior', grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'] },
  { label: 'Tren Inferior', grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'] },
  { label: 'Core / Cardio', grupos: ['Abdominales', 'Core', 'Lumbares', 'Cardio', 'Full Body'] },
]
