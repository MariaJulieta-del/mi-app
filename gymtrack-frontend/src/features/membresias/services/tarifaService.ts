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

/** Actualiza precio y pases mensuales (null = pase libre) */
export const actualizarTarifa = async (
  tipo: string,
  data: { precio: number; pasesMensuales: number | null },
): Promise<Tarifa> => {
  const res = await axiosInstance.put(`${API}/${tipo}`, data)
  return res.data
}
