import axios from 'axios'

/**
 * URL del backend.
 *  - Desarrollo: vacía → las llamadas van a /api/... y Vite las reenvía al backend (sirve también desde el celular).
 *  - Producción (Vercel): VITE_API_URL = URL del backend en Render, ej. https://gymtrack-backend.onrender.com
 */
export const API_URL = import.meta.env.VITE_API_URL ?? ''
/**
 * Instancia compartida de axios con:
 * - baseURL apuntando al backend
 * - Interceptor de request: agrega Bearer token desde localStorage
 * - Interceptor de response: redirige a /login en 401
 */
const axiosInstance = axios.create({
 baseURL: API_URL,
 headers: { 'Content-Type': 'application/json' },
})
// ── Request: inyectar Bearer token ────────────────────────────────────────
axiosInstance.interceptors.request.use(
 (config) => {
 const token = localStorage.getItem('gt_token')
 if (token) {
 config.headers.Authorization = `Bearer ${token}`
 }
 return config
 },
 (error) => Promise.reject(error)
)
// ── Response: manejar 401 (token expirado o inválido) ────────────────────
axiosInstance.interceptors.response.use(
 (response) => response,
 (error) => {
 if (error.response?.status === 401) {
   localStorage.removeItem('gt_token')
   localStorage.removeItem('gt_user')
   window.location.href = '/login'
 }
 return Promise.reject(error)
 }
)
export default axiosInstance
