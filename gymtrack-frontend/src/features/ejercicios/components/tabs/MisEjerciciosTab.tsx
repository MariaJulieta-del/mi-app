import type { Ejercicio } from '../../services/ejercicioService'
import type { Maquina } from '../../../maquinas/services/maquinaService'
import { GRUPOS_CATEGORIAS } from '../../services/ejercicioService'

interface Props {
  filtrados: Ejercicio[]
  ejercicios: Ejercicio[]
  maquinas: Maquina[]
  filtroGrupo: string
  setFiltroGrupo: (v: string) => void
  busqueda: string
  setBusqueda: (v: string) => void
  verInactivos: boolean
  setVerInactivos: (v: boolean) => void
  soloSinMaquina: boolean
  setSoloSinMaquina: (v: boolean) => void
  asignarMaquina: (e: Ejercicio, maquinaId: number) => void
  showForm: boolean
  form: Ejercicio
  setForm: (fn: (prev: Ejercicio) => Ejercicio) => void
  editandoId: number | null
  guardando: boolean
  subiendoImg: boolean
  expandedId: number | null
  setExpandedId: (id: number | null) => void
  quitandoMaquina: string | null
  imgRef: React.RefObject<HTMLInputElement | null>
  maquinasCompatibles: (grupos: string[]) => Maquina[]
  abrirNuevo: () => void
  abrirEditar: (e: Ejercicio) => void
  cancelar: () => void
  toggleGrupoForm: (g: string) => void
  toggleMaquinaForm: (mid: number) => void
  handleImagen: (ev: React.ChangeEvent<HTMLInputElement>) => void
  guardar: (ev: React.FormEvent) => void
  toggleActivo: (e: Ejercicio) => void
  quitarMaquina: (e: Ejercicio, maquinaId: number) => void
  setLightbox: (v: { url: string; nombre: string } | null) => void
  onIrCatalogo: () => void
}

