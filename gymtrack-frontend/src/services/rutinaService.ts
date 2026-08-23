import axiosInstance from './axiosInstance'
import type { Rutina, RutinaRequestDTO, Ejercicio, EjercicioRequestDTO } from '../types/Rutina'
const API = '/api/v1/rutinas'
const headers = (socioId: number) => ({ 'X-Socio-Id': socioId })
// ── Rutinas ───────────────────────────────────────────────────────────────
/** Para rol SOCIO o EMPLEADO: lista las rutinas del socio */
export const obtenerRutinas = async (socioId: number): Promise<Rutina[]> => {
 const res = await axiosInstance.get(API, { headers: headers(socioId) })
 return res.data
}
/** Para rol ADMIN: lista todas las rutinas del sistema */
export const obtenerTodasRutinas = async (): Promise<Rutina[]> => {
 const res = await axiosInstance.get(`${API}/todas`)
 return res.data
}
export const obtenerRutina = async (id: number, socioId: number): Promise<Rutina> => {
 const res = await axiosInstance.get(`${API}/${id}`, { headers: headers(socioId) })
 return res.data
}
export const crearRutina = async (socioId: number, data: RutinaRequestDTO): Promise<Rutina> => {
 const res = await axiosInstance.post(API, data, { headers: headers(socioId) })
 return res.data
}
export const actualizarRutina = async (
 id: number, socioId: number, data: RutinaRequestDTO
): Promise<Rutina> => {
 const res = await axiosInstance.put(`${API}/${id}`, data, { headers: headers(socioId) })
 return res.data
}
export const eliminarRutina = async (id: number, socioId: number): Promise<void> => {
 await axiosInstance.delete(`${API}/${id}`, { headers: headers(socioId) })
}
// ── Ejercicios ────────────────────────────────────────────────────────────
/** Lista los ejercicios de una rutina, ordenados por 'orden' */
export const obtenerEjercicios = async (rutinaId: number, socioId: number): Promise<Ejercicio[]> => {
 const res = await axiosInstance.get(`${API}/${rutinaId}/ejercicios`, { headers: headers(socioId) })
 return res.data
}
/** Agrega un ejercicio a una rutina */
export const agregarEjercicio = async (
 rutinaId: number, socioId: number, data: EjercicioRequestDTO
): Promise<Ejercicio> => {
 const res = await axiosInstance.post(`${API}/${rutinaId}/ejercicios`, data, { headers: headers(socioId) })
 return res.data
}
/** Elimina un ejercicio de una rutina */
export const eliminarEjercicio = async (
 rutinaId: number, ejId: number, socioId: number
): Promise<void> => {
 await axiosInstance.delete(`${API}/${rutinaId}/ejercicios/${ejId}`, { headers: headers(socioId) })
}
