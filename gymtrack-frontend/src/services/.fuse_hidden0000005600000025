import axiosInstance from './axiosInstance'
import type { Socio } from '../types/Socio'
const API = '/api/v1/socios'
export const obtenerTodos = async (): Promise<Socio[]> => {
 const res = await axiosInstance.get(API)
 return res.data
}
export const obtenerPorId = async (id: number): Promise<Socio> => {
 const res = await axiosInstance.get(`${API}/${id}`)
 return res.data
}
export const crearSocio = async (socio: Socio): Promise<Socio> => {
 const res = await axiosInstance.post(API, socio)
 return res.data
}
export const actualizarSocio = async (id: number, socio: Socio): Promise<Socio> => {
 const res = await axiosInstance.put(`${API}/${id}`, socio)
 return res.data
}
export const darDeBaja = async (id: number): Promise<void> => {
 await axiosInstance.delete(`${API}/${id}`)
}
export const obtenerConInactivos = async (): Promise<Socio[]> => {
 const res = await axiosInstance.get(`${API}/todos`)
 return res.data
}
export const reactivarSocio = async (id: number): Promise<Socio> => {
 const res = await axiosInstance.put(`${API}/${id}/reactivar`)
 return res.data
}
export const eliminarPermanente = async (id: number): Promise<void> => {
 await axiosInstance.delete(`${API}/${id}/permanente`)
}
