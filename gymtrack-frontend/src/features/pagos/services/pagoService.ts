import axiosInstance from '../../../shared/services/axiosInstance'
import type { Pago, PagoRequestDTO } from '../types/Pago'
const API = '/api/v1/pagos'
export const registrarPago = async (data: PagoRequestDTO): Promise<Pago> => {
 const res = await axiosInstance.post(API, data)
 return res.data
}
export const registrarConMembresia = async (data: {
 socioId: number
 planTipo: string
 metodoPago: string
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
export const saldarDeuda = async (data: {
 membresiaId: number
 metodoPago: string
 observaciones?: string
}): Promise<Pago> => {
 const res = await axiosInstance.post(`${API}/saldar-deuda`, data)
 return res.data
}
