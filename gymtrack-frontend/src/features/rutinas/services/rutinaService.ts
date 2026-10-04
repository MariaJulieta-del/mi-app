import axiosInstance from '../../../shared/services/axiosInstance'
import type { Rutina, RutinaRequestDTO, Ejercicio, EjercicioRequestDTO } from '../types/Rutina'
const API = '/api/v1/rutinas'
const headers = (socioId: number | null) =>
  socioId != null ? { 'X-Socio-Id': socioId } : {}
// ── Rutinas ───────────────────────────────────────────────────────────────
export const obtenerRutinas = async (socioId: number): Promise<Rutina[]> => {
 const res = await axiosInstance.get(API, { headers: headers(socioId) })
 return res.data
}
export const obtenerTodasRutinas = async (): Promise<Rutina[]> => {
 const res = await axiosInstance.get(`${API}/todas`)
 return res.data
}
export const obtenerRutina = async (id: number, socioId: number | null): Promise<Rutina> => {
 const res = await axiosInstance.get(`${API}/${id}`, { headers: headers(socioId) })
 return res.data
}
export const crearRutina = async (socioId: number | null, data: RutinaRequestDTO): Promise<Rutina> => {
 const res = await axiosInstance.post(API, data, { headers: headers(socioId) })
 return res.data
}
export const obtenerRutinasGenerales = async (): Promise<Rutina[]> => {
 const res = await axiosInstance.get(`${API}/generales`)
 return res.data
}
export const actualizarRutina = async (
 id: number, socioId: number | null, data: RutinaRequestDTO
): Promise<Rutina> => {
 const res = await axiosInstance.put(`${API}/${id}`, data, { headers: headers(socioId) })
 return res.data
}
export const eliminarRutina = async (id: number, socioId: number | null): Promise<void> => {
 await axiosInstance.delete(`${API}/${id}`, { headers: headers(socioId) })
}
export const clonarRutina = async (
  rutinaId: number,
  socioId?: number | null,
  nombre?: string
): Promise<Rutina> => {
  const res = await axiosInstance.post(`${API}/${rutinaId}/clonar`, { socioId: socioId ?? null, nombre: nombre ?? null })
  return res.data
}
// ── Ejercicios ────────────────────────────────────────────────────────────
export const obtenerEjercicios = async (rutinaId: number, socioId: number | null): Promise<Ejercicio[]> => {
 const res = await axiosInstance.get(`${API}/${rutinaId}/ejercicios`, { headers: headers(socioId) })
 return res.data
}
export const agregarEjercicio = async (
 rutinaId: number, socioId: number | null, data: EjercicioRequestDTO
): Promise<Ejercicio> => {
 const res = await axiosInstance.post(`${API}/${rutinaId}/ejercicios`, data, { headers: headers(socioId) })
 return res.data
}
export const actualizarEjercicioEnRutina = async (
  rutinaId: number, ejId: number, socioId: number | null,
  data: { series?: number; repeticiones?: number; descansoSeg?: number; pesoKg?: number; notas?: string }
): Promise<Ejercicio> => {
  const res = await axiosInstance.patch(`${API}/${rutinaId}/ejercicios/${ejId}`, data, { headers: headers(socioId) })
  return res.data
}
export const eliminarEjercicio = async (
 rutinaId: number, ejId: number, socioId: number | null
): Promise<void> => {
 await axiosInstance.delete(`${API}/${rutinaId}/ejercicios/${ejId}`, { headers: headers(socioId) })
}
