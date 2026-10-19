import Modal from '../../../shared/components/Modal'
import type { Maquina } from '../types/Maquina'
import type { CategoriaMantenimiento, MantenimientoRequest, TipoMantenimiento } from '../types/Mantenimiento'
import { Spinner } from '../../../shared/components/ui'

/** Registrar o editar un trabajo de mantenimiento */
export default function MantenimientoFormModal({ maquinas, form, setForm, editando, guardando, error, onGuardar, onCerrar }: {
  maquinas: Maquina[]
  form: MantenimientoRequest
  setForm: React.Dispatch<React.SetStateAction<MantenimientoRequest>>
  editando: boolean
  guardando: boolean
  error: string | null
  onGuardar: (ev: React.FormEvent) => void
  onCerrar: () => void
}) {
  const dias = form.fechaMantenimiento && form.fechaAlta
    ? Math.max(0, Math.round((new Date(form.fechaAlta).getTime() - new Date(form.fechaMantenimiento).getTime()) / 86400000))
    : null

  return (
    <Modal titulo={editando ? 'Editar mantenimiento' : 'Registrar mantenimiento'} onCerrar={onCerrar} ancho={620}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cancelar</button>
        <button type="submit" form="form-mant" className="gt-btn gt-btn-primary" disabled={guardando}>
          {guardando ? <><Spinner /> Guardando…</> : editando ? 'Guardar cambios' : 'Registrar'}
        </button>
      </>}>
      <form id="form-mant" onSubmit={onGuardar}>
        {error && <div className="gt-alert gt-alert-error">{error}</div>}
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="mant-maq">Máquina *</label>
          <select id="mant-maq" className="gt-select" value={form.maquinaId || ''} required
            onChange={e => setForm(f => ({ ...f, maquinaId: Number(e.target.value) }))}>
            <option value="">Elegí una máquina…</option>
            {maquinas.filter(m => m.activa).map(m => (
              <option key={m.id} value={m.id}>{m.nroMaquina ? `N° ${m.nroMaquina} · ` : ''}{m.nombre}</option>
            ))}
          </select>
        </div>
        <div className="gt-maq-form-fila dos">
          <div className="gt-form-group">
            <span className="gt-label">Estado</span>
            <div className="gt-segmentado" role="radiogroup" aria-label="Estado">
              {(['PENDIENTE', 'REALIZADO'] as TipoMantenimiento[]).map(t => (
                <button key={t} type="button" role="radio" aria-checked={form.tipo === t} className={form.tipo === t ? 'activo' : ''}
                  onClick={() => setForm(f => ({ ...f, tipo: t }))}>{t === 'PENDIENTE' ? 'Pendiente' : 'Hecho'}</button>
              ))}
            </div>
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="mant-cat">Tipo de trabajo</label>
            <select id="mant-cat" className="gt-select" value={form.categoria ?? ''}
              onChange={e => setForm(f => ({ ...f, categoria: (e.target.value || undefined) as CategoriaMantenimiento | undefined }))}>
              <option value="">Sin especificar</option>
              <option value="CORRECTIVO">Correctivo (se rompió)</option>
              <option value="PREVENTIVO">Preventivo (revisión)</option>
            </select>
          </div>
        </div>
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="mant-desc">Descripción *</label>
          <textarea id="mant-desc" className="gt-textarea" rows={3} required value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Qué se rompió o qué se hizo" />
        </div>
        <div className="gt-maq-form-fila dos">
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="mant-fecha">Fecha</label>
            <input id="mant-fecha" className="gt-input" type="date" value={form.fechaMantenimiento ?? ''}
              onChange={e => setForm(f => ({ ...f, fechaMantenimiento: e.target.value }))} />
          </div>
          {form.tipo === 'REALIZADO' && (
            <div className="gt-form-group">
              <label className="gt-label" htmlFor="mant-alta">Volvió a funcionar el</label>
              <input id="mant-alta" className="gt-input" type="date" value={form.fechaAlta ?? ''} min={form.fechaMantenimiento || undefined}
                onChange={e => setForm(f => ({ ...f, fechaAlta: e.target.value }))} />
              {dias != null && <span className="gt-hint">{dias} {dias === 1 ? 'día' : 'días'} fuera de servicio</span>}
            </div>
          )}
        </div>
        <div className="gt-maq-form-fila tres">
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="mant-tec">Técnico</label>
            <input id="mant-tec" className="gt-input" maxLength={200} value={form.tecnico ?? ''} onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))} />
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="mant-tel">Teléfono</label>
            <input id="mant-tel" className="gt-input" maxLength={60} inputMode="tel" value={form.telefonoTecnico ?? ''} onChange={e => setForm(f => ({ ...f, telefonoTecnico: e.target.value }))} />
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="mant-costo">Costo</label>
            <input id="mant-costo" className="gt-input" type="number" min="0" step="0.01" inputMode="decimal" value={form.costo ?? ''}
              onChange={e => setForm(f => ({ ...f, costo: e.target.value ? Number(e.target.value) : undefined }))} placeholder="$" />
          </div>
        </div>
        <div className="gt-form-group" style={{ marginBottom: 0 }}>
          <label className="gt-label" htmlFor="mant-obs">Observaciones</label>
          <textarea id="mant-obs" className="gt-textarea" rows={2} value={form.observaciones ?? ''}
            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Repuestos, garantía, etc." />
        </div>
      </form>
    </Modal>
  )
}
