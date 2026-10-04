import axios from 'axios'
import { API_URL } from '../../../shared/services/axiosInstance'
import type { LoginRequest, LoginResponse } from '../../../shared/types/Auth'
const BASE = `${API_URL}/api/v1/auth`
// Axios sin interceptor (para login, que no tiene token aún)
const publicAxios = axios.create({ baseURL: BASE })
export async function login(data: LoginRequest): Promise<LoginResponse> {
 const res = await publicAxios.post<LoginResponse>('/login', data)
 return res.data
}
export async function loginSocio(dni: string, pin: string): Promise<LoginResponse> {
 const res = await publicAxios.post<LoginResponse>('/login-socio', { dni, pin })
 return res.data
}
export async function register(data: {
 username: string
 password: string
 email?: string
 rol?: string
 socioId?: number
}): Promise<void> {
 const token = localStorage.getItem('gt_token')
 await publicAxios.post('/register', data, {
 headers: { Authorization: `Bearer ${token}` },
 })
}
