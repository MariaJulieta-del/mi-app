import axiosInstance from '../../../shared/services/axiosInstance'
import type { Tarifa, TarifaCreateDTO } from '../types/Tarifa'

const API = '/api/v1/tarifas'

export const listarTarifas = async (): Promise<Tarifa[]> => {
  const res = await axiosInstance.get(API)
  return res.data
}

export const crearTarifa = async (data: TarifaCreateDTO): Promise<Tarifa> => {
  const res = await axiosInstance.post(API, data)
  return res.data
}

/** Actualiza precio, pases mensuales (null = pase libre), nombre y qué incluye */
export const actualizarTarifa = async (
  tipo: string,
  data: { precio: number; pasesMensuales: number | null; nombre?: string; incluye?: string },
): Promise<Tarifa> => {
  const res = await axiosInstance.put(`${API}/${tipo}`, data)
  return res.data
}

/** Habilita o deshabilita un plan (deshabilitado = no se ofrece al cobrar) */
export const cambiarActivoTarifa = async (tipo: string, activo: boolean): Promise<Tarifa> =>
  (await axiosInstance.patch(`${API}/${tipo}/activo`, { activo })).data

/** Borra un plan que nunca se usó */
export const eliminarTarifa = async (tipo: string): Promise<void> => {
  await axiosInstance.delete(`${API}/${tipo}`)
}
