import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'
import type { Rol } from '../types/Auth'
interface Props {
 children: ReactNode
 /** Roles permitidos. Si se omite, cualquier usuario autenticado puede acceder. */
 roles?: Rol[]
}
/**
 * Ruta protegida: redirige a /login si el usuario no está autenticado.
 * Si se especifican roles, también verifica el permiso.
 */
export default function ProtectedRoute({ children, roles }: Props) {
 const { isAuthenticated, user } = useAuth()
 const location = useLocation()
 if (!isAuthenticated) {
 // Recordar a dónde iba (ej. /ingreso?c=… al escanear el QR con la cámara del celular)
 return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
 }
 if (roles && user && !roles.includes(user.rol)) {
 return (
 <div style={{ padding: 40, textAlign: 'center' }}>
 <h2 style={{ color: '#991B1B' }}>Acceso denegado</h2>
 <p>No tenés permiso para ver esta página.</p>
 </div>
 )
 }
 return <>{children}</>
}
