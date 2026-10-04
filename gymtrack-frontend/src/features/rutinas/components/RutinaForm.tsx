import { NAME_TO_STATIC_IMG } from '../../ejercicios/assets/imagenesEjercicios'
import { useRutinaForm, TRENES, DIAS } from '../hooks/useRutinaForm'
import { DIFICULTAD_CONFIG, OBJETIVO_CONFIG } from '../utils/rutinaUtils'

const DIFICULTADES = [
  { val: '', label: 'Sin especificar', bg: 'var(--bg-surface)', color: 'var(--text-muted)', border: 'var(--border)' },
  ...Object.entries(DIFICULTAD_CONFIG).map(([val, c]) => ({ val, label: c.label, bg: c.bg, color: c.color, border: c.color })),
]

function Paso({ n, titulo, ayuda, children, extra }: {
  n: number; titulo: string; ayuda?: string; children: React.ReactNode; extra?: React.ReactNode
}) {
  return (
    <div className="gt-card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{n}. {titulo}</p>
          {ayuda && <p className="gt-text-muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{ayuda}</p>}
        </div>
        {extra}
      </div>
      {children}
    </div>
  )
}

export default function RutinaForm() {
  const f = useRutinaForm()

  const elegirParaQuien = f.esAdmin && !f.esEdicion
  const usarBase = f.esAdmin && !f.esEdicion && !f.esGeneral
  let paso = 0
  const sig = () => ++paso

  const cantDias = Math.max(f.dias.length, 1)
  const etiquetaDia = (n: number) => f.dias[n - 1] ?? `Día ${n}`
  const ejDelDia = f.ejercicios
    .map((ej, idx) => ({ ej, idx }))
    .filter(({ ej }) => cantDias === 1 || (ej.dia ?? 1) === f.diaActivo)
  const labelsTrenes = f.trenesSel.map(tid => TRENES.find(t => t.id === tid)?.label ?? tid).join(' + ')

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>
            {f.esEdicion ? 'Editar rutina' : f.sinSocio && f.esAdmin ? 'Nueva plantilla' : 'Nueva rutina'}
          </h1>
          {!f.esEdicion && (
            <p className="gt-text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
              Completá los pasos en orden. Podés ajustar los ejercicios después desde el detalle.
            </p>
          )}
        </div>
        <button className="gt-btn gt-btn-secondary" onClick={() => f.navigate('/rutinas')}>← Volver</button>
      </div>

      {f.error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 16 }}>
          {f.error}
          <button onClick={() => f.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      <form onSubmit={f.handleSubmit}>

        {/* ── ¿Para quién es? ── */}
        {elegirParaQuien && (
          <Paso n={sig()} titulo="¿Para quién es esta rutina?">
            <div className="gt-choice-grid">
              <button type="button" className={`gt-choice${!f.sinSocio ? ' selected' : ''}`}
                onClick={() => f.setSinSocio(false)}>
                <p className="gt-choice-icon">🙋</p>
                <p className="gt-choice-title">Para un socio</p>
                <p className="gt-choice-desc">Rutina personalizada. El socio la ve en su perfil y registra su progreso.</p>
              </button>
              <button type="button" className={`gt-choice${f.sinSocio ? ' selected' : ''}`}
                onClick={() => { f.setSinSocio(true); f.setSocioSel(null); f.setBusquedaSocio('') }}>
                <p className="gt-choice-icon">📋</p>
                <p className="gt-choice-title">Plantilla</p>
                <p className="gt-choice-desc">Rutina modelo, sin socio. Después la asignás a quien quieras en un clic.</p>
              </button>
            </div>

            {!f.sinSocio && (
              <div style={{ marginTop: 16 }}>
                {f.socioSel ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--green-bg)', borderRadius: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--green-text)' }}>✓ {f.socioSel.nombre} {f.socioSel.apellido}</span>
                    <span className="gt-text-muted" style={{ fontSize: 12 }}>DNI {f.socioSel.dni}</span>
                    <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginLeft: 'auto' }}
                      onClick={() => { f.setSocioSel(null); f.setBusquedaSocio(''); f.setMostrarBuscador(true) }}>
                      Cambiar socio
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="gt-label">Buscar socio</label>
                    <input className="gt-input" placeholder="Nombre, apellido o DNI…"
                      value={f.busquedaSocio}
                      onFocus={() => f.setMostrarBuscador(true)}
                      onChange={e => { f.setBusquedaSocio(e.target.value); f.setMostrarBuscador(true) }} />
                    {f.mostrarBuscador && f.busquedaSocio.length >= 1 && (
                      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-surface)', overflow: 'hidden', marginTop: 6 }}>
                        {(() => {
                          const q = f.busquedaSocio.toLowerCase()
                          const res = f.socios
                            .filter(s => s.nombre.toLowerCase().includes(q) || s.apellido.toLowerCase().includes(q) || s.dni.includes(q))
                            .slice(0, 6)
                          if (res.length === 0) return <p className="gt-text-muted" style={{ margin: 0, padding: '9px 14px', fontSize: 13 }}>Sin resultados</p>
                          return res.map(s => (
                            <button type="button" key={s.id} onClick={() => f.seleccionarSocio(s)} className="gt-socio-opcion">
                              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>#{s.id}</span>
                              <span>{s.nombre} {s.apellido}</span>
                              <span className="gt-text-muted" style={{ marginLeft: 'auto', fontSize: 12 }}>DNI {s.dni}</span>
                            </button>
                          ))
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {f.obsMovio && f.socioSel && (
                  <div className="gt-alert gt-alert-warning" style={{ marginTop: 10, marginBottom: 0 }}>
                    <strong>⚠ Ficha médica de {f.socioSel.nombre}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{f.obsMovio}</p>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 12, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={f.tambienPlantilla} onChange={e => f.setTambienPlantilla(e.target.checked)} />
                  Guardar también como plantilla para reutilizarla con otros socios
                </label>
              </div>
            )}
          </Paso>
        )}

        {/* ── Partir de una plantilla ── */}
        {usarBase && (
          <div className="gt-card" style={{ marginBottom: 14, border: '1.5px solid var(--accent-border)', background: 'var(--accent-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                  ¿Querés partir de una plantilla? <span style={{ fontWeight: 400, fontSize: 12 }}>(opcional)</span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {f.rutinaBaseNombre
                    ? <>Datos y ejercicios cargados desde <strong>{f.rutinaBaseNombre}</strong>. Podés modificarlos antes de guardar.</>
                    : 'Carga los datos y ejercicios de una plantilla para no empezar de cero.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {f.rutinaBaseNombre && (
                  <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={f.limpiarBase}>Empezar de cero</button>
                )}
                <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm"
                  onClick={() => f.setMostrarPicker(v => !v)} disabled={f.cargandoBase}>
                  {f.cargandoBase ? 'Cargando…' : f.mostrarPicker ? 'Cerrar' : f.rutinaBaseNombre ? 'Cambiar' : 'Elegir plantilla'}
                </button>
              </div>
            </div>

            {f.mostrarPicker && (
              <div style={{ marginTop: 12 }}>
                <input className="gt-input" placeholder="Buscar por nombre…"
                  value={f.busqGeneral} onChange={e => f.setBusqGeneral(e.target.value)}
                  style={{ marginBottom: 8 }} />
                {f.generales.length === 0 ? (
                  <p className="gt-text-muted" style={{ fontSize: 13, margin: 0 }}>No hay plantillas creadas todavía.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                    {f.generales
                      .filter(r => r.nombre.toLowerCase().includes(f.busqGeneral.toLowerCase()))
                      .map(r => {
                        const dif = r.dificultad ? DIFICULTAD_CONFIG[r.dificultad] : null
                        return (
                          <button type="button" key={r.id} onClick={() => f.aplicarRutinaGeneral(r)} className="gt-cat-item">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{r.nombre}</p>
                              {r.descripcion && <p className="gt-text-muted" style={{ margin: '2px 0 0', fontSize: 12 }}>{r.descripcion}</p>}
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                                {(r.trenes ?? []).map(t => {
                                  const tc = TRENES.find(x => x.id === t)
                                  return <span key={t} className="gt-chip" style={{ background: tc?.bg, color: tc?.color }}>{tc?.label ?? t}</span>
                                })}
                                {r.diasSemana && r.diasSemana.length > 0 && (
                                  <span className="gt-chip" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                                    {r.diasSemana.length} {r.diasSemana.length === 1 ? 'día' : 'días'}
                                  </span>
                                )}
                                {dif && <span className="gt-chip" style={{ background: dif.bg, color: dif.color }}>{dif.label}</span>}
                              </div>
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>Usar esta →</span>
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Objetivo ── */}
        <Paso n={sig()} titulo="¿Cuál es el objetivo?"
          ayuda="Define series, repeticiones y descanso sugeridos, y cómo se progresa en el modo entrenamiento.">
          <div className="gt-objetivo-grid">
            {Object.entries(OBJETIVO_CONFIG).map(([id, o]) => {
              const sel = f.objetivo === id
              return (
                <button key={id} type="button" aria-pressed={sel} onClick={() => f.setObjetivo(sel ? '' : id)}
                  className={`gt-objetivo${sel ? ' selected' : ''}`} style={sel ? { borderColor: o.color, background: o.bg } : undefined}>
                  <span style={{ fontSize: 22 }}>{o.emoji}</span>
                  <span style={{ fontWeight: 700, color: sel ? o.color : 'var(--text-primary)' }}>{o.label}</span>
                  <span className="gt-text-muted" style={{ fontSize: 11, lineHeight: 1.35 }}>{o.desc}</span>
                  <span className="gt-chip" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>
                    {o.esquema.series}×{o.esquema.reps} · {o.esquema.descanso}s
                  </span>
                </button>
              )
            })}
          </div>
          {f.objetivo && !f.esEdicion && f.ejercicios.length > 0 && (
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 12 }} onClick={f.aplicarEsquema}>
              Aplicar {OBJETIVO_CONFIG[f.objetivo].esquema.series}×{OBJETIVO_CONFIG[f.objetivo].esquema.reps} · {OBJETIVO_CONFIG[f.objetivo].esquema.descanso}s a los {f.ejercicios.length} ejercicios
            </button>
          )}
        </Paso>

        {/* ── Trenes musculares ── */}
        <Paso n={sig()} titulo="¿Qué trabaja esta rutina?" ayuda="Podés elegir más de uno. Filtra el catálogo de ejercicios.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {TRENES.map(t => {
              const sel = f.trenesSel.includes(t.id)
              return (
                <button key={t.id} type="button" onClick={() => f.toggleTren(t.id)} aria-pressed={sel}
                  style={{ padding: '14px 12px', borderRadius: 10, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', font: 'inherit',
                    borderColor: sel ? t.color : 'var(--border)', background: sel ? t.bg : 'var(--bg-surface)', position: 'relative' }}>
                  {sel && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 13, color: t.color, fontWeight: 700 }}>✓</span>}
                  <p style={{ fontSize: 28, margin: '0 0 6px' }}>{t.emoji}</p>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 13, color: sel ? t.color : 'var(--text-primary)' }}>{t.label}</p>
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{t.desc}</p>
                </button>
              )
            })}
          </div>
        </Paso>

        {/* ── Datos y días ── */}
        <Paso n={sig()} titulo="Datos de la rutina">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">Nombre *</label>
              <input className="gt-input" value={f.nombre} onChange={e => f.setNombre(e.target.value)} placeholder="Ej: Fuerza tren superior" maxLength={50} required />
            </div>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">Descripción (opcional)</label>
              <textarea className="gt-textarea" value={f.descripcion} onChange={e => f.setDescripcion(e.target.value)} placeholder="Objetivo, nivel, notas generales…" rows={2} maxLength={300} />
            </div>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">¿Qué días entrena?</label>
              <p className="gt-text-muted" style={{ margin: '0 0 6px', fontSize: 12 }}>
                Cada día marcado es un día de la rutina (Día 1, Día 2…), siempre de lunes a domingo.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DIAS.map(dia => {
                  const sel = f.dias.includes(dia)
                  return (
                    <button key={dia} type="button" onClick={() => f.toggleDia(dia)} aria-pressed={sel}
                      className={`gt-day-tab${sel ? ' activo' : ''}`}>
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">Nivel</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                {DIFICULTADES.map(opt => {
                  const sel = f.dificultad === opt.val
                  return (
                    <button key={opt.val} type="button" onClick={() => f.setDificultad(opt.val)} aria-pressed={sel}
                      style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', font: 'inherit',
                        border: `1.5px solid ${sel ? opt.border : 'var(--border)'}`, background: sel ? opt.bg : 'var(--bg-surface)',
                        color: sel ? opt.color : 'var(--text-secondary)', fontWeight: sel ? 700 : 400 }}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Paso>

        {/* ── Ejercicios por día ── */}
        {!f.esEdicion && (
          <Paso n={sig()} titulo="Ejercicios"
            ayuda={cantDias > 1
              ? 'Elegí un día en las pestañas y agregá sus ejercicios desde el catálogo.'
              : 'Agregá ejercicios desde el catálogo. También podés hacerlo después.'}
            extra={
              <button type="button" className={f.mostrarCat ? 'gt-btn gt-btn-secondary gt-btn-sm' : 'gt-btn gt-btn-primary gt-btn-sm'}
                onClick={() => f.setMostrarCat(v => !v)}>
                {f.mostrarCat ? 'Cerrar catálogo' : '+ Agregar ejercicio'}
              </button>
            }>

            {cantDias > 1 && (
              <div className="gt-day-tabs" role="tablist">
                {Array.from({ length: cantDias }, (_, i) => i + 1).map(n => {
                  const cuenta = f.ejercicios.filter(e => (e.dia ?? 1) === n).length
                  return (
                    <button key={n} type="button" role="tab" aria-selected={f.diaActivo === n}
                      className={`gt-day-tab${f.diaActivo === n ? ' activo' : ''}`}
                      onClick={() => f.setDiaActivo(n)}>
                      Día {n} · {etiquetaDia(n)}<span className="cuenta">({cuenta})</span>
                    </button>
                  )
                })}
              </div>
            )}

            {f.mostrarCat && (
              <div style={{ marginBottom: 14, background: 'var(--bg-surface-2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <input className="gt-input" style={{ flex: 1, minWidth: 140 }}
                    placeholder={f.trenesSel.length > 0 && !f.hayFullBody ? `Buscar en ${labelsTrenes}…` : 'Buscar ejercicio…'}
                    value={f.busqEj} onChange={e => f.setBusqEj(e.target.value)} />
                  {cantDias > 1 && (
                    <span className="gt-chip" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      Se agregan a: Día {f.diaActivo} · {etiquetaDia(f.diaActivo)}
                    </span>
                  )}
                  <span className="gt-text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {f.catalogoFiltrado.length} ejercicio{f.catalogoFiltrado.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ maxHeight: 380, overflowY: 'auto', padding: 12 }}>
                  {f.catalogoFiltrado.length === 0 ? (
                    <p className="gt-text-muted" style={{ textAlign: 'center', padding: '20px 0', margin: 0, fontSize: 13 }}>
                      {f.catalogo.length === 0 ? 'El catálogo está vacío. Primero agregá ejercicios en la sección Ejercicios.' : 'Sin coincidencias para esa búsqueda.'}
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
                      {f.catalogoFiltrado.map(e => {
                        const yaEnDia = f.ejercicios.some(x => x.catId === e.id && (cantDias === 1 || (x.dia ?? 1) === f.diaActivo))
                        return (
                          <button type="button" key={e.id} className="gt-cat-item" disabled={yaEnDia}
                            onClick={() => f.agregarEjDesde(e)}>
                            {e.imagenUrl
                              ? <img src={e.imagenUrl} alt="" className="gt-ej-thumb" style={{ width: 36, height: 36 }} />
                              : <span style={{ fontSize: 20, width: 36, textAlign: 'center' }}>{e.esMaquina ? '⚙️' : '💪'}</span>}
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nombre}</span>
                              <span className="gt-text-muted" style={{ fontSize: 11 }}>{(e.grupos ?? []).slice(0, 2).join(' · ')}</span>
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{yaEnDia ? '✓' : '+'}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {ejDelDia.length === 0 ? (
              <div className="gt-empty" style={{ padding: '18px 0' }}>
                {cantDias > 1 ? `Todavía no hay ejercicios para el Día ${f.diaActivo}.` : 'Todavía no agregaste ejercicios.'}
                {!f.mostrarCat && (
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => f.setMostrarCat(true)}>Abrir catálogo</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ejDelDia.map(({ ej, idx }, pos) => {
                  const ejCat = f.catalogo.find(c => c.id === ej.catId)
                  const maqParaEj = f.maquinas.filter(m => (m.grupos ?? []).some(g => (ejCat?.grupos ?? []).includes(g)))
                  const imgUrl = ej.imagenUrl || NAME_TO_STATIC_IMG[ej.nombre.toLowerCase()]
                  return (
                    <div key={idx} className="gt-ej-item">
                      <div className="gt-ej-item-head">
                        <span className="gt-dia-dot on">{pos + 1}</span>
                        {imgUrl ? (
                          <button type="button" onClick={() => f.setLightbox({ url: imgUrl, nombre: ej.nombre })} title="Ver imagen"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'zoom-in' }}>
                            <img src={imgUrl} alt={ej.nombre} className="gt-ej-thumb"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          </button>
                        ) : (
                          <span className="gt-ej-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💪</span>
                        )}
                        <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{ej.nombre}</span>
                        {cantDias > 1 && (
                          <select className="gt-input" value={ej.dia ?? 1} title="Mover a otro día"
                            onChange={e => f.actualizarEj(idx, 'dia', Number(e.target.value))}
                            style={{ width: 'auto', fontSize: 12, padding: '3px 6px' }}>
                            {Array.from({ length: cantDias }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n}>Día {n} · {etiquetaDia(n)}</option>
                            ))}
                          </select>
                        )}
                        <button type="button" onClick={() => f.quitarEj(idx)} title="Quitar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 16, padding: '0 4px' }}>✕</button>
                      </div>
                      <div className="gt-ej-item-body">
                        {[
                          { label: 'Series',       field: 'series'   as const, min: 1, max: 20 },
                          { label: 'Repeticiones', field: 'reps'     as const, min: 1, max: 200 },
                          { label: 'Descanso (s)', field: 'descanso' as const, min: 0, max: 600 },
                        ].map(({ label, field, min, max }) => (
                          <div key={field}>
                            <label>{label}</label>
                            <input type="number" className="gt-input" min={min} max={max}
                              value={ej[field]}
                              onChange={e => f.actualizarEj(idx, field, Number(e.target.value))}
                              style={{ textAlign: 'center' }} />
                          </div>
                        ))}
                        <div>
                          <label>Notas</label>
                          <input className="gt-input" value={ej.notas} onChange={e => f.actualizarEj(idx, 'notas', e.target.value)} placeholder="Ej: agarre neutro" maxLength={80} />
                        </div>
                      </div>
                      {maqParaEj.length > 0 && (
                        <div style={{ padding: '6px 12px 10px', borderTop: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                          <span className="gt-text-muted" style={{ fontSize: 11, fontWeight: 700 }}>⚙️ Máquinas:</span>
                          {maqParaEj.slice(0, 4).map(m => (
                            <span key={m.id} className="gt-chip" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow-text)' }}>
                              {m.nroMaquina ? `${m.nroMaquina} · ` : ''}{m.nombre}
                            </span>
                          ))}
                          {maqParaEj.length > 4 && <span className="gt-text-muted" style={{ fontSize: 11 }}>+{maqParaEj.length - 4}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Paso>
        )}

        {/* ── Guardar ── */}
        {f.progreso && <div className="gt-alert gt-alert-info" style={{ marginBottom: 12 }}>{f.progreso}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="submit" className="gt-btn gt-btn-primary" disabled={f.guardando} style={{ minWidth: 160, fontSize: 15 }}>
            {f.guardando ? (f.progreso ?? 'Guardando…')
              : f.esEdicion ? 'Guardar cambios'
              : f.esAdmin && f.sinSocio ? 'Crear plantilla'
              : f.socioSel ? `Asignar a ${f.socioSel.nombre}`
              : 'Crear rutina'}
          </button>
          <button type="button" className="gt-btn gt-btn-secondary" onClick={() => f.navigate('/rutinas')}>Cancelar</button>
          {!f.esEdicion && f.ejercicios.length > 0 && (
            <span className="gt-text-muted" style={{ fontSize: 12 }}>
              {f.ejercicios.length} ejercicio{f.ejercicios.length !== 1 ? 's' : ''}
              {cantDias > 1 && ` en ${cantDias} días`}
            </span>
          )}
        </div>
      </form>

      {/* Lightbox */}
      {f.lightbox && (
        <div onClick={() => f.setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 14, textAlign: 'center', padding: '0 20px' }}>{f.lightbox.nombre}</p>
          <img src={f.lightbox.url} alt={f.lightbox.nombre} style={{ maxWidth: '90vw', maxHeight: '75vh', borderRadius: 12, objectFit: 'contain', background: '#1a1a1a' }} />
          <button onClick={() => f.setLightbox(null)}
            style={{ marginTop: 18, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '8px 24px', cursor: 'pointer', fontSize: 14 }}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
