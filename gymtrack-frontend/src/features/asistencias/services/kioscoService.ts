import axios from 'axios'
import axiosInstance, { API_URL } from '../../../shared/services/axiosInstance'
import type { CodigoQr } from './asistenciaService'

// ── Gestión (admin) ────────────────────────────────────────────────────────
export interface Pantalla { id: number; nombre: string; creado: string; creadoPor: string | null; ultimoUso: string | null }

export const listarPantallas = async (): Promise<Pantalla[]> => (await axiosInstance.get('/api/v1/kiosco')).data

/** Vincula una pantalla nueva. El token viene solo en esta respuesta. */
export const vincularPantalla = async (nombre: string): Promise<{ id: number; nombre: string; token: string }> =>
  (await axiosInstance.post('/api/v1/kiosco', { nombre })).data

export const desvincularPantalla = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/kiosco/${id}`)
}

/** Link que se abre en la tablet de recepción. El token va en el "#" para que no quede en logs de servidores. */
export const linkPantalla = (token: string) => `${window.location.origin}/kiosco#t=${token}`

// ── Lo que usa la propia pantalla (con su token, sin sesión de usuario) ────
const CLAVE = 'gt_kiosco_token'

export function tokenPantalla(): string | null {
  try { return localStorage.getItem(CLAVE) } catch { return null }
}
export function guardarTokenPantalla(token: string) {
  try { localStorage.setItem(CLAVE, token) } catch { /* sin almacenamiento */ }
}
export function borrarTokenPantalla() {
  try { localStorage.removeItem(CLAVE) } catch { /* sin almacenamiento */ }
}

const kioscoAxios = axios.create({ baseURL: API_URL })
kioscoAxios.interceptors.request.use(cfg => {
  const t = tokenPantalla()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

export const qrPantalla = async (): Promise<CodigoQr> => (await kioscoAxios.get('/api/v1/asistencias/qr-actual')).data
export const ultimosPantalla = async () => (await kioscoAxios.get('/api/v1/kiosco/ultimos')).data
