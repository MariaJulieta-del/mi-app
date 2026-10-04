import axiosInstance from '../../../shared/services/axiosInstance'
import type { Membresia, EstadoMembresia } from '../types/Membresia'

const API = '/api/v1/membresias'

export const listarMembresias = async (): Promise<Membresia[]> => {
  const res = await axiosInstance.get(API)
  return res.data
}

export const obtenerMembresia = async (id: number): Promise<Membresia> => {
  const res = await axiosInstance.get(`${API}/${id}`)
  return res.data
}

export const cambiarEstado = async (id: number, nuevoEstado: EstadoMembresia): Promise<Membresia> => {
  const res = await axiosInstance.patch(`${API}/${id}/estado`, null, { params: { nuevoEstado } })
  return res.data
}

/** La membresía del socio, o null si nunca pagó un plan */
export const obtenerPorSocio = async (socioId: number): Promise<Membresia | null> => {
  const res = await axiosInstance.get(`${API}/socio/${socioId}`)
  return res.status === 204 || !res.data ? null : res.data
}

export const listarProximasAVencer = async (dias = 7): Promise<Membresia[]> => {
  const res = await axiosInstance.get(`${API}/proximas-a-vencer`, { params: { dias } })
  return res.data
}
