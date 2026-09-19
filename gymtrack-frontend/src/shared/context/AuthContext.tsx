import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AuthUser, LoginResponse } from '../types/Auth'
interface AuthContextType {
 user: AuthUser | null
 login: (data: LoginResponse) => void
 logout: () => void
 isAuthenticated: boolean
}
const AuthContext = createContext<AuthContextType | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<AuthUser | null>(() => {
 // Recuperar sesión persistida en localStorage
 const stored = localStorage.getItem('gt_user')
 return stored ? JSON.parse(stored) : null
 })
 const login = (data: LoginResponse) => {
 localStorage.setItem('gt_token', data.token)
 const authUser: AuthUser = {
 username: data.username,
 rol: data.rol,
 socioId: data.socioId,
 }
 localStorage.setItem('gt_user', JSON.stringify(authUser))
 setUser(authUser)
 }
 const logout = () => {
 localStorage.removeItem('gt_token')
 localStorage.removeItem('gt_user')
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
