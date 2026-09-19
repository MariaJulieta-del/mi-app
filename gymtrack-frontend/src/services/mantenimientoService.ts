import axiosInstance from './axiosInstance'
import type { Mantenimiento, MantenimientoRequest } from '../types/Mantenimiento'

const API = '/api/v1/mantenimientos'

export const listarMantenimientos = async (): Promise<Mantenimiento[]> => {
  const res = await axiosInstance.get(API)
  return res.data
}

export const listarPorMaquina = async (maquinaId: number): Promise<Mantenimiento[]> => {
  const res = await axiosInstance.get(`${API}/maquina/${maquinaId}`)
  return res.data
}

export const crearMantenimiento = async (data: MantenimientoRequest): Promise<Mantenimiento> => {
  const res = await axiosInstance.post(API, data)
  return res.data
}

export const actualizarMantenimiento = async (id: number, data: Partial<MantenimientoRequest>): Promise<Mantenimiento> => {
  const res = await axiosInstance.put(`${API}/${id}`, data)
  return res.data
}

export const eliminarMantenimiento = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API}/${id}`)
}
