import axiosInstance from '../../../shared/services/axiosInstance'
export type { Maquina } from '../types/Maquina'
import type { Maquina } from '../types/Maquina'
import { olvidarCatalogo } from '../../ejercicios/services/ejercicioService'

const API = '/api/v1/maquinas'

/** Los ejercicios guardan con qué máquinas se hacen: cualquier cambio de máquinas descarta su copia guardada */
const cambiando = <T,>(p: Promise<T>): Promise<T> => p.finally(olvidarCatalogo)

export const activarMaquina = async (id: number): Promise<Maquina> => {
  const res = await cambiando(axiosInstance.patch(`/api/v1/maquinas/${id}/activar`))
  return res.data
}

export const listarMaquinas = async (soloActivas = true): Promise<Maquina[]> => {
  const res = await axiosInstance.get(API, { params: { soloActivas } })
  return res.data
}

export const crearMaquina = async (data: Omit<Maquina, 'id'>): Promise<Maquina> => {
  const res = await cambiando(axiosInstance.post(API, data))
  return res.data
}

export const actualizarMaquina = async (id: number, data: Omit<Maquina, 'id'>): Promise<Maquina> => {
  const res = await cambiando(axiosInstance.put(`${API}/${id}`, data))
  return res.data
}

export const desactivarMaquina = async (id: number): Promise<void> => {
  await cambiando(axiosInstance.delete(`${API}/${id}`))
}

/** Borra la máquina para siempre (el servidor lo rechaza si tiene arreglos registrados) */
export const eliminarMaquina = async (id: number): Promise<void> => {
  await cambiando(axiosInstance.delete(`${API}/${id}/definitivo`))
}
