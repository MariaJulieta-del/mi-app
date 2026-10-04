import axiosInstance from '../../../shared/services/axiosInstance'
import type { Egreso, EgresoRequestDTO } from '../types/Egreso'

const API = '/api/v1/egresos'

export const listarEgresosHoy = async (): Promise<Egreso[]> => {
  const res = await axiosInstance.get(`${API}/hoy`)
  return res.data
}

export const listarEgresos = async (desde?: string, hasta?: string): Promise<Egreso[]> => {
  const params: Record<string, string> = {}
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta
  const res = await axiosInstance.get(API, { params })
  return res.data
}

export const registrarEgreso = async (dto: EgresoRequestDTO): Promise<Egreso> => {
  const res = await axiosInstance.post(API, dto)
  return res.data
}

export const eliminarEgreso = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API}/${id}`)
}

export const totalEgresosHoy = async (): Promise<number> => {
  const res = await axiosInstance.get(`${API}/total/hoy`)
  return Number(res.data.total ?? 0)
}
