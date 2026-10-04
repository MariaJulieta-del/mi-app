import axiosInstance from '../../../shared/services/axiosInstance'
import type { Pago, MetodoPago } from '../types/Pago'
const API = '/api/v1/pagos'
/** Cobra un plan: crea o renueva la membresía del socio y registra el pago */
export const registrarConMembresia = async (data: {
 socioId: number
 planTipo: string
 metodoPago: MetodoPago
 observaciones?: string
}): Promise<Pago> => {
 const res = await axiosInstance.post(`${API}/con-membresia`, data)
 return res.data
}
export const listarPagos = async (): Promise<Pago[]> => {
 const res = await axiosInstance.get(API)
 return res.data
}
export const pagosPorMembresia = async (membresiaId: number): Promise<Pago[]> => {
 const res = await axiosInstance.get(`${API}/membresia/${membresiaId}`)
 return res.data
}
