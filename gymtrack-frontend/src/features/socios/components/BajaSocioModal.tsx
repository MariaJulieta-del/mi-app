import { useState } from 'react'
import Modal from '../../../shared/components/Modal'
import { MOTIVOS_BAJA } from '../utils/motivosBaja'
import { Spinner } from '../../../shared/components/ui'

/** Pide el motivo antes de dar de baja a un socio (para después ver por qué se van) */
export default function BajaSocioModal({ nombre, onConfirmar, onCerrar }: {
  nombre: string
  onConfirmar: (motivo: string, detalle: string) => Promise<void>
  onCerrar: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [guardando, setGuardando] = useState(false)

  const confirmar = async () => {
    setGuardando(true)
    try { await onConfirmar(motivo, detalle) } finally { setGuardando(false) }
  }

  return (
    <Modal titulo={`Dar de baja a ${nombre}`} onCerrar={onCerrar} ancho={460}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cancelar</button>
        <button type="button" className="gt-btn gt-btn-danger" disabled={!motivo || guardando} onClick={confirmar}>
          {guardando ? <><Spinner /> Guardando…</> : 'Dar de baja'}
        </button>
      </>}>
      <p className="gt-text-muted gt-text-sm" style={{ marginTop: 0 }}>
        ¿Por qué se va? Queda registrado para ver en Reportes los motivos más comunes.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }} role="radiogroup" aria-label="Motivo de la baja">
        {MOTIVOS_BAJA.map(m => (
          <label key={m.valor} className="gt-text-sm" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
            border: `1.5px solid ${motivo === m.valor ? 'var(--accent)' : 'var(--border)'}`,
            background: motivo === m.valor ? 'var(--bg-surface-2)' : 'transparent',
          }}>
            <input type="radio" name="motivo-baja" value={m.valor} checked={motivo === m.valor} onChange={() => setMotivo(m.valor)} />
            {m.texto}
          </label>
        ))}
      </div>
      <label className="gt-label" htmlFor="detalle-baja">Comentario (opcional)</label>
      <textarea id="detalle-baja" className="gt-textarea" rows={2} maxLength={500} value={detalle}
        onChange={e => setDetalle(e.target.value)} placeholder="Ej: dice que vuelve en marzo, le subió la cuota…" />
    </Modal>
  )
}
