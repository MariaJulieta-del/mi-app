import axiosInstance from '../../../shared/services/axiosInstance'
const API = '/api/v1/asistencias'
export const registrarCheckin = async (data: { dni?: string; socioId?: number; tipo?: string }) => {
 const res = await axiosInstance.post(`${API}/checkin`, data)
 return res.data
}
export const listarHoy = async () => {
 const res = await axiosInstance.get(`${API}/hoy`)
 return res.data
}
export const listarPorSocio = async (socioId: number) => {
 const res = await axiosInstance.get(`${API}/socio/${socioId}`)
 return res.data
}
export const listarPorRango = async (desde: string, hasta: string) => {
 const res = await axiosInstance.get(API, { params: { desde, hasta } })
 return res.data
}
