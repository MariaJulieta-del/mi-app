import axiosInstance from '../../../shared/services/axiosInstance'
const API = '/api/v1/notificaciones'
export const listarNotificaciones = async () => {
 const res = await axiosInstance.get(API)
 return res.data
}
export interface NotificacionRequest { socioId?: number | null; mensaje: string; tipo?: string; titulo?: string }

export const crearNotificacion = async (data: NotificacionRequest) => {
 const res = await axiosInstance.post(API, data)
 return res.data
}
export const archivarNotificacion = async (id: number) => {
 await axiosInstance.delete(`${API}/${id}`)
}
