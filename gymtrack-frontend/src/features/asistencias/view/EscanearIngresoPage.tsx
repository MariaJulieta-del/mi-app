import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import QrScanner from 'qr-scanner'
import { ingresoPorQr } from '../services/asistenciaService'
import type { CheckinResultado } from '../hooks/useAcceso'
import { SEMAFORO } from '../utils/semaforo'
import { PasesMeter } from '../../membresias/components/MembresiaResumen'

type Estado = 'escaneando' | 'enviando' | 'listo' | 'error'

/** Acepta el link completo del QR (…/ingreso?c=GT1…) o el código suelto */
function extraerCodigo(texto: string): string | null {
  const t = texto.trim()
  if (t.startsWith('GT1.')) return t
  try {
    const c = new URL(t).searchParams.get('c')
    return c && c.startsWith('GT1.') ? c : null
  } catch {
    return null
  }
}

/**
 * El socio escanea el QR de recepción. Es el ÚNICO momento en que se registra
 * su ingreso y se consume un pase (entrar a la cuenta no gasta nada).
 */
export default function EscanearIngresoPage() {
  const [params, setParams] = useSearchParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const enviandoRef = useRef(false)
  const [estado, setEstado] = useState<Estado>(() => (params.get('c') ? 'enviando' : 'escaneando'))
  const [resultado, setResultado] = useState<CheckinResultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCamaraPermiso, setErrorCamara] = useState<string | null>(null)
  // La cámara del navegador solo funciona en páginas seguras (https)
  const sinHttps = !window.isSecureContext
  const errorCamara = sinHttps
    ? 'La cámara solo funciona si la app se abre con https://. Pedile al gimnasio que lo revise.'
    : errorCamaraPermiso

  const enviar = useCallback(async (codigo: string) => {
    if (enviandoRef.current) return
    enviandoRef.current = true
    scannerRef.current?.stop()
    setEstado('enviando'); setError(null)
    try {
      setResultado(await ingresoPorQr(codigo))
      setEstado('listo')
      navigator.vibrate?.(120)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'No se pudo registrar el ingreso. Probá de nuevo.')
      setEstado('error')
    } finally {
      enviandoRef.current = false
    }
  }, [])

  // Si llegó desde la cámara nativa del celular (link con ?c=…), registrar directo
  useEffect(() => {
    const c = params.get('c')
    if (c) {
      // Fuera del cuerpo del efecto: limpia la URL y registra el ingreso
      Promise.resolve().then(() => { setParams({}, { replace: true }); enviar(c) })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cámara: se enciende solo mientras se está escaneando
  useEffect(() => {
    if (estado !== 'escaneando' || !videoRef.current || sinHttps) return
    const scanner = new QrScanner(videoRef.current, r => {
      const codigo = extraerCodigo(r.data)
      if (codigo) enviar(codigo)
    }, { preferredCamera: 'environment', highlightScanRegion: true, highlightCodeOutline: true, returnDetailedScanResult: true })
    scannerRef.current = scanner
    scanner.start().catch(() =>
      setErrorCamara('No pudimos acceder a la cámara. Revisá que la app tenga permiso para usarla.'))
    return () => { scanner.destroy(); scannerRef.current = null }
  }, [estado, enviar, sinHttps])

  const reintentar = () => { setResultado(null); setError(null); setErrorCamara(null); setEstado('escaneando') }
  const sem = resultado ? SEMAFORO[resultado.estadoAcceso ?? (resultado.permitido ? 'VERDE' : 'ROJO')] : null

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>Registrar ingreso</h1>
        <Link to="/" className="gt-btn gt-btn-secondary gt-btn-sm">Volver</Link>
      </div>

      {estado === 'escaneando' && (
        <>
          <p className="gt-text-muted" style={{ marginTop: 0 }}>
            Apuntá la cámara al QR de la pantalla de recepción. El pase se descuenta recién cuando se lee el código.
          </p>
          {errorCamara ? (
            <div className="gt-alert gt-alert-error">{errorCamara}</div>
          ) : (
            <div className="gt-qr-visor">
              <video ref={videoRef} muted playsInline />
            </div>
          )}
        </>
      )}

      {estado === 'enviando' && (
        <div className="gt-card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 32, margin: 0 }}>⏳</p>
          <p className="gt-text-muted" style={{ margin: '8px 0 0' }}>Registrando tu ingreso…</p>
        </div>
      )}

      {estado === 'error' && (
        <div className="gt-card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 36, margin: 0 }}>😕</p>
          <p style={{ margin: '8px 0 16px', color: 'var(--text-primary)' }}>{error}</p>
          <button type="button" className="gt-btn gt-btn-primary" onClick={reintentar}>Escanear de nuevo</button>
        </div>
      )}

      {estado === 'listo' && resultado && sem && (
        <div className="gt-acceso-result" style={{ borderColor: sem.color }}>
          <div className="gt-acceso-head" style={{ background: sem.bg, flexDirection: 'column', textAlign: 'center', padding: '24px 18px' }}>
            <span style={{ fontSize: 56 }}>{sem.icono}</span>
            <div style={{ fontWeight: 800, fontSize: 20, color: sem.color }}>
              {resultado.permitido ? '¡Bienvenido/a!' : 'No pudimos registrar tu ingreso'}
            </div>
            <div style={{ color: 'var(--text-primary)' }}>{resultado.socioNombre}</div>
          </div>
          <div className="gt-acceso-body">
            {resultado.pasesUsados != null && resultado.permitido && (
              <PasesMeter compacto m={{
                paseLibre: !!resultado.paseLibre,
                pasesMensuales: resultado.pasesMensuales ?? null,
                pasesUsados: resultado.pasesUsados,
                pasesRestantes: resultado.pasesRestantes ?? null,
                cicloFin: '',
              }} />
            )}
            {resultado.observacion && (
              <div className="gt-text-sm" style={{ color: sem.color, background: sem.bg, borderRadius: 6, padding: '8px 10px' }}>
                {resultado.observacion}
              </div>
            )}
            <Link to="/" className="gt-btn gt-btn-primary" style={{ justifyContent: 'center' }}>
              {resultado.permitido ? 'Ver mi rutina' : 'Volver a mi cuenta'}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
