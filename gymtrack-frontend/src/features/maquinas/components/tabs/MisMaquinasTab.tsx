import type { Maquina } from '../../types/Maquina'
import type { Ejercicio } from '../../../ejercicios/services/ejercicioService'
import type { MaquinaEstadisticas } from '../../types/Mantenimiento'
import { GRUPOS_CATEGORIAS } from '../../../ejercicios/services/ejercicioService'

interface Props {
  maquinas: Maquina[]
  ejercicios: Ejercicio[]
  filtradas: Maquina[]
  busqueda: string
  setBusqueda: (v: string) => void
  filtroGrupo: string
  setFiltroGrupo: (v: string) => void
  verInactivas: boolean
  setVerInactivas: (v: boolean) => void
  showForm: boolean
  form: Omit<Maquina, 'id'>
  setForm: React.Dispatch<React.SetStateAction<Omit<Maquina, 'id'>>>
  editandoId: number | null
  guardando: boolean
  error: string | null
  setError: (v: string | null) => void
  expandedId: number | null
  statsCache: Record<number, MaquinaEstadisticas>
  loadingStats: number | null
  abrirNuevo: () => void
  abrirEditar: (m: Maquina) => void
  cancelar: () => void
  guardar: (ev: React.FormEvent) => void
  toggleActiva: (m: Maquina) => void
  toggleExpand: (id: number) => void
  toggleGrupoForm: (g: string) => void
  ejerciciosCompatibles: (grupos: string[]) => Ejercicio[]
  onIrCatalogo: () => void
  // Reportar
  reportarId: number | null
  reportarTipo: 'PREVENTIVO' | 'CORRECTIVO' | null
  reportarDesc: string
  setReportarDesc: (v: string) => void
  reportarCosto: string
  setReportarCosto: (v: string) => void
  reportarGuardando: boolean
  reportarError: string | null
  abrirMenuReportar: (maquinaId: number) => void
  abrirReportar: (maquinaId: number, tipo: 'PREVENTIVO' | 'CORRECTIVO') => void
  cerrarReportar: () => void
  submitReportar: () => void
}

