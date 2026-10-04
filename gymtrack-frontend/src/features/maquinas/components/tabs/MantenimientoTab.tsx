import type { Maquina } from '../../types/Maquina'
import type { Mantenimiento, MantenimientoRequest, TipoMantenimiento } from '../../types/Mantenimiento'
import { actualizarMantenimiento } from '../../services/mantenimientoService'

interface Props {
  maquinas: Maquina[]
  mantenimientos: Mantenimiento[]
  mantFiltrados: Mantenimiento[]
  mantForm: MantenimientoRequest
  setMantForm: React.Dispatch<React.SetStateAction<MantenimientoRequest>>
  mantEditId: number | null
  mantShowForm: boolean
  mantGuardando: boolean
  mantError: string | null
  setMantError: (v: string | null) => void
  mantFiltroMaquina: number | 'todas'
  setMantFiltroMaquina: (v: number | 'todas') => void
  mantFiltroTipo: TipoMantenimiento | 'todos'
  setMantFiltroTipo: (v: TipoMantenimiento | 'todos') => void
  abrirNuevoMant: () => void
  abrirEditarMant: (m: Mantenimiento) => void
  cancelarMant: () => void
  guardarMant: (ev: React.FormEvent) => void
  onEliminar: (id: number) => void
  cargarMantenimientos: () => Promise<void>
}

