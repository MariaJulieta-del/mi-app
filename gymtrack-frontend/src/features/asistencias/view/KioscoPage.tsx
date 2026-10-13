import { useCallback, useRef, useState } from 'react'
import { Monitor } from 'lucide-react'
import PantallaQr from '../components/PantallaQr'
import { tokenPantalla, guardarTokenPantalla, borrarTokenPantalla, qrPantalla, ultimosPantalla } from '../services/kioscoService'

/** Lee el token del link (#t=…) una sola vez y lo saca de la barra de direcciones */
function tomarTokenDelLink(): string | null {
  const m = window.location.hash.match(/[#&]t=([^&]+)/)
  if (m) {
    guardarTokenPantalla(decodeURIComponent(m[1]))
    window.history.replaceState(null, '', window.location.pathname)
  }
  return tokenPantalla()
}

/**
 * Pantalla fija de recepción (tablet o monitor).
 * No usa la sesión de ningún usuario: tiene su propio token, que solo sirve para mostrar
 * el QR de ingreso y los últimos ingresos. El admin la vincula y desvincula desde "QR de ingreso".
 */
export default function KioscoPage() {
  const [token, setToken] = useState<string | null>(() => tomarTokenDelLink())
  const contRef = useRef<HTMLDivElement>(null)

  const desvinculada = useCallback(() => { borrarTokenPantalla(); setToken(null) }, [])

  const pantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else contRef.current?.requestFullscreen().catch(() => {})
  }

  if (!token) {
    return (
      <div className="gt-login-page">
        <div className="gt-login-card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}><Monitor size={40} aria-hidden /></div>
          <h1 style={{ fontSize: 22, color: 'var(--text-primary)' }}>Pantalla de recepción</h1>
          <p className="gt-text-muted">
            Esta pantalla no está vinculada. El administrador tiene que entrar a
            <strong> Acceso → QR de ingreso → Pantallas de recepción</strong> y abrir acá el link que se genera.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={contRef} className="gt-qr-kiosco gt-kiosco-solo">
      <div className="gt-qr-kiosco-barra">
        <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 18 }}>GymTrack</span>
        <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={pantallaCompleta}>⛶ Pantalla completa</button>
      </div>
      <PantallaQr obtenerQr={qrPantalla} obtenerUltimos={ultimosPantalla} onNoAutorizado={desvinculada} />
    </div>
  )
}