export default function MisEjerciciosTab({
  filtrados, ejercicios, maquinas,
  filtroGrupo, setFiltroGrupo, busqueda, setBusqueda, verInactivos, setVerInactivos,
  soloSinMaquina, setSoloSinMaquina, asignarMaquina,
  showForm, form, setForm, editandoId, guardando, subiendoImg,
  expandedId, setExpandedId, quitandoMaquina, imgRef,
  maquinasCompatibles, abrirEditar, cancelar,
  toggleGrupoForm, toggleMaquinaForm, handleImagen, guardar,
  toggleActivo, quitarMaquina, setLightbox, onIrCatalogo,
}: Props) {
  // En el formulario se ven todas las máquinas activas: primero las que trabajan esos músculos
  const compatiblesForm = maquinasCompatibles(form.grupos ?? [])
  const maquinasForm = [
    ...compatiblesForm,
    ...maquinas.filter(m => m.activa && !compatiblesForm.some(c => c.id === m.id)),
  ]
  const sinMaquina = ejercicios.filter(e => !e.esMaquina && e.activo && (e.maquinaIds ?? []).length === 0).length

  return (
    <div>
      {/* Formulario inline */}
      {showForm && (
        <div className="gt-card" style={{ marginBottom: 20, border: '2px solid var(--blue-text)' }}>
          <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            {editandoId ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          </p>

          <form onSubmit={guardar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Col izquierda */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Nombre *</label>
                  <input id="ej-nombre" className="gt-input" value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Press de banca, Curl de bíceps…" maxLength={80} required />
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Grupos musculares</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
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
                                  borderColor: sel ? 'var(--blue-text)' : 'var(--border)',
                                  background: sel ? 'var(--blue-bg)' : 'var(--bg-surface-3)',
                                  color: sel ? 'var(--blue-text)' : 'var(--text-muted)',
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
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Instrucciones / descripción</label>
                  <textarea className="gt-textarea" value={form.descripcion ?? ''}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    rows={3} maxLength={400} placeholder="Cómo ejecutar correctamente el ejercicio…" />
                </div>
              </div>

              {/* Col derecha */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Imagen / GIF</label>
                  {form.imagenUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img src={form.imagenUrl} alt="preview"
                        style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, imagenUrl: '' }))}
                        style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => imgRef.current?.click()}
                      style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '18px 0', textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-surface-3)' }}>
                      {subiendoImg ? '⏳ Procesando…' : '📷 Subir imagen o GIF'}
                    </div>
                  )}
                  <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagen} />
                </div>

                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>🔧 Máquinas asociadas</span>
                    {(form.maquinaIds ?? []).length > 0 && (
                      <span style={{ fontSize: 11, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 8px', fontWeight: 700 }}>
                        {(form.maquinaIds ?? []).length} seleccionada{(form.maquinaIds ?? []).length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </label>
                  {maquinasForm.length === 0 ? (
                    <div style={{ marginTop: 6, background: 'var(--bg-surface-3)', border: '1.5px dashed var(--border)', borderRadius: 8, padding: '14px', textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                        Todavía no hay máquinas cargadas. Agregalas en la sección Máquinas.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxHeight: 220, overflowY: 'auto' }}>
                      {maquinasForm.map(m => {
                        const sel = (form.maquinaIds ?? []).includes(m.id!)
                        return (
                          <button key={m.id} type="button" onClick={() => toggleMaquinaForm(m.id!)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px 5px 6px', borderRadius: 20, fontSize: 12,
                              cursor: 'pointer', transition: 'all 0.15s',
                              border: `2px solid ${sel ? 'var(--blue-text)' : 'var(--border)'}`,
                              background: sel ? 'var(--blue-bg)' : 'var(--bg-surface-3)',
                              color: sel ? 'var(--blue-text)' : 'var(--text-muted)',
                              fontWeight: sel ? 700 : 400,
                              boxShadow: 'none',
                            }}>
                            <span style={{
                              background: sel ? 'var(--accent)' : 'var(--bg-surface-3)',
                              color: sel ? 'var(--on-accent)' : 'var(--text-muted)',
                              borderRadius: 10, padding: '1px 6px',
                              fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                              minWidth: 22, textAlign: 'center',
                            }}>
                              {m.nroMaquina ?? '?'}
                            </span>
                            {sel && <span style={{ fontSize: 10, color: 'var(--blue-text)' }}>✓</span>}
                            <span>{m.nombre}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : editandoId ? 'Actualizar' : 'Crear ejercicio'}
              </button>
              <button type="button" className="gt-btn gt-btn-secondary" onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="gt-card" style={{ marginBottom: 14, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <input className="gt-input" style={{ flex: 1, minWidth: 160 }}
            placeholder="Buscar ejercicio…"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={verInactivos} onChange={e => setVerInactivos(e.target.checked)} />
            Ver inactivos
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            title="Para ir asociando cada ejercicio a la máquina donde se hace">
            <input type="checkbox" checked={soloSinMaquina} onChange={e => setSoloSinMaquina(e.target.checked)} />
            Sin máquina asociada{sinMaquina > 0 ? ` (${sinMaquina})` : ''}
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <button onClick={() => setFiltroGrupo('')} type="button"
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                fontWeight: !filtroGrupo ? 700 : 400,
                background: !filtroGrupo ? 'var(--accent)' : 'var(--bg-surface-2)',
                color: !filtroGrupo ? 'var(--on-accent)' : 'var(--text-secondary)',
                borderColor: !filtroGrupo ? 'var(--accent)' : 'var(--border)',
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
                    background: filtroGrupo === g ? 'var(--accent)' : 'var(--blue-bg)',
                    color: filtroGrupo === g ? 'var(--on-accent)' : 'var(--blue-text)',
                    borderColor: filtroGrupo === g ? 'var(--accent)' : 'var(--border)',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="gt-card">
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)' }}>
          {filtrados.length} ejercicio{filtrados.length !== 1 ? 's' : ''}
        </p>

        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 28, marginBottom: 6 }}>💪</p>
            <p style={{ margin: '0 0 12px' }}>
              {ejercicios.filter(e => !e.esMaquina).length === 0
                ? 'Todavía no hay ejercicios guardados.'
                : 'Sin resultados para esa búsqueda.'}
            </p>
            {ejercicios.filter(e => !e.esMaquina).length === 0 && (
              <button className="gt-btn gt-btn-secondary" onClick={onIrCatalogo}>
                Ir al catálogo →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtrados.map(e => {
              const isExp = expandedId === e.id
              const maquinasEj = e.grupos && e.grupos.length > 0
                ? maquinas.filter(m => m.activa && (m.grupos ?? []).some(g => (e.grupos ?? []).includes(g)))
                : []
              const maquinasAsig = (e.maquinaIds ?? [])
                .map(mid => maquinas.find(m => m.id === mid))
                .filter(Boolean) as Maquina[]

              return (
                <div key={e.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: isExp ? 'var(--bg-surface-3)' : 'var(--bg-surface)',
                    opacity: e.activo ? 1 : 0.65, cursor: 'pointer', transition: 'background 0.1s',
                  }}
                    onClick={() => setExpandedId(isExp ? null : e.id!)}>

                    {e.imagenUrl ? (
                      <button
                        onClick={ev => { ev.stopPropagation(); setLightbox({ url: e.imagenUrl!, nombre: e.nombre }) }}
                        title="Ver demostración"
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                        <img src={e.imagenUrl} alt={e.nombre}
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--border)', display: 'block', transition: 'opacity .15s' }}
                          onMouseEnter={ev => (ev.currentTarget.style.opacity = '0.7')}
                          onMouseLeave={ev => (ev.currentTarget.style.opacity = '1')} />
                        <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 9, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 2, padding: '0 2px', lineHeight: '13px', pointerEvents: 'none' }}>▶</span>
                      </button>
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 7, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        💪
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{e.nombre}</span>
                        {!e.activo && (
                          <span style={{ fontSize: 10, background: 'var(--red-light)', color: 'var(--red)', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>INACTIVO</span>
                        )}
                      </div>
                      {e.grupos && e.grupos.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                          {e.grupos.map(g => (
                            <span key={g} style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {maquinasAsig.length > 0 ? (
                      <span title={maquinasAsig.map(m => m.nombre).join(', ')}
                        style={{ fontSize: 11, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', borderRadius: 6, padding: '2px 8px', fontWeight: 700, flexShrink: 0 }}>
                        ⚙ {maquinasAsig.map(m => m.nroMaquina ? `N° ${m.nroMaquina}` : m.nombre).join(', ')}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 6, padding: '1px 8px', flexShrink: 0 }}>
                        sin máquina
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{isExp ? '▲' : '▼'}</span>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={ev => ev.stopPropagation()}>
                      <button className="gt-btn gt-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => abrirEditar(e)}>Editar</button>
                      <button className={`gt-btn ${e.activo ? 'gt-btn-danger' : 'gt-btn-secondary'}`}
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => toggleActivo(e)}>
                        {e.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>

                  {isExp && (
                    <div style={{ padding: '14px 16px 16px 70px', background: 'var(--bg-surface-2)', borderTop: '1px solid var(--border)' }}>
                      {e.descripcion && (
                        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {e.descripcion}
                        </p>
                      )}

                      {maquinasAsig.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ margin: '0 0 7px', fontSize: 11, fontWeight: 700, color: 'var(--yellow-text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            🔧 Máquinas asignadas
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {maquinasAsig.map(m => {
                              const key = `${e.id}-${m.id}`
                              const cargando = quitandoMaquina === key
                              return (
                                <div key={m.id} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  background: 'var(--yellow-bg)', border: '1.5px solid var(--border)',
                                  borderRadius: 20, padding: '4px 6px 4px 8px',
                                }}>
                                  <span style={{
                                    background: 'var(--yellow-text)', color: '#fff',
                                    borderRadius: 10, padding: '0 6px',
                                    fontSize: 11, fontWeight: 800, fontFamily: 'monospace',
                                    minWidth: 22, textAlign: 'center', lineHeight: '18px',
                                  }}>
                                    {m.nroMaquina ?? '?'}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--yellow-text)' }}>{m.nombre}</span>
                                  <button
                                    disabled={cargando}
                                    onClick={ev => { ev.stopPropagation(); quitarMaquina(e, m.id!) }}
                                    title="Quitar máquina"
                                    style={{ background: 'none', border: 'none', color: 'var(--yellow-text)', fontWeight: 700, fontSize: 14, cursor: cargando ? 'not-allowed' : 'pointer', padding: '0 2px', lineHeight: 1, opacity: cargando ? 0.4 : 1 }}>
                                    {cargando ? '…' : '×'}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {maquinasEj.filter(m => !maquinasAsig.some(x => x.id === m.id)).length > 0 && (
                        <div>
                          <p style={{ margin: '0 0 7px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Compatibles por grupo — tocá para asociar
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {maquinasEj.filter(m => !maquinasAsig.some(x => x.id === m.id)).map(m => {
                              const cargando = quitandoMaquina === `${e.id}-${m.id}`
                              return (
                                <button key={m.id} type="button" disabled={cargando}
                                  onClick={ev => { ev.stopPropagation(); asignarMaquina(e, m.id!) }}
                                  title="Asociar esta máquina al ejercicio"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5, cursor: cargando ? 'wait' : 'pointer',
                                    fontSize: 12, background: 'var(--bg-surface-3)', color: 'var(--text-secondary)',
                                    borderRadius: 20, padding: '3px 10px 3px 6px',
                                    border: '1.5px dashed var(--border)', fontWeight: 500, opacity: cargando ? 0.5 : 1,
                                  }}>
                                  <span style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>
                                    {m.nroMaquina ?? '?'}
                                  </span>
                                  {m.nombre}
                                  <span style={{ fontWeight: 700, color: 'var(--blue-text)' }}>+</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {maquinasEj.length === 0 && maquinasAsig.length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Sin máquinas asignadas ni compatibles.</p>
                      )}

                      {e.imagenUrl && (
                        <div style={{ marginTop: 12 }}>
                          <button
                            onClick={() => setLightbox({ url: e.imagenUrl!, nombre: e.nombre })}
                            style={{
                              background: 'none', border: '1px solid var(--border)',
                              borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
                              color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5,
                            }}
                            onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'var(--blue-text)'; ev.currentTarget.style.color = 'var(--blue-text)'; ev.currentTarget.style.background = 'var(--blue-bg)' }}
                            onMouseLeave={ev => { ev.currentTarget.style.borderColor = ''; ev.currentTarget.style.color = ''; ev.currentTarget.style.background = 'none' }}>
                            ▶ Ver demostración
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
