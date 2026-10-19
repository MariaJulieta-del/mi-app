import { useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../../../shared/services/axiosInstance'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import type { LoginResponse } from '../../../shared/types/Auth'
import CampoClave from '../../../shared/components/CampoClave'
import { Spinner } from '../../../shared/components/ui'

function Requisito({ ok, texto }: { ok: boolean; texto: string }) {
  return <li style={{ color: ok ? 'var(--green-text)' : 'var(--text-muted)' }}>{ok ? '✓' : '○'} {texto}</li>
}

/** Configuración de la cuenta del staff (admin o profesor): cambiar la propia contraseña */
export default function MiCuentaPage() {
  const { user, login } = useAuth()
  const toast = useToast()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cumpleLargo = nueva.length >= 8
  const cumpleMezcla = /[a-zA-Z]/.test(nueva) && /\d/.test(nueva)
  const coinciden = nueva !== '' && nueva === repetir

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError(null)
    if (!cumpleLargo || !cumpleMezcla) { setError('La contraseña debe tener al menos 8 caracteres e incluir letras y números.'); return }
    if (!coinciden) { setError('Las contraseñas nuevas no coinciden.'); return }
    setGuardando(true)
    try {
      const resp: LoginResponse = (await axiosInstance.post('/api/v1/auth/cambiar-password', { actual, nueva })).data
      login(resp)   // las otras sesiones abiertas se cierran; esta sigue con el token nuevo
      setActual(''); setNueva(''); setRepetir('')
      toast.success('Contraseña cambiada', 'Si tenías la sesión abierta en otro dispositivo, vas a tener que volver a entrar')
    } catch (e: unknown) {
      setError(mensajeError(e, 'No se pudo cambiar la contraseña'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 className="gt-page-title">Mi cuenta</h1>

      <div className="gt-card" style={{ marginBottom: 16 }}>
        <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>Usuario</p>
        <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 16 }}>
          {user?.username} <span className="gt-badge gt-badge-gray" style={{ fontSize: 10, marginLeft: 6 }}>{user?.rol}</span>
        </p>
      </div>

      <form className="gt-card" onSubmit={guardar}>
        <p className="gt-card-title" style={{ marginTop: 0 }}>Cambiar contraseña</p>
        {error && <div className="gt-alert gt-alert-error">{error}</div>}
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="pass-actual">Contraseña actual</label>
          <CampoClave id="pass-actual" className="gt-input" autoComplete="current-password" required
            value={actual} onChange={e => setActual(e.target.value)} />
        </div>
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="pass-nueva">Contraseña nueva</label>
          <CampoClave id="pass-nueva" className="gt-input" autoComplete="new-password" required
            value={nueva} onChange={e => setNueva(e.target.value)} />
        </div>
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="pass-repetir">Repetí la contraseña nueva</label>
          <CampoClave id="pass-repetir" className="gt-input" autoComplete="new-password" required
            value={repetir} onChange={e => setRepetir(e.target.value)} />
        </div>
        <ul className="gt-text-sm" style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Requisito ok={cumpleLargo} texto="Al menos 8 caracteres" />
          <Requisito ok={cumpleMezcla} texto="Letras y números" />
          <Requisito ok={coinciden} texto="Las dos contraseñas nuevas coinciden" />
        </ul>
        <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando || !actual || !cumpleLargo || !cumpleMezcla || !coinciden}>
          {guardando ? <><Spinner /> Guardando…</> : 'Cambiar contraseña'}
        </button>
      </form>

      {user?.rol === 'ADMIN' && (
        <p className="gt-text-muted gt-text-sm" style={{ marginTop: 14 }}>
          Para cambiarle la contraseña a un profesor (por ejemplo, si se la olvidó), andá a{' '}
          <Link to="/profesores">Profesores</Link> → Editar → “Nueva contraseña”. Se le cierran las sesiones abiertas.
        </p>
      )}
    </div>
  )
}
