import axiosInstance from '../../../shared/services/axiosInstance'

const BASE = '/api/v1/progreso'

export interface ProgresoInput {
  socioId: number
  rutinaEjercicioId: number
  pesoKg?: number | null
  repeticionesReales?: number | null
  seriesRealizadas?: number | null
  observacion?: string | null
  /** Esfuerzo percibido 1 a 10 */
  rpe?: number | null
}


/** Guarda o actualiza el progreso de hoy para un ejercicio */
export async function guardarProgreso(data: ProgresoInput): Promise<void> {
  await axiosInstance.post(BASE, data)
}

/** Obtiene el progreso de un socio para una rutina completa
 *  Devuelve: { [rutinaEjercicioId]: [{fecha, pesoKg, repeticionesReales, ...}] }
 */
export async function getProgresoRutina(
  socioId: number,
  rutinaId: number
): Promise<Record<number, Array<{
  id: number
  fecha: string
  pesoKg: number | null
  repeticionesReales: number | null
  seriesRealizadas: number | null
  observacion: string | null
  rpe?: number | null
}>>> {
  const res = await axiosInstance.get(`${BASE}/socio/${socioId}/rutina/${rutinaId}`)
  return res.data
}

