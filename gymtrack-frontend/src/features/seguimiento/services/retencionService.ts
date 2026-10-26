import axiosInstance from '../../../shared/services/axiosInstance'

export interface Tarea {
  id: number; socioId: number; socioNombre: string; telefono: string | null
  tipo: string; titulo: string; mensaje: string; creada: string
}

/** Las de rutina de quien aparece en «Para atender» se ofrecen ahí (junto al botón de asignar), no en la lista de tareas */
export const TIPOS_RUTINA = ['SIN_RUTINA', 'RUTINA_VIEJA']

/** Marca una tarea como hecha o descartada; con «PENDIENTE» la vuelve a la lista (deshacer) */
export const resolverTarea = (id: number, estado: 'HECHA' | 'DESCARTADA' | 'PENDIENTE') =>
  axiosInstance.patch(`/api/v1/retencion/tareas/${id}`, { estado })
