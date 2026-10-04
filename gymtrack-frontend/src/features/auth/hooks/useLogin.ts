import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login as loginService, loginSocio as loginSocioService } from '../services/authService'
import { useAuth } from '../../../shared/context/AuthContext'

type Modo = 'staff' | 'socio'

export function useLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const location = useLocation()
  const destino = (location.state as { from?: string } | null)?.from ?? '/'
  // En el celular casi siempre entra un socio (o viene de escanear el QR): arranca en "Soy socio".
  // En una PC arranca en "Staff". Las dos opciones siguen disponibles en cualquier dispositivo.
  const [modo, setModo] = useState<Modo>(() =>
    destino.startsWith('/ingreso') || window.matchMedia('(max-width: 768px)').matches ? 'socio' : 'staff')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username || !password) { setError('Completá usuario y contraseña'); return }
    try {
      setLoading(true)
      const data = await loginService({ username, password })
      login(data); navigate(destino.startsWith('/ingreso') ? '/' : destino)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Usuario o contraseña incorrectos')
    }
    finally { setLoading(false) }
  }

  const handleSocio = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!dni.trim()) { setError('Ingresá tu DNI'); return }
    if (pin.length !== 4) { setError('Ingresá tu PIN de 4 números'); return }
    try {
      setLoading(true)
      const data = await loginSocioService(dni.trim(), pin)
      login(data); navigate(destino)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'No pudimos ingresar con ese DNI')
    } finally { setLoading(false) }
  }

  const switchModo = (m: Modo) => {
    setModo(m); setError(null)
    setUsername(''); setPassword(''); setDni(''); setPin('')
  }

  return {
    modo, username, setUsername, password, setPassword,
    dni, setDni, pin, setPin, error, loading,
    handleStaff, handleSocio, switchModo,
  }
}