export default function MantenimientoTab({
  maquinas, mantenimientos, mantFiltrados,
  mantForm, setMantForm, mantEditId, mantShowForm, mantGuardando, mantError,
  mantFiltroMaquina, setMantFiltroMaquina, mantFiltroTipo, setMantFiltroTipo,
  abrirNuevoMant, abrirEditarMant, cancelarMant, guardarMant,
  onEliminar, cargarMantenimientos,
}: Props) {

  const pendientes = mantenimientos.filter(m => m.tipo === 'PENDIENTE')
  const maquinasFueraMap = new Map<number, { nombre: string; nro: string | undefined; registros: Mantenimiento[] }>()
  for (const p of pendientes) {
    if (!maquinasFueraMap.has(p.maquinaId)) {
      maquinasFueraMap.set(p.maquinaId, {
        nombre: p.maquinaNombre ?? `Máquina #${p.maquinaId}`,
        nro: p.maquinaNroMaquina ?? undefined,
        registros: [],
      })
    }
    maquinasFueraMap.get(p.maquinaId)!.registros.push(p)
  }
  const maquinasFuera = Array.from(maquinasFueraMap.values())

  return (
    <div style={{ border: '1.5px solid #D97706', borderRadius: '0 8px 8px 8px', background: 'var(--bg-surface)', padding: 20 }}>

      {/* Formulario */}
      {mantShowForm && (
        <div className="gt-card" style={{ marginBottom: 20, border: '2px solid #D97706' }}>
          <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            {mantEditId ? 'Editar registro de mantenimiento' : 'Registrar mantenimiento'}
          </p>
          {mantError && <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>{mantError}</div>}
          <form onSubmit={guardarMant}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Máquina *</label>
                  <select className="gt-input" value={mantForm.maquinaId || ''} required
                    onChange={e => setMantForm(f => ({ ...f, maquinaId: Number(e.target.value) }))}>
                    <option value="">Seleccioná una máquina…</option>
                    {maquinas.filter(m => m.activa).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nroMaquina ? `[${m.nroMaquina}] ` : ''}{m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Estado *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['PENDIENTE', 'REALIZADO'] as TipoMantenimiento[]).map(t => (
                      <button key={t} type="button"
                        onClick={() => setMantForm(f => ({ ...f, tipo: t }))}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                          border: '1.5px solid', fontWeight: mantForm.tipo === t ? 700 : 400, transition: 'all 0.1s',
                          background: mantForm.tipo === t ? (t === 'PENDIENTE' ? 'var(--yellow-bg)' : 'var(--green-bg)') : 'var(--bg-surface-2)',
                          color: mantForm.tipo === t ? (t === 'PENDIENTE' ? 'var(--yellow-text)' : 'var(--green-text)') : 'var(--text-muted)',
                          borderColor: mantForm.tipo === t ? (t === 'PENDIENTE' ? '#D97706' : 'var(--accent)') : 'var(--border)',
                        }}>
                        {t === 'PENDIENTE' ? '⏳ Pendiente' : '✅ Realizado'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Descripción *</label>
                  <textarea className="gt-textarea" value={mantForm.descripcion} required
                    onChange={e => setMantForm(f => ({ ...f, descripcion: e.target.value }))}
                    rows={3} placeholder="Describí el mantenimiento requerido o realizado…" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Fecha</label>
                  <input className="gt-input" type="date"
                    value={mantForm.fechaMantenimiento ?? ''}
                    onChange={e => setMantForm(f => ({ ...f, fechaMantenimiento: e.target.value }))} />
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Técnico / Responsable</label>
                  <input className="gt-input" value={mantForm.tecnico ?? ''}
                    onChange={e => setMantForm(f => ({ ...f, tecnico: e.target.value }))}
                    placeholder="Nombre del técnico o responsable…" maxLength={200} />
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Teléfono del técnico <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input className="gt-input" value={mantForm.telefonoTecnico ?? ''}
                    onChange={e => setMantForm(f => ({ ...f, telefonoTecnico: e.target.value }))}
                    placeholder="Ej: 351-1234567" maxLength={60} />
                </div>

                {mantForm.tipo === 'REALIZADO' && (
                  <div className="gt-form-group" style={{ margin: 0 }}>
                    <label className="gt-label">Fecha de alta (vuelta al servicio)</label>
                    <input className="gt-input" type="date"
                      value={mantForm.fechaAlta ?? ''}
                      min={mantForm.fechaMantenimiento || undefined}
                      onChange={e => setMantForm(f => ({ ...f, fechaAlta: e.target.value }))} />
                    {mantForm.fechaMantenimiento && mantForm.fechaAlta && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        ⏱ {Math.max(0, Math.round((new Date(mantForm.fechaAlta).getTime() - new Date(mantForm.fechaMantenimiento).getTime()) / 86400000))} días fuera de servicio
                      </span>
                    )}
                  </div>
                )}

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Costo (opcional)</label>
                  <input className="gt-input" type="number" min="0" step="0.01"
                    value={mantForm.costo ?? ''}
                    onChange={e => setMantForm(f => ({ ...f, costo: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="Ej: 5000" />
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Observaciones adicionales</label>
                  <textarea className="gt-textarea" value={mantForm.observaciones ?? ''}
                    onChange={e => setMantForm(f => ({ ...f, observaciones: e.target.value }))}
                    rows={2} placeholder="Notas adicionales, piezas a reponer, etc." />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="gt-btn gt-btn-primary" disabled={mantGuardando}>
                {mantGuardando ? 'Guardando…' : mantEditId ? 'Actualizar' : 'Registrar'}
              </button>
              <button type="button" className="gt-btn gt-btn-secondary" onClick={cancelarMant}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Estado:</span>
          {(['todos', 'PENDIENTE', 'REALIZADO'] as const).map(t => (
            <button key={t} onClick={() => setMantFiltroTipo(t)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid',
                fontWeight: mantFiltroTipo === t ? 700 : 400, transition: 'all .1s',
                background: mantFiltroTipo === t ? '#D97706' : 'var(--bg-surface-2)',
                color: mantFiltroTipo === t ? '#fff' : '#374151',
                borderColor: mantFiltroTipo === t ? '#D97706' : '#D1D5DB',
              }}>
              {t === 'todos' ? 'Todos' : t === 'PENDIENTE' ? '⏳ Pendientes' : '✅ Realizados'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Máquina:</span>
          <select className="gt-input" style={{ maxWidth: 200, padding: '5px 8px', fontSize: 13 }}
            value={mantFiltroMaquina}
            onChange={e => setMantFiltroMaquina(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}>
            <option value="todas">Todas</option>
            {maquinas.filter(m => m.activa).map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Panel: Máquinas fuera de servicio */}
      <div style={{
        marginBottom: 20, borderRadius: 10,
        border: maquinasFuera.length > 0 ? '2px solid var(--red)' : '1.5px solid var(--accent-border)',
        background: maquinasFuera.length > 0 ? 'var(--red-light)' : 'var(--green-bg)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
          padding: '12px 16px',
          background: maquinasFuera.length > 0 ? 'var(--red-light)' : 'var(--accent-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{maquinasFuera.length > 0 ? '🔴' : '🟢'}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: maquinasFuera.length > 0 ? 'var(--red-text)' : 'var(--green-text)' }}>
              {maquinasFuera.length > 0
                ? `${maquinasFuera.length} máquina${maquinasFuera.length !== 1 ? 's' : ''} fuera de servicio`
                : 'Todas las máquinas operativas'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>
              ⏳ {mantenimientos.filter(m => m.tipo === 'PENDIENTE').length} pendiente{mantenimientos.filter(m => m.tipo === 'PENDIENTE').length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--green-text)', fontWeight: 600 }}>
              ✅ {mantenimientos.filter(m => m.tipo === 'REALIZADO').length} realizados
            </span>
          </div>
        </div>

        {maquinasFuera.length > 0 && (
          <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {maquinasFuera.map(mf => (
              <div key={mf.nombre} style={{
                background: 'var(--bg-surface)', border: '1.5px solid var(--red)', borderRadius: 10,
                padding: '10px 14px', minWidth: 200, maxWidth: 260,
                boxShadow: '0 2px 6px rgba(220,38,38,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>🔧</span>
                  <div>
                    {mf.nro && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                        background: 'var(--red)', color: '#fff', borderRadius: 8,
                        padding: '1px 6px', marginRight: 5,
                      }}>#{mf.nro}</span>
                    )}
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{mf.nombre}</span>
                  </div>
                </div>
                {mf.registros.map(r => (
                  <div key={r.id} style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2, marginBottom: 2 }}>
                    • {r.descripcion.length > 60 ? r.descripcion.slice(0, 60) + '…' : r.descripcion}
                    {r.fechaMantenimiento && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: 5 }}>({r.fechaMantenimiento.slice(0, 10)})</span>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setMantFiltroMaquina(mf.registros[0].maquinaId)
                    setMantFiltroTipo('PENDIENTE')
                  }}
                  style={{
                    marginTop: 8, background: 'none', border: '1px solid var(--red)',
                    color: 'var(--red)', borderRadius: 6, padding: '3px 10px', fontSize: 11,
                    cursor: 'pointer', width: '100%', fontWeight: 600,
                  }}>
                  Ver registros →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista */}
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)' }}>
        {mantFiltrados.length} registro{mantFiltrados.length !== 1 ? 's' : ''} de mantenimiento
      </p>

      {mantFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 28, marginBottom: 6 }}>🔧</p>
          <p style={{ margin: 0, marginBottom: 12 }}>
            {mantenimientos.length === 0
              ? 'No hay registros de mantenimiento todavía.'
              : 'No hay registros que coincidan con los filtros.'}
          </p>
          {mantenimientos.length === 0 && (
            <button className="gt-btn gt-btn-primary" onClick={abrirNuevoMant}>
              + Registrar primer mantenimiento
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mantFiltrados.map(m => (
            <div key={m.id} style={{
              border: `1.5px solid ${m.tipo === 'PENDIENTE' ? '#D97706' : 'var(--accent-border)'}`,
              borderRadius: 10, padding: '14px 16px',
              background: m.tipo === 'PENDIENTE' ? 'var(--yellow-bg)' : 'var(--green-bg)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                      background: m.tipo === 'PENDIENTE' ? 'var(--yellow-bg)' : 'var(--green-bg)',
                      color: m.tipo === 'PENDIENTE' ? 'var(--yellow-text)' : 'var(--green-text)',
                      border: `1px solid ${m.tipo === 'PENDIENTE' ? '#FDE68A' : '#6EE7B7'}`,
                    }}>
                      {m.tipo === 'PENDIENTE' ? '⏳ PENDIENTE' : '✅ REALIZADO'}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {m.maquinaNroMaquina ? `[${m.maquinaNroMaquina}] ` : ''}{m.maquinaNombre}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {m.descripcion}
                  </p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {m.fechaMantenimiento && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        📅 {new Date(m.fechaMantenimiento + 'T00:00:00').toLocaleDateString('es-AR')}
                      </span>
                    )}
                    {m.fechaAlta && (
                      <span style={{ fontSize: 12, color: 'var(--green-text)', fontWeight: 600 }}>
                        🟢 Alta: {new Date(m.fechaAlta + 'T00:00:00').toLocaleDateString('es-AR')}
                        {m.diasInactividad != null && (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({m.diasInactividad} días)</span>
                        )}
                      </span>
                    )}
                    {m.tecnico && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        👤 {m.tecnico}
                        {m.telefonoTecnico && (
                          <span style={{ marginLeft: 4, color: 'var(--blue-text)' }}>📞 {m.telefonoTecnico}</span>
                        )}
                      </span>
                    )}
                    {m.costo != null && m.costo > 0 && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        💰 ${Number(m.costo).toLocaleString('es-AR')}
                      </span>
                    )}
                    {m.observaciones && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        📝 {m.observaciones}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {m.tipo === 'PENDIENTE' && (
                    <button
                      className="gt-btn gt-btn-secondary"
                      style={{ fontSize: 12, color: 'var(--green-text)', borderColor: '#16A34A' }}
                      onClick={() => actualizarMantenimiento(m.id!, { tipo: 'REALIZADO' }).then(cargarMantenimientos)}>
                      ✅ Marcar realizado
                    </button>
                  )}
                  <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
                    onClick={() => abrirEditarMant(m)}>
                    Editar
                  </button>
                  <button className="gt-btn gt-btn-danger" style={{ fontSize: 12 }}
                    onClick={() => onEliminar(m.id!)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