export default function MisMaquinasTab({
  filtradas,
  busqueda, setBusqueda, filtroGrupo, setFiltroGrupo, verInactivas, setVerInactivas,
  showForm, form, setForm, editandoId, guardando, error,
  expandedId, statsCache, loadingStats,
  abrirEditar, cancelar, guardar,
  toggleActiva, toggleExpand, toggleGrupoForm, ejerciciosCompatibles, onIrCatalogo,
  reportarId, reportarTipo, reportarDesc, setReportarDesc,
  reportarCosto, setReportarCosto,
  reportarGuardando, reportarError, abrirMenuReportar, abrirReportar, cerrarReportar, submitReportar,
}: Props) {
  return (
    <div style={{ border: '1.5px solid #D97706', borderRadius: '0 8px 8px 8px', background: 'var(--bg-surface)', padding: 20 }}>

      {/* ── Formulario inline ── */}
      {showForm && (
        <div className="gt-card" style={{ marginBottom: 20, border: '2px solid #D97706' }}>
          <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            {editandoId ? 'Editar máquina' : 'Nueva máquina'}
          </p>
          {error && <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>{error}</div>}

          <form onSubmit={guardar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Col izquierda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                  <div className="gt-form-group" style={{ margin: 0 }}>
                    <label className="gt-label">Nro. Máquina <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                    <input id="maq-nro" className="gt-input" value={form.nroMaquina ?? ''}
                      onChange={e => setForm(f => ({ ...f, nroMaquina: e.target.value || '' }))}
                      placeholder="Ej: M-01" maxLength={20} />
                  </div>
                  <div className="gt-form-group" style={{ margin: 0 }}>
                    <label className="gt-label">Nombre *</label>
                    <input className="gt-input" value={form.nombre}
                      onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder="Ej: Prensa de piernas" maxLength={80} required />
                  </div>
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Descripción</label>
                  <textarea className="gt-textarea" value={form.descripcion ?? ''}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    rows={2} maxLength={300} placeholder="Descripción general de la máquina…" />
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Instrucciones de uso</label>
                  <textarea className="gt-textarea" value={form.instruccionesUso ?? ''}
                    onChange={e => setForm(f => ({ ...f, instruccionesUso: e.target.value }))}
                    rows={2} maxLength={400} placeholder="Cómo usar correctamente la máquina…" />
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Ajustes y configuración</label>
                  <textarea className="gt-textarea" value={form.ajustes ?? ''}
                    onChange={e => setForm(f => ({ ...f, ajustes: e.target.value }))}
                    rows={2} maxLength={400} placeholder="Cómo ajustar asientos, pesos, palancas…" />
                </div>
              </div>

              {/* Col derecha — grupos musculares */}
              <div className="gt-form-group" style={{ margin: 0 }}>
                <label className="gt-label">Grupos musculares que trabaja</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {GRUPOS_CATEGORIAS.map(cat => (
                    <div key={cat.label}>
                      <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {cat.label}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {cat.grupos.map(g => {
                          const sel = (form.grupos ?? []).includes(g)
                          return (
                            <button key={g} type="button" onClick={() => toggleGrupoForm(g)}
                              style={{
                                padding: '3px 10px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                                border: '1.5px solid', transition: 'all 0.1s',
                                borderColor: sel ? '#D97706' : '#D1D5DB',
                                background: sel ? 'var(--yellow-bg)' : 'var(--bg-surface-2)',
                                color: sel ? 'var(--yellow-text)' : 'var(--text-muted)',
                                fontWeight: sel ? 700 : 400,
                              }}>
                              {g}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {(form.grupos ?? []).length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Ejercicios que usarían esta máquina
                    </p>
                    {ejerciciosCompatibles(form.grupos ?? []).length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                        Ningún ejercicio coincide aún.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {ejerciciosCompatibles(form.grupos ?? []).map(e => (
                          <span key={e.id} style={{ fontSize: 12, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                            💪 {e.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editandoId ? 'Actualizar' : 'Crear máquina'}
              </button>
              <button type="button" className="gt-btn gt-btn-secondary" onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Barra de filtros ── */}
      <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--bg-surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <input className="gt-input" style={{ flex: 1, minWidth: 160 }}
            placeholder="Buscar por nombre o número…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={verInactivas} onChange={e => setVerInactivas(e.target.checked)} />
            Ver inactivas
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => setFiltroGrupo('')} type="button"
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                fontWeight: !filtroGrupo ? 700 : 400,
                background: !filtroGrupo ? '#D97706' : 'var(--bg-surface-2)',
                color: !filtroGrupo ? '#fff' : 'var(--text-secondary)',
                borderColor: !filtroGrupo ? '#D97706' : '#D1D5DB',
              }}>
              Todos
            </button>
          </div>
          {GRUPOS_CATEGORIAS.map(cat => (
            <div key={cat.label} style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 88, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {cat.label}
              </span>
              {cat.grupos.map(g => (
                <button key={g} type="button" onClick={() => setFiltroGrupo(g === filtroGrupo ? '' : g)}
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                    fontWeight: filtroGrupo === g ? 700 : 400,
                    background: filtroGrupo === g ? '#D97706' : 'var(--yellow-bg)',
                    color: filtroGrupo === g ? '#fff' : 'var(--yellow-text)',
                    borderColor: filtroGrupo === g ? '#D97706' : '#FDE68A',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)' }}>
        {filtradas.length} máquina{filtradas.length !== 1 ? 's' : ''}
      </p>

      {filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 28, marginBottom: 6 }}>⚙️</p>
          <p style={{ margin: 0, marginBottom: 10 }}>No hay máquinas guardadas todavía.</p>
          <button className="gt-btn gt-btn-secondary" onClick={onIrCatalogo} style={{ fontSize: 13 }}>
            📚 Ver catálogo de máquinas
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtradas.map(m => {
            const isExp = expandedId === m.id
            const ejsComp = ejerciciosCompatibles(m.grupos ?? [])
            const stats = statsCache[m.id!]
            const isLoading = loadingStats === m.id
            const UMBRAL_REPS = 5
            const UMBRAL_COSTO = 50000
            const convieneCambiar = stats && (stats.totalReparaciones >= UMBRAL_REPS || Number(stats.costoTotal) >= UMBRAL_COSTO)

            return (
              <div key={m.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                {/* Fila principal */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  background: isExp ? 'var(--yellow-bg)' : (m.activa ? 'var(--bg-surface)' : 'var(--bg-surface-2)'),
                  opacity: m.activa ? 1 : 0.65, cursor: 'pointer', transition: 'background 0.1s',
                }}
                  onClick={() => toggleExpand(m.id!)}
                  onMouseEnter={ev => { if (!isExp) ev.currentTarget.style.background = 'var(--bg-surface-2)' }}
                  onMouseLeave={ev => { if (!isExp) ev.currentTarget.style.background = m.activa ? 'var(--bg-surface)' : 'var(--bg-surface-2)' }}>

                  <div style={{
                    width: 48, height: 44, borderRadius: 7, background: 'var(--yellow-bg)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: '1px solid #FDE68A',
                  }}>
                    <span style={{ fontSize: 9, color: 'var(--yellow-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>NRO</span>
                    <span style={{ fontSize: 13, color: 'var(--yellow-text)', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>{m.nroMaquina || '—'}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{m.nombre}</span>
                      {!m.activa && (
                        <span style={{ fontSize: 10, background: 'var(--red-light)', color: 'var(--red)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>INACTIVA</span>
                      )}
                    </div>
                    {m.grupos && m.grupos.length > 0 && (
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                        {m.grupos.map(g => (
                          <span key={g} style={{ fontSize: 11, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {ejsComp.length > 0 && (
                    <span style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 6, padding: '2px 8px', fontWeight: 600, flexShrink: 0 }}>
                      💪 {ejsComp.length} ejerc.
                    </span>
                  )}

                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, userSelect: 'none' }}>
                    {isExp ? '▲' : '▼'}
                  </span>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}
                    onClick={ev => ev.stopPropagation()}>
                    <button className="gt-btn gt-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => abrirEditar(m)}>
                      Editar
                    </button>
                    {/* Reportar: 3 estados → botón | sub-menu | form (ver inline abajo) */}
                    {reportarId === m.id ? (
                      <button className="gt-btn gt-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={cerrarReportar}>
                        ✕ Cancelar
                      </button>
                    ) : (
                      <button className="gt-btn gt-btn-secondary" style={{ padding: '4px 10px', fontSize: 12, borderColor: '#D97706', color: '#92400E' }}
                        onClick={() => abrirMenuReportar(m.id!)}>
                        🔧 Reportar
                      </button>
                    )}
                    <button className={`gt-btn ${m.activa ? 'gt-btn-danger' : 'gt-btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => toggleActiva(m)}>
                      {m.activa ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>

                {/* ── Panel "Reportar" ── */}
                {reportarId === m.id && (
                  <div style={{
                    padding: '12px 14px', background: '#FFFBEB',
                    borderTop: '1px solid #FDE68A',
                  }}
                    onClick={ev => ev.stopPropagation()}>
                    {reportarTipo === null ? (
                      /* Sub-menú: elegir tipo */
                      <div>
                        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#78350F' }}>
                          ¿Qué tipo de reporte es?
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                            background: '#FEF9C3', color: '#92400E', border: '2px solid #FDE68A',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                          }}
                            onClick={() => abrirReportar(m.id!, 'PREVENTIVO')}>
                            ⚠️ Preventiva
                            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>— mantenimiento programado</span>
                          </button>
                          <button style={{
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                            background: '#FEE2E2', color: '#991B1B', border: '2px solid #FECACA',
                            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                          }}
                            onClick={() => abrirReportar(m.id!, 'CORRECTIVO')}>
                            🔴 Correctiva
                            <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>— algo se rompió</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Formulario de descripción */
                      <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700,
                          color: reportarTipo === 'PREVENTIVO' ? '#92400E' : '#991B1B' }}>
                          {reportarTipo === 'PREVENTIVO' ? '⚠️ Reporte preventivo' : '🔴 Reporte correctivo'} — {m.nombre}
                        </p>
                        {reportarError && (
                          <div style={{ marginBottom: 8, padding: '6px 10px', background: '#FEE2E2', borderRadius: 6, fontSize: 12, color: '#991B1B', border: '1px solid #FECACA' }}>
                            {reportarError}
                          </div>
                        )}
                        <textarea
                          className="gt-textarea"
                          rows={2}
                          autoFocus
                          value={reportarDesc}
                          onChange={e => setReportarDesc(e.target.value)}
                          placeholder={reportarTipo === 'PREVENTIVO'
                            ? 'Ej: Necesita aceite la polea, revisar correas…'
                            : 'Ej: Se rompió la prensa, no carga peso correctamente…'}
                          style={{ marginBottom: 10, fontSize: 13 }}
                        />
                        {/* Costo opcional */}
                        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>💰 ¿Se gastó dinero?</span>
                          <input
                            className="gt-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={reportarCosto}
                            onChange={e => setReportarCosto(e.target.value)}
                            placeholder="Monto (opcional)"
                            style={{ maxWidth: 150, fontSize: 13 }}
                          />
                          {reportarCosto && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>$</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="gt-btn gt-btn-primary" style={{ fontSize: 13, padding: '5px 14px' }}
                            onClick={submitReportar} disabled={reportarGuardando}>
                            {reportarGuardando ? 'Guardando…' : 'Registrar reporte'}
                          </button>
                          <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13, padding: '5px 10px' }}
                            onClick={() => abrirMenuReportar(m.id!)}>
                            ← Volver
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Detalle expandido */}
                {isExp && (
                  <div style={{ padding: '12px 14px 14px 74px', background: 'var(--bg-surface-2)', borderTop: '1px solid var(--border)' }}>
                    {m.descripcion && (
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.descripcion}</p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                      {m.instruccionesUso && (
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Instrucciones</p>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.instruccionesUso}</p>
                        </div>
                      )}
                      {m.ajustes && (
                        <div>
                          <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ajustes</p>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.ajustes}</p>
                        </div>
                      )}
                    </div>

                    {/* Historial clínico */}
                    <div style={{
                      background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8,
                      padding: '12px 14px', marginBottom: 12,
                    }}>
                      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        🏥 Historial clínico
                      </p>
                      {isLoading ? (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Cargando estadísticas…</p>
                      ) : stats ? (
                        <>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: convieneCambiar ? 10 : 0 }}>
                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                              <div style={{ fontSize: 22, fontWeight: 800, color: stats.totalReparaciones >= UMBRAL_REPS ? '#DC2626' : 'var(--text-primary)' }}>
                                {stats.totalReparaciones}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>reparaciones</div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 100 }}>
                              <div style={{ fontSize: 22, fontWeight: 800, color: Number(stats.costoTotal) >= UMBRAL_COSTO ? '#DC2626' : 'var(--text-primary)' }}>
                                ${Number(stats.costoTotal).toLocaleString('es-AR')}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>costo total</div>
                            </div>
                            {stats.diasInactividadTotal > 0 && (
                              <div style={{ textAlign: 'center', minWidth: 80 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.diasInactividadTotal}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>días fuera de servicio</div>
                              </div>
                            )}
                            {stats.diasInactividadPromedio > 0 && (
                              <div style={{ textAlign: 'center', minWidth: 80 }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.diasInactividadPromedio.toFixed(1)}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>días prom. por arreglo</div>
                              </div>
                            )}
                          </div>
                          {convieneCambiar && (
                            <div style={{
                              background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6,
                              padding: '8px 12px', fontSize: 12, color: 'var(--red-text)', fontWeight: 600,
                            }}>
                              ⚠️ Esta máquina tuvo {stats.totalReparaciones} reparaciones con un costo acumulado de ${Number(stats.costoTotal).toLocaleString('es-AR')}. Puede convenir evaluar su reemplazo.
                            </div>
                          )}
                          {stats.totalReparaciones === 0 && (
                            <p style={{ fontSize: 12, color: 'var(--green-text)', margin: 0, fontWeight: 600 }}>✅ Sin reparaciones registradas</p>
                          )}
                        </>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Sin datos de mantenimiento.</p>
                      )}
                    </div>

                    {/* Ejercicios compatibles */}
                    <div>
                      <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Ejercicios compatibles (por grupo muscular)
                      </p>
                      {ejsComp.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                          Ningún ejercicio comparte grupos con esta máquina todavía.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {ejsComp.map(e => (
                            <span key={e.id} style={{ fontSize: 12, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 6, padding: '3px 10px', fontWeight: 600, border: '1.5px solid #BFDBFE' }}>
                              💪 {e.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
