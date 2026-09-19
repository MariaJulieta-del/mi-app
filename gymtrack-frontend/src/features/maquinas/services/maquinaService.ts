import axiosInstance from '../../../shared/services/axiosInstance'

const API = '/api/v1/maquinas'

export interface Maquina {
  id?: number
  nroMaquina: string
  nombre: string
  descripcion?: string
  grupos?: string[]
  instruccionesUso?: string
  ajustes?: string
  activa: boolean
}

export const activarMaquina = async (id: number): Promise<Maquina> => {
  const res = await axiosInstance.patch(`/api/v1/maquinas/${id}/activar`)
  return res.data
}

export const listarMaquinas = async (soloActivas = true): Promise<Maquina[]> => {
  const res = await axiosInstance.get(API, { params: { soloActivas } })
  return res.data
}

export const crearMaquina = async (data: Omit<Maquina, 'id'>): Promise<Maquina> => {
  const res = await axiosInstance.post(API, data)
  return res.data
}

export const actualizarMaquina = async (id: number, data: Omit<Maquina, 'id'>): Promise<Maquina> => {
  const res = await axiosInstance.put(`${API}/${id}`, data)
  return res.data
}

export const desactivarMaquina = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API}/${id}`)
}
