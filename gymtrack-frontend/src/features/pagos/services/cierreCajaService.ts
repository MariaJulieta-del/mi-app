import axiosInstance from '../../../shared/services/axiosInstance'
import type { CierreCajaResumen, CierreCajaRequest } from '../types/CierreCaja'

const API = '/api/v1/cierre-caja'

export const obtenerResumen = async (fecha?: string): Promise<CierreCajaResumen> => {
  const params = fecha ? { fecha } : {}
  const res = await axiosInstance.get(`${API}/resumen`, { params })
  return res.data
}

export const cerrarCaja = async (dto: CierreCajaRequest): Promise<CierreCajaResumen> => {
  const res = await axiosInstance.post(API, dto)
  return res.data
}

export const historialCierres = async (): Promise<CierreCajaResumen[]> => {
  const res = await axiosInstance.get(API)
  return res.data
}
