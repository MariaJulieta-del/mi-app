import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PinGenerado } from '../services/socioService'
import CampoClave from '../../../shared/components/CampoClave'

function Modal({ onCerrar, children, ancho = 420 }: { onCerrar: () => void; children: React.ReactNode; ancho?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onCerrar])
  return createPortal(
    <div className="gt-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCerrar() }}>
      <div className="gt-modal" role="dialog" aria-modal="true" style={{ maxWidth: ancho }}>{children}</div>
    </div>,
    document.body,
  )
}

/**
 * Muestra el PIN recién generado para entregárselo al socio.
 * No se vuelve a mostrar: en la base solo queda guardado de forma cifrada.
 */
export function PinEntregaModal({ nombre, dni, pin, onCerrar }: { nombre: string; dni: string; pin: string; onCerrar: () => void }) {
  return (
    <Modal onCerrar={onCerrar}>
      <h2 className="gt-modal-title">PIN de {nombre}</h2>
      <p className="gt-modal-body" style={{ marginBottom: 8 }}>
        Con su <strong>DNI {dni}</strong> y este PIN entra a la app para ver su rutina y registrar su ingreso con el QR.
      </p>
      <div className="gt-pin-grande" aria-label={`PIN ${pin.split('').join(' ')}`}>{pin}</div>
      <div className="gt-alert gt-alert-warning" style={{ marginBottom: 0 }}>
        Anotáselo o mostráselo ahora: <strong>no se vuelve a mostrar</strong>. Si lo pierde, generá uno nuevo desde su perfil.
        Puede cambiarlo desde su cuenta.
      </div>
      <div className="gt-modal-actions">
        <button className="gt-btn gt-btn-primary" onClick={onCerrar} autoFocus>Listo, ya lo entregué</button>
      </div>
    </Modal>
  )
}

/** Lista de PIN generados de una vez para los socios que no tenían (para imprimir y entregar) */
export function PinesPendientesModal({ pines, onCerrar }: { pines: PinGenerado[]; onCerrar: () => void }) {
  return (
    <Modal onCerrar={onCerrar} ancho={640}>
      <div className="gt-pines-imprimible">
        <h2 className="gt-modal-title">PIN de acceso de los socios</h2>
        {pines.length === 0 ? (
          <p className="gt-modal-body">Todos los socios activos ya tienen su PIN.</p>
        ) : (
          <>
            <p className="gt-modal-body">
              Se generaron {pines.length} PIN. Imprimí esta lista y entregale a cada socio el suyo.
              <strong> No se vuelve a mostrar.</strong>
            </p>
            <div className="gt-table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="gt-table">
                <thead><tr><th>Socio</th><th>DNI</th><th>PIN</th></tr></thead>
                <tbody>
                  {pines.map(p => (
                    <tr key={p.socioId}>
                      <td className="gt-fw-600">{p.nombre}</td>
                      <td>{p.dni}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>{p.pin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <div className="gt-modal-actions">
        {pines.length > 0 && <button className="gt-btn gt-btn-secondary" onClick={() => window.print()}>Imprimir</button>}
        <button className="gt-btn gt-btn-primary" onClick={onCerrar}>Cerrar</button>
      </div>
    </Modal>
  )
}

/** El socio cambia su PIN desde su cuenta */
export function CambiarPinModal({ onGuardar, onCerrar }: {
  onGuardar: (actual: string, nuevo: string) => Promise<void>; onCerrar: () => void
}) {
  const [actual, setActual] = useState('')
  const [nuevo, setNuevo] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const soloNumeros = (v: string) => v.replace(/\D/g, '').slice(0, 4)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nuevo.length !== 4) { setError('El PIN nuevo tiene que tener 4 números'); return }
    if (nuevo !== repetir) { setError('Los PIN nuevos no coinciden'); return }
    setGuardando(true); setError(null)
    try { await onGuardar(actual, nuevo) }
    catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo cambiar el PIN')
    } finally { setGuardando(false) }
  }

  const campo = (label: string, valor: string, set: (v: string) => void, auto = false) => (
    <div className="gt-form-group" style={{ marginBottom: 12 }}>
      <label className="gt-label" htmlFor="pinmodales-campo-1">{label}</label>
      <CampoClave id="pinmodales-campo-1" className="gt-input gt-pin-input" inputMode="numeric" autoComplete="off" maxLength={4}
        value={valor} onChange={e => set(soloNumeros(e.target.value))} autoFocus={auto} />
    </div>
  )

  return (
    <Modal onCerrar={onCerrar}>
      <form onSubmit={guardar}>
        <h2 className="gt-modal-title">Cambiar mi PIN</h2>
        {error && <div className="gt-alert gt-alert-error">{error}</div>}
        {campo('PIN actual', actual, setActual, true)}
        {campo('PIN nuevo (4 números)', nuevo, setNuevo)}
        {campo('Repetí el PIN nuevo', repetir, setRepetir)}
        <p className="gt-text-muted gt-text-sm" style={{ marginTop: 0 }}>Evitá PIN fáciles como 1234, 1111 o parte de tu DNI.</p>
        <div className="gt-modal-actions">
          <button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar PIN'}</button>
        </div>
      </form>
    </Modal>
  )
}
