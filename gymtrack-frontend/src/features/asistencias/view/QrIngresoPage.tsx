import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import PantallaQr from '../components/PantallaQr'
import { obtenerQrActual, obtenerUltimosIngresos } from '../services/asistenciaService'
import { listarPantallas, vincularPantalla, desvincularPantalla, linkPantalla, type Pantalla } from '../services/kioscoService'
import { useAuth } from '../../../shared/context/AuthContext'
import ConfirmModal from '../../../shared/components/ConfirmModal'

/** El admin vincula una tablet de recepción: se genera un link (y su QR) para abrir en ella */
function PantallasRecepcion() {
  const [pantallas, setPantallas] = useState<Pantalla[]>([])
  const [nombre, setNombre] = useState('Tablet recepción')
  const [nueva, setNueva] = useState<{ nombre: string; link: string; qr: string } | null>(null)
  const [quitar, setQuitar] = useState<Pantalla | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const cargar = () => listarPantallas().then(setPantallas).catch(() => {})
  useEffect(() => { cargar() }, [])

  const vincular = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const r = await vincularPantalla(nombre.trim())
      const link = linkPantalla(r.token)
      setNueva({ nombre: r.nombre, link, qr: await QRCode.toDataURL(link, { width: 220, margin: 1 }) })
      cargar()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo vincular')
    }
  }

  const copiar = async () => {
    if (!nueva) return
    try { await navigator.clipboard.writeText(nueva.link); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* sin portapapeles */ }
  }

  return (
    <div className="gt-card" style={{ marginTop: 24 }}>
      <p className="gt-card-title" style={{ marginTop: 0 }}>📺 Pantallas de recepción</p>
      <p className="gt-text-muted gt-text-sm" style={{ marginTop: -6 }}>
        Vinculá la tablet o el monitor de la entrada para que muestre el QR sin dejar tu sesión abierta.
        La pantalla solo puede mostrar el QR y los últimos ingresos.
      </p>

      {nueva ? (
        <div className="gt-pantalla-nueva">
          <img src={nueva.qr} alt="QR del link de la pantalla" width={180} height={180} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>“{nueva.nombre}” lista para vincular</p>
            <ol className="gt-text-sm" style={{ margin: '0 0 10px', paddingLeft: 18, color: 'var(--text-secondary)' }}>
              <li>En la tablet, escaneá este QR con la cámara (o abrí el link).</li>
              <li>Tocá “Pantalla completa”. Queda vinculada aunque se apague.</li>
            </ol>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={copiar}>{copiado ? '✓ Copiado' : 'Copiar link'}</button>
              <button type="button" className="gt-btn gt-btn-primary gt-btn-sm" onClick={() => setNueva(null)}>Listo</button>
            </div>
            <p className="gt-text-muted gt-text-sm" style={{ margin: '8px 0 0' }}>El link se muestra una sola vez.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={vincular} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="gt-form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
            <label className="gt-label">Nombre de la pantalla</label>
            <input className="gt-input" value={nombre} maxLength={60} onChange={e => setNombre(e.target.value)} />
          </div>
          <button type="submit" className="gt-btn gt-btn-primary">+ Vincular pantalla</button>
        </form>
      )}
      {error && <div className="gt-alert gt-alert-error" style={{ marginTop: 10 }}>{error}</div>}

      {pantallas.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {pantallas.map(p => (
            <div key={p.id} className="gt-hoy-fila">
              <div style={{ flex: 1 }}>
                <span className="gt-fw-600">{p.nombre}</span>
                <div className="gt-text-muted gt-text-sm">
                  {p.ultimoUso ? `Última conexión: ${new Date(p.ultimoUso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : 'Todavía no se conectó'}
                </div>
              </div>
              <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => setQuitar(p)}>Desvincular</button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={quitar !== null}
        title="Desvincular pantalla"
        message={`“${quitar?.nombre}” deja de mostrar el QR al instante. Para volver a usarla hay que vincularla de nuevo.`}
        confirmLabel="Desvincular"
        cancelLabel="Cancelar"
        danger
        onConfirm={async () => { if (quitar) await desvincularPantalla(quitar.id); setQuitar(null); cargar() }}
        onCancel={() => setQuitar(null)}
      />
    </div>
  )
}

/**
 * QR de ingreso en el dispositivo del staff. Para una pantalla fija en la entrada,
 * conviene vincularla (sección de abajo) en lugar de dejar esta sesión abierta.
 */
export default function QrIngresoPage() {
  const { user } = useAuth()
  const contRef = useRef<HTMLDivElement>(null)

  const pantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else contRef.current?.requestFullscreen().catch(() => {})
  }

  return (
    <>
      <div ref={contRef} className="gt-qr-kiosco">
        <div className="gt-qr-kiosco-barra">
          <Link to="/acceso" className="gt-btn gt-btn-secondary gt-btn-sm">← Control de acceso</Link>
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={pantallaCompleta}>⛶ Pantalla completa</button>
        </div>
        <PantallaQr obtenerQr={obtenerQrActual} obtenerUltimos={obtenerUltimosIngresos} />
      </div>
      {user?.rol === 'ADMIN' && <PantallasRecepcion />}
    </>
  )
}
