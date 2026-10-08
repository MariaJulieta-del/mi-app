import { CircleAlert, Wrench } from 'lucide-react'
import Modal from '../../../shared/components/Modal'
import type { Maquina } from '../types/Maquina'
import NroMaquina from './NroMaquina'

/** Reporte rápido: algo se rompió (correctivo) o hay que revisarla (preventivo) */
export default function ReportarModal({ maquina, tipo, setTipo, descripcion, setDescripcion, costo, setCosto, guardando, error, onGuardar, onCerrar }: {
  maquina: Maquina
  tipo: 'PREVENTIVO' | 'CORRECTIVO'
  setTipo: (t: 'PREVENTIVO' | 'CORRECTIVO') => void
  descripcion: string
  setDescripcion: (v: string) => void
  costo: string
  setCosto: (v: string) => void
  guardando: boolean
  error: string | null
  onGuardar: () => void
  onCerrar: () => void
}) {
  return (
    <Modal ancho={480} onCerrar={onCerrar}
      titulo={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><NroMaquina nro={maquina.nroMaquina} chico />Reportar · {maquina.nombre}</span>}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cancelar</button>
        <button type="button" className={`gt-btn ${tipo === 'CORRECTIVO' ? 'gt-btn-danger' : 'gt-btn-primary'}`} disabled={guardando || !descripcion.trim()} onClick={onGuardar}>
          {guardando ? 'Guardando…' : tipo === 'CORRECTIVO' ? 'Reportar falla' : 'Pedir revisión'}
        </button>
      </>}>
      {error && <div className="gt-alert gt-alert-error">{error}</div>}
      <div className="gt-reporte-tipos" role="radiogroup" aria-label="Tipo de reporte">
        <button type="button" role="radio" aria-checked={tipo === 'CORRECTIVO'} className={`gt-reporte-tipo falla${tipo === 'CORRECTIVO' ? ' activo' : ''}`} onClick={() => setTipo('CORRECTIVO')}>
          <CircleAlert size={20} aria-hidden />
          <strong>Algo se rompió</strong>
          <span>No funciona o funciona mal</span>
        </button>
        <button type="button" role="radio" aria-checked={tipo === 'PREVENTIVO'} className={`gt-reporte-tipo${tipo === 'PREVENTIVO' ? ' activo' : ''}`} onClick={() => setTipo('PREVENTIVO')}>
          <Wrench size={20} aria-hidden />
          <strong>Hay que revisarla</strong>
          <span>Lubricar, ajustar, limpiar</span>
        </button>
      </div>
      <div className="gt-form-group">
        <label className="gt-label" htmlFor="rep-desc">¿Qué pasa?</label>
        <textarea id="rep-desc" className="gt-textarea" rows={3} autoFocus value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder={tipo === 'CORRECTIVO' ? 'Ej: se cortó el cable, no traba el asiento…' : 'Ej: hace ruido, necesita aceite…'} />
      </div>
      <div className="gt-form-group" style={{ marginBottom: 0 }}>
        <label className="gt-label" htmlFor="rep-costo">Costo (si ya se gastó algo)</label>
        <input id="rep-costo" className="gt-input" type="number" min="0" step="0.01" inputMode="decimal" style={{ maxWidth: 180 }}
          value={costo} onChange={e => setCosto(e.target.value)} placeholder="$ opcional" />
      </div>
    </Modal>
  )
}
