import axiosInstance from '../../../shared/services/axiosInstance'
const API = '/api/v1/reportes'
export const getDashboard = async () => {
 const res = await axiosInstance.get(`${API}/dashboard`)
 return res.data
}
export const getIngresos = async (meses = 6) => {
 const res = await axiosInstance.get(`${API}/ingresos`, { params: { meses } })
 return res.data
}
export const getAsistencias = async (desde: string, hasta: string) => {
 const res = await axiosInstance.get(`${API}/asistencias`, { params: { desde, hasta } })
 return res.data
}
export const getProximosAVencer = async (dias = 15) => {
 const res = await axiosInstance.get(`${API}/proximos-a-vencer`, { params: { dias } })
 return res.data
}
export const getMorosos = async () => {
 const res = await axiosInstance.get(`${API}/morosos`)
 return res.data
}
export const getSinAsistencias = async (dias = 14) => {
 const res = await axiosInstance.get(`${API}/sin-asistencias`, { params: { dias } })
 return res.data
}
