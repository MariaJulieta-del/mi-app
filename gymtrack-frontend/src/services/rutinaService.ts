import axios from 'axios'
import type { Rutina, RutinaRequestDTO } from '../types/Rutina'

// URL base del endpoint de rutinas
const API = 'http://localhost:8080/api/v1/rutinas'

/**
 * Genera los headers comunes para todas las llamadas.
 * El backend usa X-Socio-Id para identificar al propietario.
 */
const headers = (socioId: number) => ({
  'X-Socio-Id': socioId,
})

/**
 * Obtiene todas las rutinas del socio.
 */
export const obtenerRutinas = async (socioId: number): Promise<Rutina[]> => {
  const res = await axios.get(API, { headers: headers(socioId) })
  return res.data
}

/**
 * Obtiene una rutina específica por su ID.
 */
export const obtenerRutina = async (id: number, socioId: number): Promise<Rutina> => {
  const res = await axios.get(`${API}/${id}`, { headers: headers(socioId) })
  return res.data
}

/**
 * Crea una nueva rutina para el socio.
 */
export const crearRutina = async (socioId: number, data: RutinaRequestDTO): Promise<Rutina> => {
  const res = await axios.post(API, data, { headers: headers(socioId) })
  return res.data
}

/**
 * Actualiza una rutina existente (solo el propietario puede hacerlo).
 */
export const actualizarRutina = async (
  id: number,
  socioId: number,
  data: RutinaRequestDTO
): Promise<Rutina> => {
  const res = await axios.put(`${API}/${id}`, data, { headers: headers(socioId) })
  return res.data
}

/**
 * Elimina una rutina (solo el propietario puede hacerlo).
 */
export const eliminarRutina = async (id: number, socioId: number): Promise<void> => {
  await axios.delete(`${API}/${id}`, { headers: headers(socioId) })
}
