import axios from 'axios'
import type { Membresia, MembresiaRequestDTO } from '../types/Membresia'
import type { EstadoMembresia } from '../types/Membresia'

const API = 'http://localhost:8080/api/v1/membresias'

/** Crea una nueva membresía */
export const crearMembresia = async (data: MembresiaRequestDTO): Promise<Membresia> => {
  const res = await axios.post(API, data)
  return res.data
}

/** Lista todas las membresías */
export const listarMembresias = async (): Promise<Membresia[]> => {
  const res = await axios.get(API)
  return res.data
}

/** Obtiene una membresía por ID */
export const obtenerMembresia = async (id: number): Promise<Membresia> => {
  const res = await axios.get(`${API}/${id}`)
  return res.data
}

/**
 * Cambia el estado de una membresía.
 * Ejemplo: cancelar → nuevoEstado = 'CANCELADA'
 */
export const cambiarEstado = async (
  id: number,
  nuevoEstado: EstadoMembresia
): Promise<Membresia> => {
  const res = await axios.patch(`${API}/${id}/estado`, null, {
    params: { nuevoEstado },
  })
  return res.data
}
