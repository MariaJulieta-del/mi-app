import axiosInstance from './axiosInstance'
import type { Membresia, MembresiaRequestDTO, EstadoMembresia } from '../types/Membresia'
const API = '/api/v1/membresias'
export const crearMembresia = async (data: MembresiaRequestDTO): Promise<Membresia> => {
 const res = await axiosInstance.post(API, data)
 return res.data
}
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
export const obtenerPorSocio = async (socioId: number): Promise<Membresia[]> => {
 const res = await axiosInstance.get(`${API}/socio/${socioId}`)
 return res.data
}
/** Asigna un plan al socio SIN cobrar (fiado). Membresía queda en PENDIENTE_PAGO. */
export const crearMembresiaSinPago = async (socioId: number, planTipo: string): Promise<Membresia> => {
 const res = await axiosInstance.post(`${API}/pendiente`, { socioId, planTipo })
 return res.data
}

/** Membresías ACTIVAS que vencen en los próximos `dias` días (default 7). */
export const listarProximasAVencer = async (dias = 7): Promise<Membresia[]> => {
 const res = await axiosInstance.get(`${API}/proximas-a-vencer`, { params: { dias } })
 return res.data
}
