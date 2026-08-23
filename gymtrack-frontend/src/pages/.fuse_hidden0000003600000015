import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
export default function LoginPage() {
 const navigate = useNavigate()
 const { login } = useAuth()
 const [username, setUsername] = useState('')
 const [password, setPassword] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setError(null)
 if (!username || !password) { setError('Completá usuario y contraseña'); return }
 try {
 setLoading(true)
 const data = await loginService({ username, password })
 login(data) // guarda token + user en context y localStorage
 navigate('/') // redirige al dashboard
 } catch {
 setError('Usuario o contraseña incorrectos')
 } finally {
 setLoading(false)
 }
 }
 return (
 <div className="gt-login-page">
 <div className="gt-login-card">
 {/* Logo / título */}
 <div style={{ textAlign: 'center', marginBottom: 32 }}>
 <div style={{ fontSize: 40, marginBottom: 8 }}></div>
 <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#1B5E44' }}>GymTrack</h1>
 <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 14 }}>
 Sistema de gestión de gimnasios
 </p>
 </div>
 {error && <div className="gt-alert gt-alert-error">{error}</div>}
 <form onSubmit={handleSubmit}>
 <div className="gt-form-group" style={{ marginBottom: 16 }}>
 <label className="gt-label">Usuario</label>
 <input
 className="gt-input"
 type="text"
 value={username}
 onChange={e => setUsername(e.target.value)}
 placeholder="Ej: admin"
 autoFocus
 />
 </div>
 <div className="gt-form-group" style={{ marginBottom: 24 }}>
 <label className="gt-label">Contraseña</label>
 <input
 className="gt-input"
 type="password"
 value={password}
 onChange={e => setPassword(e.target.value)}
 placeholder="••••••••"
 />
 </div>
 <button
 type="submit"
 className="gt-btn gt-btn-primary"
 style={{ width: '100%', justifyContent: 'center' }}
 disabled={loading}
 >
 {loading ? 'Iniciando sesión...' : 'Ingresar'}
 </button>
 </form>
 <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>
 Usuario por defecto: <strong>admin</strong> / <strong>admin123</strong>
 </p>
 </div>
 </div>
 )
}
