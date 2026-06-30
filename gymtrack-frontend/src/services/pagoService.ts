import axios from 'axios'
import type { Pago, PagoRequestDTO } from '../types/Pago'

const API = 'http://localhost:8080/api/v1/pagos'

/** Registra un nuevo pago */
export const registrarPago = async (data: PagoRequestDTO): Promise<Pago> => {
  const res = await axios.post(API, data)
  return res.data
}

/** Lista todos los pagos */
export const listarPagos = async (): Promise<Pago[]> => {
  const res = await axios.get(API)
  return res.data
}

/** Historial de pagos de una membresía específica */
export const pagosPorMembresia = async (membresiaId: number): Promise<Pago[]> => {
  const res = await axios.get(`${API}/membresia/${membresiaId}`)
  return res.data
}
