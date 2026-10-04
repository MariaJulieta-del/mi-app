import axiosInstance from '../../../shared/services/axiosInstance'
const API = '/api/v1/fichas-medicas'
export const obtenerFicha = async (socioId: number) => {
 const res = await axiosInstance.get(`${API}/socio/${socioId}`)
 return res.data
}
export const guardarFicha = async (socioId: number, data: Record<string, unknown>) => {
 const res = await axiosInstance.put(`${API}/socio/${socioId}`, data)
 return res.data
}
