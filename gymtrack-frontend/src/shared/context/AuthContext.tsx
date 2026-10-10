import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AuthUser, LoginResponse } from '../types/Auth'
import { API_URL } from '../services/axiosInstance'

interface AuthContextType {
  user: AuthUser | null
  login: (data: LoginResponse) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

/** Sesión guardada en este navegador; si el dato está roto se ignora (en lugar de romper la app) */
function leerSesion(): AuthUser | null {
  try {
    if (!localStorage.getItem('gt_token')) return null
    const u = JSON.parse(localStorage.getItem('gt_user') ?? 'null') as AuthUser | null
    return u && typeof u.username === 'string' && typeof u.rol === 'string' ? u : null
  } catch {
    return null
  }
}

function borrarSesion() {
  try { localStorage.removeItem('gt_token'); localStorage.removeItem('gt_user') } catch { /* sin almacenamiento */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(leerSesion)

  const login = (data: LoginResponse) => {
    const authUser: AuthUser = { username: data.username, rol: data.rol, socioId: data.socioId }
    localStorage.setItem('gt_token', data.token)
    localStorage.setItem('gt_user', JSON.stringify(authUser))
    setUser(authUser)
  }

  /**
   * Cerrar sesión: el servidor anula el token (aunque alguien lo haya copiado) y se borra de este navegador.
   * Si no hay conexión, igual se cierra acá; el token vence solo.
   */
  const logout = () => {
    let token: string | null = null
    try { token = localStorage.getItem('gt_token') } catch { /* sin almacenamiento */ }
    if (token) {
      fetch(`${API_URL}/api/v1/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, keepalive: true }).catch(() => {})
    }
    borrarSesion()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
