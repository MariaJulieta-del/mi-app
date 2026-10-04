import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import type { CodigoQr } from '../services/asistenciaService'

export interface IngresoReciente { nombre: string; hora: string; permitido: boolean }

/** Lo que va dentro del QR: un link, así también funciona con la cámara nativa del celular */
const contenidoQr = (codigo: string) => `${window.location.origin}/ingreso?c=${encodeURIComponent(codigo)}`

/**
 * QR de ingreso que se renueva solo + últimos ingresos.
 * Lo usan la pantalla del staff (/qr-ingreso) y la pantalla fija de recepción (/kiosco).
 */
export default function PantallaQr({ obtenerQr, obtenerUltimos, onNoAutorizado }: {
  obtenerQr: () => Promise<CodigoQr>
  obtenerUltimos: () => Promise<IngresoReciente[]>
  /** Se llama si el backend responde 401 (ej. pantalla desvinculada) */
  onNoAutorizado?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [restante, setRestante] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [ultimos, setUltimos] = useState<IngresoReciente[]>([])
  const [ventana, setVentana] = useState(30)

  // Pide el código vigente y programa el próximo pedido para cuando venza
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let vence = 0
    let activo = true

    const cargar = async () => {
      try {
        const qr = await obtenerQr()
        if (!activo) return
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, contenidoQr(qr.codigo), { width: 340, margin: 1, errorCorrectionLevel: 'M' })
        }
        vence = Date.now() + qr.expiraEnSeg * 1000
        setVentana(qr.ventanaSeg)
        setError(null)
        timer = setTimeout(cargar, qr.expiraEnSeg * 1000 + 300)
      } catch (err: unknown) {
        if (!activo) return
        if ((err as { status?: number; response?: { status?: number } })?.response?.status === 401
          || (err as { status?: number })?.status === 401) { onNoAutorizado?.(); return }
        setError('No se pudo obtener el código. Reintentando…')
        timer = setTimeout(cargar, 5000)
      }
    }
    cargar()

    const tick = setInterval(() => setRestante(Math.max(0, Math.ceil((vence - Date.now()) / 1000))), 250)
    return () => { activo = false; clearTimeout(timer); clearInterval(tick) }
  }, [obtenerQr, onNoAutorizado])

  // Últimos ingresos, para que el socio vea en pantalla que quedó registrado
  useEffect(() => {
    const cargar = () => obtenerUltimos().then(setUltimos).catch(() => {})
    cargar()
    const id = setInterval(cargar, 4000)
    return () => clearInterval(id)
  }, [obtenerUltimos])

  return (
    <div className="gt-qr-kiosco-main">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 30, color: 'var(--text-primary)' }}>Registrá tu ingreso</h1>
        <p className="gt-text-muted" style={{ margin: '0 0 20px', fontSize: 16 }}>
          Entrá a tu cuenta de GymTrack y tocá <strong>“Escanear QR de ingreso”</strong>
        </p>
        <div className="gt-qr-marco">
          <canvas ref={canvasRef} aria-label="Código QR de ingreso" />
        </div>
        <div className="gt-qr-progreso" aria-hidden>
          <div style={{ width: `${(restante / ventana) * 100}%` }} />
        </div>
        <p className="gt-text-muted gt-text-sm" style={{ margin: '6px 0 0' }}>
          {error ?? `El código se renueva en ${restante} s`}
        </p>
      </div>

      <div className="gt-card gt-qr-ultimos">
        <p className="gt-card-title" style={{ marginTop: 0 }}>Últimos ingresos</p>
        {ultimos.length === 0 ? (
          <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>Todavía nadie ingresó hoy.</p>
        ) : ultimos.map((a, i) => (
          <div key={`${a.nombre}-${i}`} className="gt-qr-ultimo">
            <span style={{ fontSize: 20 }}>{a.permitido ? '✅' : '🚫'}</span>
            <span style={{ flex: 1, fontWeight: 600, color: 'var(--text-primary)' }}>{a.nombre}</span>
            <span className="gt-text-muted gt-text-sm">{String(a.hora).slice(0, 5)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
