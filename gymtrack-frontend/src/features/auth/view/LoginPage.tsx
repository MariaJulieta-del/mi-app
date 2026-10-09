import { useLogin } from '../hooks/useLogin'
import { useMarca } from '../../../shared/context/MarcaContext'
import CampoClave from '../../../shared/components/CampoClave'

type Modo = 'staff' | 'socio'

export default function LoginPage() {
  const l = useLogin()
  const { marca } = useMarca()

  return (
    <div className="gt-login-page">
      <div className="gt-login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {marca.logo
            ? <img src={marca.logo} alt="" style={{ maxHeight: 72, maxWidth: 200, objectFit: 'contain', marginBottom: 10 }} />
            : <div style={{ fontSize: 40, marginBottom: 8 }}>🏋️</div>}
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{marca.nombre}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {l.modo === 'socio' ? 'Entrá a tu cuenta para ver tu rutina y registrar tu ingreso' : 'Panel del gimnasio'}
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-surface-2)', borderRadius: 8, padding: 4, marginBottom: 24, border: '1px solid var(--border)' }}>
          {(['socio', 'staff'] as Modo[]).map(m => (
            <button key={m} type="button" onClick={() => l.switchModo(m)}
              style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: l.modo === m ? 'var(--accent)' : 'transparent',
                color: l.modo === m ? 'var(--on-accent)' : 'var(--text-muted)' }}>
              {m === 'staff' ? '👤 Admin / Profesor' : '🪪 Soy socio'}
            </button>
          ))}
        </div>

        {l.error && <div className="gt-alert gt-alert-error" style={{ marginBottom: 16 }}>{l.error}</div>}

        {l.modo === 'staff' && (
          <form onSubmit={l.handleStaff}>
            <div className="gt-form-group" style={{ marginBottom: 16 }}>
              <label className="gt-label">Usuario</label>
              <input className="gt-input" type="text" value={l.username} onChange={e => l.setUsername(e.target.value)} placeholder="Ej: admin" autoFocus />
            </div>
            <div className="gt-form-group" style={{ marginBottom: 24 }}>
              <label className="gt-label">Contraseña</label>
              <CampoClave className="gt-input" value={l.password} onChange={e => l.setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" className="gt-btn gt-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={l.loading}>
              {l.loading ? 'Iniciando sesión...' : 'Ingresar'}
            </button>
          </form>
        )}

        {l.modo === 'socio' && (
          <form onSubmit={l.handleSocio}>
            <div className="gt-form-group" style={{ marginBottom: 8 }}>
              <label className="gt-label">Número de DNI</label>
              <input className="gt-input" type="text" inputMode="numeric" value={l.dni}
                onChange={e => l.setDni(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 38291047" autoFocus style={{ fontSize: 20, letterSpacing: 2, textAlign: 'center' }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 14, marginTop: 4 }}>
              Solo los números, sin puntos ni espacios
            </p>
            <div className="gt-form-group" style={{ marginBottom: 20 }}>
              <label className="gt-label">PIN</label>
              <CampoClave className="gt-input gt-pin-input" inputMode="numeric" autoComplete="current-password"
                maxLength={4} value={l.pin} placeholder="••••"
                onChange={e => l.setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
            </div>
            <button type="submit" className="gt-btn gt-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={l.loading}>
              {l.loading ? 'Ingresando…' : 'Entrar'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              ¿No tenés PIN o te lo olvidaste? Pedilo en recepción.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
