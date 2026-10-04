export type Rol = 'ADMIN' | 'PROFESOR' | 'SOCIO'
export interface LoginRequest {
 username: string
 password: string
}
export interface LoginResponse {
 token: string
 username: string
 rol: Rol
 socioId: number | null
}
export interface AuthUser {
 username: string
 rol: Rol
 socioId: number | null
}
