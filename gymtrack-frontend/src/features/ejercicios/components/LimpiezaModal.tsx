import { useEffect, useState } from 'react'
import Modal from '../../../shared/components/Modal'
import { mensajeError } from '../../../shared/utils/errores'
import { vistaLimpieza, limpiarEjercicios, type VistaLimpieza } from '../services/ejercicioService'
import { Spinner } from '../../../shared/components/ui'

/**
 * Limpieza del catálogo propio: borra los ejercicios desactivados que ninguna rutina usa.
 * Los que están en rutinas se conservan, y los posibles duplicados se muestran para revisarlos a mano.
 */
export default function LimpiezaModal({ onListo, onCerrar }: { onListo: (borrados: number) => void; onCerrar: () => void }) {
  const [vista, setVista] = useState<VistaLimpieza | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const [borrando, setBorrando] = useState(false)

  useEffect(() => { vistaLimpieza().then(setVista).catch(err => setError(mensajeError(err, 'No se pudo revisar el catálogo'))) }, [])

  const borrar = async () => {
    setBorrando(true); setError(null)
    try { onListo(await limpiarEjercicios()) }
    catch (err: unknown) { setError(mensajeError(err, 'No se pudieron borrar')); setBorrando(false) }
  }

  const n = vista?.borrables.length ?? 0

  return (
    <Modal titulo="Limpiar ejercicios viejos" onCerrar={onCerrar} ancho={640}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cerrar</button>
        {n > 0 && (confirmar ? (
          <button type="button" className="gt-btn gt-btn-danger" disabled={borrando} onClick={borrar}>
            {borrando ? <><Spinner /> Borrando…</> : `Sí, borrar ${n} definitivamente`}
          </button>
        ) : (
          <button type="button" className="gt-btn gt-btn-primary" onClick={() => setConfirmar(true)}>Borrar {n} ejercicios</button>
        ))}
      </>}>
      {error && <div className="gt-alert gt-alert-error">{error}</div>}
      {!vista && !error && <p className="gt-text-muted">Revisando el catálogo…</p>}

      {vista && (
        <>
          <p className="gt-text-sm" style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
            Tenés <strong>{vista.total}</strong> ejercicios propios. Solo se borran los <strong>desactivados que ninguna rutina usa</strong>:
            ninguna rutina pierde ejercicios.
          </p>
          {confirmar && (
            <div className="gt-alert gt-alert-warning">
              Esto no se puede deshacer. Si dudás de alguno, cerrá esta ventana y reactivalo en “Mis ejercicios”.
            </div>
          )}

          <p className="gt-stat-label" style={{ margin: '12px 0 6px' }}>Se van a borrar ({n})</p>
          {n === 0 ? <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>No hay ejercicios viejos para borrar.</p> : (
            <div className="gt-limpieza-lista">
              {vista.borrables.map(e => <span key={e.id} className="gt-chip gt-chip-neutro">{e.nombre}</span>)}
            </div>
          )}

          {vista.desactivadosEnUso.length > 0 && (
            <>
              <p className="gt-stat-label" style={{ margin: '16px 0 6px' }}>Desactivados que se conservan ({vista.desactivadosEnUso.length})</p>
              <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 6px' }}>Están en alguna rutina: no aparecen para elegir, pero las rutinas los siguen mostrando.</p>
              <div className="gt-limpieza-lista">
                {vista.desactivadosEnUso.map(e => <span key={e.id} className="gt-chip gt-chip-neutro">{e.nombre}</span>)}
              </div>
            </>
          )}

          {vista.posiblesDuplicados.length > 0 && (
            <>
              <p className="gt-stat-label" style={{ margin: '16px 0 6px' }}>Posibles duplicados ({vista.posiblesDuplicados.length})</p>
              <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 6px' }}>Nombres casi iguales. Revisalos y desactivá el que sobre (después se puede borrar acá).</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {vista.posiblesDuplicados.map((g, i) => (
                  <div key={i} className="gt-limpieza-grupo">
                    {g.map(e => (
                      <span key={e.id} className="gt-chip gt-chip-neutro" style={{ opacity: e.activo ? 1 : .6 }}>
                        {e.nombre}{!e.activo && ' (desactivado)'}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}
