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

export interface CodigoQr { codigo: string; expiraEnSeg: number; ventanaSeg: number }

/** Código vigente para la pantalla de recepción (staff) */
export const obtenerQrActual = async (): Promise<CodigoQr> => {
 const res = await axiosInstance.get(`${API}/qr-actual`)
 return res.data
}
/** El socio registra su ingreso con el código escaneado. Recién acá se consume el pase. */
export const ingresoPorQr = async (codigo: string) => {
 const res = await axiosInstance.post(`${API}/qr`, { codigo })
 return res.data
}

/** Últimos ingresos del día (un renglón por socio, solo nombre e inicial) */
export const obtenerUltimosIngresos = async (): Promise<{ nombre: string; hora: string; permitido: boolean }[]> =>
 (await axiosInstance.get('/api/v1/kiosco/ultimos')).data
