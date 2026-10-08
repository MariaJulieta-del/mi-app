import Modal from '../../../shared/components/Modal'
import { GRUPOS_CATEGORIAS } from '../../ejercicios/services/ejercicioService'
import type { Maquina } from '../types/Maquina'

/** Alta o edición de una máquina */
export default function MaquinaFormModal({ editando, form, setForm, toggleGrupo, guardando, error, onGuardar, onCerrar }: {
  editando: boolean
  form: Omit<Maquina, 'id'>
  setForm: React.Dispatch<React.SetStateAction<Omit<Maquina, 'id'>>>
  toggleGrupo: (g: string) => void
  guardando: boolean
  error: string | null
  onGuardar: (ev: React.FormEvent) => void
  onCerrar: () => void
}) {
  return (
    <Modal titulo={editando ? 'Editar máquina' : 'Nueva máquina'} onCerrar={onCerrar} ancho={620}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cancelar</button>
        <button type="submit" form="form-maquina" className="gt-btn gt-btn-primary" disabled={guardando}>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear máquina'}
        </button>
      </>}>
      <form id="form-maquina" onSubmit={onGuardar}>
        {error && <div className="gt-alert gt-alert-error">{error}</div>}
        <div className="gt-maq-form-fila">
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="maq-nro">N° de máquina</label>
            <input id="maq-nro" className="gt-input" value={form.nroMaquina ?? ''} autoFocus={!editando}
              onChange={e => setForm(f => ({ ...f, nroMaquina: e.target.value }))} placeholder="Ej: 12" maxLength={20} />
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="maq-nombre">Nombre *</label>
            <input id="maq-nombre" className="gt-input" value={form.nombre} required maxLength={80}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Prensa 45°" />
          </div>
        </div>
        <p className="gt-hint" style={{ margin: '-4px 0 12px' }}>
          El número es el que está pegado en la máquina: el socio lo ve en su rutina para saber a cuál ir.
        </p>

        <div className="gt-form-group">
          <span className="gt-label">Músculos que trabaja</span>
          <div className="gt-maq-grupos-form">
            {GRUPOS_CATEGORIAS.map(cat => (
              <div key={cat.label}>
                <span className="gt-subtitulo">{cat.label}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cat.grupos.map(g => {
                    const sel = (form.grupos ?? []).includes(g)
                    return (
                      <button key={g} type="button" className={`gt-filtro-chip${sel ? ' activo' : ''}`} aria-pressed={sel}
                        onClick={() => toggleGrupo(g)}>{sel ? '✓ ' : ''}{g}</button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gt-form-group">
          <label className="gt-label" htmlFor="maq-desc">Descripción</label>
          <textarea id="maq-desc" className="gt-textarea" rows={2} maxLength={300} value={form.descripcion ?? ''}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Qué es y para qué sirve" />
        </div>
        <div className="gt-maq-form-fila dos">
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="maq-uso">Cómo se usa</label>
            <textarea id="maq-uso" className="gt-textarea" rows={3} maxLength={400} value={form.instruccionesUso ?? ''}
              onChange={e => setForm(f => ({ ...f, instruccionesUso: e.target.value }))} placeholder="Postura y recorrido correctos" />
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="maq-ajustes">Ajustes</label>
            <textarea id="maq-ajustes" className="gt-textarea" rows={3} maxLength={400} value={form.ajustes ?? ''}
              onChange={e => setForm(f => ({ ...f, ajustes: e.target.value }))} placeholder="Altura del asiento, respaldo, palancas" />
          </div>
        </div>
      </form>
    </Modal>
  )
}
