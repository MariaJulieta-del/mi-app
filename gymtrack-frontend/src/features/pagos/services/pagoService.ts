import axiosInstance from '../../../shared/services/axiosInstance'
import type { Pago, MetodoPago } from '../types/Pago'
const API = '/api/v1/pagos'
/**
 * Cobra un plan: crea o renueva la membresía del socio y registra el pago.
 * `clave` identifica este intento de cobro: si el pedido llega dos veces (doble clic,
 * reintento por mala conexión), el servidor registra un solo pago.
 */
export const registrarConMembresia = async (data: {
 socioId: number
 planTipo: string
 metodoPago: MetodoPago
 observaciones?: string
}, clave?: string): Promise<Pago> => {
 const res = await axiosInstance.post(`${API}/con-membresia`, data, clave ? { headers: { 'Idempotency-Key': clave } } : undefined)
 return res.data
}
/** Pagos de un período (fechas YYYY-MM-DD; sin fechas = últimos 12 meses) */
export const listarPagos = async (desde?: string, hasta?: string, signal?: AbortSignal): Promise<Pago[]> => {
 const res = await axiosInstance.get(API, { params: { desde, hasta }, signal })
 return res.data
}
export const pagosPorMembresia = async (membresiaId: number): Promise<Pago[]> => {
 const res = await axiosInstance.get(`${API}/membresia/${membresiaId}`)
 return res.data
}
