import { useMemo } from 'react'
import {
  ArrowLeft, ChevronDown, ChevronUp, ClipboardList, Copy, Dumbbell, LayoutTemplate, Plus, Search, StickyNote, Trash2, UserRound, X,
} from 'lucide-react'
import { NAME_TO_STATIC_IMG } from '../../ejercicios/assets/imagenesEjercicios'
import { useRutinaForm, TRENES, DIAS, type EjItem } from '../hooks/useRutinaForm'
import { DIFICULTAD_CONFIG, OBJETIVO_CONFIG } from '../utils/rutinaUtils'
import { Cargando, EmptyState, IconButton, Segmentado, Spinner } from '../../../shared/components/ui'

const DIA_CORTO: Record<string, string> = {
  Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom',
}

/** Una fila del armado: orden, imagen, series × reps · descanso, notas y día */
function FilaEjercicio({ ej, pos, total, cantDias, etiquetaDia, maquinas, img, onCampo, onMover, onQuitar, onVer }: {
  ej: EjItem; pos: number; total: number; cantDias: number; etiquetaDia: (n: number) => string
  maquinas: { id?: number; nombre: string; nroMaquina?: string | null }[]; img?: string
  onCampo: (campo: keyof EjItem, v: string | number) => void
  onMover: (dir: -1 | 1) => void; onQuitar: () => void; onVer: () => void
}) {
  return (
    <div className="gt-bej">
      <div className="gt-bej-orden">
        <button type="button" onClick={() => onMover(-1)} disabled={pos === 0} aria-label="Subir"><ChevronUp size={16} /></button>
        <span>{pos + 1}</span>
        <button type="button" onClick={() => onMover(1)} disabled={pos === total - 1} aria-label="Bajar"><ChevronDown size={16} /></button>
      </div>
      {img ? (
        <button type="button" className="gt-bej-img" onClick={onVer} aria-label={`Ver ${ej.nombre}`}>
          <img src={img} alt="" onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
        </button>
      ) : <span className="gt-bej-img vacio"><Dumbbell size={20} aria-hidden /></span>}
      <div className="gt-bej-cuerpo">
        <div className="gt-bej-titulo">
          <strong>{ej.nombre}</strong>
          {maquinas.length > 0 && (
            <span className="gt-bej-maq">{maquinas.slice(0, 2).map(m => (m.nroMaquina ? `N° ${m.nroMaquina}` : m.nombre)).join(' · ')}{maquinas.length > 2 ? ` +${maquinas.length - 2}` : ''}</span>
          )}
        </div>
        <div className="gt-bej-campos">
          <label><input type="number" min={1} max={20} value={ej.series} onChange={e => onCampo('series', Number(e.target.value))} aria-label="Series" /><span>series</span></label>
          <span className="gt-bej-x" aria-hidden>×</span>
          <label><input type="number" min={1} max={200} value={ej.reps} onChange={e => onCampo('reps', Number(e.target.value))} aria-label="Repeticiones" /><span>reps</span></label>
          <label><input type="number" min={0} max={600} step={15} value={ej.descanso} onChange={e => onCampo('descanso', Number(e.target.value))} aria-label="Descanso en segundos" /><span>seg desc.</span></label>
          <input className="gt-bej-notas" value={ej.notas} onChange={e => onCampo('notas', e.target.value)} placeholder="Nota (ej: agarre neutro)" maxLength={80} aria-label="Notas" />
        </div>
      </div>
      <div className="gt-bej-acciones">
        {cantDias > 1 && (
          <select className="gt-select" value={ej.dia ?? 1} onChange={e => onCampo('dia', Number(e.target.value))} aria-label="Mover a otro día">
            {Array.from({ length: cantDias }, (_, i) => i + 1).map(n => <option key={n} value={n}>{etiquetaDia(n)}</option>)}
          </select>
        )}
        <IconButton icono={Trash2} etiqueta="Quitar ejercicio" tono="danger" onClick={onQuitar} />
      </div>
    </div>
  )
}

/**
 * Armado de rutina estilo "builder": datos compactos arriba, el entrenamiento por día como protagonista
 * y la biblioteca de ejercicios siempre a mano al costado (abajo en el celular).
 */
export default function RutinaForm() {
  const f = useRutinaForm()

  const elegirParaQuien = f.esAdmin && !f.esEdicion
  const usarBase = f.esAdmin && !f.esEdicion && !f.esGeneral && !f.sinSocio

  const cantDias = Math.max(f.dias.length, 1)
  const etiquetaDia = (n: number) => (f.dias[n - 1] ? `Día ${n} · ${DIA_CORTO[f.dias[n - 1]] ?? f.dias[n - 1]}` : `Día ${n}`)
  const ejDelDia = f.ejercicios.map((ej, idx) => ({ ej, idx })).filter(({ ej }) => cantDias === 1 || (ej.dia ?? 1) === f.diaActivo)
  const titulo = f.esEdicion ? (f.duenio?.id == null ? 'Editar plantilla' : 'Editar rutina') : f.sinSocio && f.esAdmin ? 'Nueva plantilla' : 'Nueva rutina'
  // Rutina de un socio (no plantilla): lleva indicaciones personales del profe
  const esDeSocio = f.esEdicion ? f.duenio?.id != null : !f.sinSocio
  const obj = f.objetivo ? OBJETIVO_CONFIG[f.objetivo] : null

  // Grupos para filtrar el catálogo: los de los trenes elegidos, o todos
  const grupos = useMemo(() => {
    if (f.gruposSeleccionados.length > 0 && !f.hayFullBody) return f.gruposSeleccionados
    return Array.from(new Set(f.catalogo.flatMap(e => e.grupos ?? []))).sort()
  }, [f.gruposSeleccionados, f.hayFullBody, f.catalogo])

  const textoGuardar = f.guardando ? (f.progreso ?? <><Spinner /> Guardando…</>)
    : f.esEdicion ? 'Guardar cambios'
    : f.esAdmin && f.sinSocio ? 'Crear plantilla'
    : f.socioSel ? `Asignar a ${f.socioSel.nombre}`
    : 'Crear rutina'

  return (
    <div className="gt-builder-page">
      <div className="gt-page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <IconButton icono={ArrowLeft} etiqueta="Volver a rutinas" onClick={() => f.navigate('/rutinas')} />
          <div style={{ minWidth: 0 }}>
            <h1 className="gt-page-title" style={{ margin: 0 }}>{titulo}</h1>
            <p className="gt-text-muted gt-text-sm" style={{ margin: '2px 0 0' }}>
              {f.esEdicion
                ? (f.duenio?.nombre ? <>Rutina personal de <strong>{f.duenio.nombre}</strong></> : 'Plantilla: los cambios no tocan las rutinas ya asignadas.')
                : 'Completá los datos, elegí los días y sumá ejercicios desde la biblioteca.'}
            </p>
          </div>
        </div>
      </div>

      {f.usanPlantilla !== 0 && (
        <div className="gt-alert gt-alert-warning" style={{ marginBottom: 16 }}>
          Esta plantilla la tienen asignada {f.usanPlantilla > 0 ? `${f.usanPlantilla} ${f.usanPlantilla === 1 ? 'socio' : 'socios'}` : 'socios'}:
          los cambios les llegan a todos. Para cambiarla solo para uno, usá "Ajustar" en su perfil o en la lista de socios de la plantilla.
        </div>
      )}

      {f.error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 16 }}>
          {f.error}
          <button onClick={() => f.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} aria-label="Cerrar">✕</button>
        </div>
      )}

      <form id="form-rutina" onSubmit={f.handleSubmit}>
        {/* ── Para quién ── */}
        {elegirParaQuien && (
          <section className="gt-card gt-builder-seccion">
            <div className="gt-card-cabecera">
              <p className="gt-card-title" style={{ margin: 0 }}>¿Para quién es?</p>
              <Segmentado etiqueta="Destino" valor={f.sinSocio ? 'plantilla' : 'socio'}
                onChange={v => { if (v === 'plantilla') { f.setSinSocio(true); f.setSocioSel(null); f.setBusquedaSocio('') } else f.setSinSocio(false) }}
                opciones={[{ valor: 'socio', texto: 'Un socio', icono: UserRound }, { valor: 'plantilla', texto: 'Plantilla', icono: LayoutTemplate }]} />
            </div>

            {f.sinSocio ? (
              <p className="gt-text-sm gt-text-muted" style={{ margin: 0 }}>Rutina modelo sin socio: después la asignás a quien quieras en un clic.</p>
            ) : (
              <>
                {f.socioSel ? (
                  <div className="gt-builder-socio">
                    <UserRound size={18} aria-hidden />
                    <strong>{f.socioSel.nombre} {f.socioSel.apellido}</strong>
                    <span className="gt-text-muted gt-text-sm">DNI {f.socioSel.dni}</span>
                    <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginLeft: 'auto' }}
                      onClick={() => { f.setSocioSel(null); f.setBusquedaSocio(''); f.setMostrarBuscador(true) }}>Cambiar</button>
                  </div>
                ) : (
                  <div className="gt-busqueda" style={{ maxWidth: 480 }}>
                    <Search size={16} aria-hidden />
                    <input className="gt-input" placeholder="Buscar socio por nombre o DNI…" autoFocus value={f.busquedaSocio}
                      onFocus={() => f.setMostrarBuscador(true)} onChange={e => { f.setBusquedaSocio(e.target.value); f.setMostrarBuscador(true) }} aria-label="Buscar socio" />
                    {f.mostrarBuscador && f.busquedaSocio.length >= 1 && (
                      <div className="gt-builder-sugerencias">
                        {(() => {
                          const res = f.socios
                          if (res.length === 0) return <p className="gt-text-muted gt-text-sm" style={{ margin: 0, padding: '9px 14px' }}>Sin resultados</p>
                          return res.map(s => (
                            <button type="button" key={s.id} onClick={() => f.seleccionarSocio(s)} className="gt-socio-opcion">
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
                    <strong>Ficha médica de {f.socioSel.nombre}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 12, whiteSpace: 'pre-wrap' }}>{f.obsMovio}</p>
                  </div>
                )}
                <div className="gt-builder-opciones">
                  <label className="gt-check">
                    <input type="checkbox" checked={f.tambienPlantilla} onChange={e => f.setTambienPlantilla(e.target.checked)} />
                    Guardar también como plantilla
                  </label>
                  {usarBase && (
                    <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => f.setMostrarPicker(v => !v)} disabled={f.cargandoBase}>
                      <LayoutTemplate size={14} aria-hidden /> {f.cargandoBase ? <><Spinner /> Cargando…</> : f.rutinaBaseNombre ? `Desde: ${f.rutinaBaseNombre}` : 'Partir de una plantilla'}
                    </button>
                  )}
                  {f.rutinaBaseNombre && <button type="button" className="gt-btn-link" onClick={f.limpiarBase}>Empezar de cero</button>}
                </div>
                {f.mostrarPicker && (
                  <div className="gt-builder-picker">
                    <input className="gt-input" placeholder="Buscar plantilla…" value={f.busqGeneral} onChange={e => f.setBusqGeneral(e.target.value)} aria-label="Buscar plantilla" />
                    {f.generales.length === 0 ? <p className="gt-text-muted gt-text-sm" style={{ margin: '8px 0 0' }}>No hay plantillas creadas todavía.</p> : (
                      <div className="gt-builder-picker-lista">
                        {f.generales.filter(r => r.nombre.toLowerCase().includes(f.busqGeneral.toLowerCase())).map(r => (
                          <button type="button" key={r.id} onClick={() => f.aplicarRutinaGeneral(r)} className="gt-cat-item">
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ display: 'block', fontSize: 14 }}>{r.nombre}</strong>
                              <span className="gt-text-muted" style={{ fontSize: 12 }}>
                                {r.cantidadEjercicios ?? 0} ejercicios{(r.diasSemana?.length ?? 0) > 0 ? ` · ${r.diasSemana!.length} días` : ''}
                                {r.objetivo && OBJETIVO_CONFIG[r.objetivo] ? ` · ${OBJETIVO_CONFIG[r.objetivo].label}` : ''}
                              </span>
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>Usar</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ── Datos ── */}
        <section className="gt-card gt-builder-seccion">
          <div className="gt-builder-datos">
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label" htmlFor="rutina-nombre">Nombre *</label>
              <input id="rutina-nombre" className="gt-input" value={f.nombre} onChange={e => f.setNombre(e.target.value)} placeholder="Ej: Fuerza tren superior" maxLength={50} required />
            </div>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label" htmlFor="rutina-desc">Descripción</label>
              <input id="rutina-desc" className="gt-input" value={f.descripcion} onChange={e => f.setDescripcion(e.target.value)} placeholder="Opcional: foco, nivel, indicaciones" maxLength={300} />
            </div>
          </div>
          {esDeSocio && (
            <div className="gt-form-group gt-builder-notas">
              <label className="gt-label" htmlFor="rutina-notas-profe"><StickyNote size={14} aria-hidden /> Indicaciones del profe para {f.duenio?.nombre?.split(' ')[0] ?? f.socioSel?.nombre ?? 'el socio'}</label>
              <textarea id="rutina-notas-profe" className="gt-textarea" rows={2} maxLength={1000} value={f.notasProfe} onChange={e => f.setNotasProfe(e.target.value)}
                placeholder="Ej: cuidá la rodilla derecha, bajá el peso si duele. Hidratate entre series." />
              <span className="gt-hint">Las ve el socio arriba de su rutina. No se copian si la guardás como plantilla.</span>
            </div>
          )}

          <div className="gt-builder-fila">
            <span className="gt-label">Objetivo</span>
            <div className="gt-chips">
              {Object.entries(OBJETIVO_CONFIG).map(([id, o]) => {
                const sel = f.objetivo === id
                return (
                  <button key={id} type="button" aria-pressed={sel} title={o.desc} className={`gt-chip-btn${sel ? ' activo' : ''}`}
                    style={sel ? { borderColor: o.color, background: o.bg, color: o.color } : undefined} onClick={() => f.setObjetivo(sel ? '' : id)}>
                    {o.label} <small>{o.esquema.series}×{o.esquema.reps}</small>
                  </button>
                )
              })}
            </div>
          </div>
          {obj && (
            <p className="gt-builder-ayuda">
              {obj.desc} Los ejercicios nuevos se cargan con {obj.esquema.series}×{obj.esquema.reps} y {obj.esquema.descanso} s de descanso.
              {f.ejercicios.length > 0 && <> <button type="button" className="gt-btn-link" onClick={f.aplicarEsquema}>Aplicarlo a los {f.ejercicios.length} cargados</button></>}
            </p>
          )}

          <div className="gt-builder-fila">
            <span className="gt-label">Trabaja</span>
            <div className="gt-chips">
              {TRENES.map(t => {
                const sel = f.trenesSel.includes(t.id)
                return (
                  <button key={t.id} type="button" aria-pressed={sel} title={t.desc} className={`gt-chip-btn${sel ? ' activo' : ''}`}
                    style={sel ? { borderColor: t.color, background: t.bg, color: t.color } : undefined} onClick={() => f.toggleTren(t.id)}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="gt-builder-fila">
            <span className="gt-label">Días</span>
            <div className="gt-chips">
              {DIAS.map(dia => {
                const sel = f.dias.includes(dia)
                return <button key={dia} type="button" aria-pressed={sel} className={`gt-chip-btn dia${sel ? ' activo' : ''}`} onClick={() => f.toggleDia(dia)}>{DIA_CORTO[dia]}</button>
              })}
            </div>
          </div>

          <div className="gt-builder-fila">
            <span className="gt-label">Nivel</span>
            <div className="gt-chips">
              {[['', 'Sin especificar'] as const, ...Object.entries(DIFICULTAD_CONFIG).map(([v, c]) => [v, c.label] as const)].map(([v, label]) => {
                const sel = f.dificultad === v
                const c = v ? DIFICULTAD_CONFIG[v] : null
                return (
                  <button key={v || 'x'} type="button" aria-pressed={sel} className={`gt-chip-btn${sel ? ' activo' : ''}`}
                    style={sel && c ? { borderColor: c.color, background: c.bg, color: c.color } : undefined} onClick={() => f.setDificultad(v)}>{label}</button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Armado ── */}
        {f.cargandoRutina ? <Cargando tarjeta texto="Cargando ejercicios…" /> : (
          <div className="gt-builder">
            <section className="gt-card gt-builder-main">
              <div className="gt-card-cabecera">
                <p className="gt-card-title" style={{ margin: 0 }}>Ejercicios</p>
                <button type="button" className="gt-btn gt-btn-primary gt-btn-sm gt-builder-abrir-cat" onClick={() => f.setMostrarCat(v => !v)}>
                  {f.mostrarCat ? <><X size={14} aria-hidden /> Cerrar biblioteca</> : <><Plus size={14} aria-hidden /> Agregar ejercicios</>}
                </button>
              </div>

              {cantDias > 1 && (
                <div className="gt-builder-dias">
                  <div className="gt-day-tabs" role="tablist" style={{ margin: 0 }}>
                    {Array.from({ length: cantDias }, (_, i) => i + 1).map(n => {
                      const cuenta = f.ejercicios.filter(e => (e.dia ?? 1) === n).length
                      return (
                        <button key={n} type="button" role="tab" aria-selected={f.diaActivo === n}
                          className={`gt-day-tab${f.diaActivo === n ? ' activo' : ''}`} onClick={() => f.setDiaActivo(n)}>
                          {etiquetaDia(n)}<span className="cuenta">({cuenta})</span>
                        </button>
                      )
                    })}
                  </div>
                  {ejDelDia.length > 0 && (
                    <label className="gt-builder-copiar">
                      <Copy size={14} aria-hidden />
                      <select className="gt-select" value="" aria-label="Copiar este día a otro"
                        onChange={e => { const destino = Number(e.target.value); if (destino) { f.copiarDia(f.diaActivo, destino); f.setDiaActivo(destino) } }}>
                        <option value="">Copiar día a…</option>
                        {Array.from({ length: cantDias }, (_, i) => i + 1).filter(n => n !== f.diaActivo).map(n => <option key={n} value={n}>{etiquetaDia(n)}</option>)}
                      </select>
                    </label>
                  )}
                </div>
              )}

              {ejDelDia.length === 0 ? (
                <EmptyState icono={ClipboardList} titulo={cantDias > 1 ? `${etiquetaDia(f.diaActivo)} sin ejercicios` : 'Todavía no agregaste ejercicios'}
                  texto="Tocá un ejercicio de la biblioteca para sumarlo. También podés hacerlo después desde el detalle." />
              ) : (
                <div className="gt-bej-lista">
                  {ejDelDia.map(({ ej, idx }, pos) => {
                    const ejCat = f.catalogo.find(c => c.id === ej.catId)
                    // Máquinas asociadas a ese ejercicio en el catálogo
                    const maq = f.maquinas.filter(m => m.id != null && (ejCat?.maquinaIds ?? []).includes(m.id))
                    const img = ej.imagenUrl || NAME_TO_STATIC_IMG[ej.nombre.toLowerCase()]
                    return (
                      <FilaEjercicio key={idx} ej={ej} pos={pos} total={ejDelDia.length} cantDias={cantDias} etiquetaDia={etiquetaDia}
                        maquinas={maq} img={img}
                        onCampo={(c, v) => f.actualizarEj(idx, c, v)} onMover={d => f.moverEj(idx, d)} onQuitar={() => f.quitarEj(idx)}
                        onVer={() => img && f.setLightbox({ url: img, nombre: ej.nombre })} />
                    )
                  })}
                </div>
              )}
            </section>

            <aside className={`gt-card gt-builder-cat${f.mostrarCat ? ' abierto' : ''}`} aria-label="Biblioteca de ejercicios">
              <p className="gt-card-title" style={{ margin: '0 0 10px' }}>Biblioteca</p>
              <div className="gt-builder-filtros">
                <div className="gt-busqueda">
                  <Search size={16} aria-hidden />
                  <input className="gt-input" placeholder="Buscar ejercicio…" value={f.busqEj} onChange={e => f.setBusqEj(e.target.value)} aria-label="Buscar ejercicio" />
                </div>
                {grupos.length > 0 && (
                  <select className="gt-select" value={f.grupoCat} onChange={e => f.setGrupoCat(e.target.value)} aria-label="Músculo">
                    <option value="">Todos los músculos</option>
                    {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}
              </div>
              <p className="gt-text-sm gt-text-muted" style={{ margin: '0 0 8px' }}>
                {f.catalogoFiltrado.length} {f.catalogoFiltrado.length === 1 ? 'ejercicio' : 'ejercicios'}
                {cantDias > 1 && <> · se agregan a <strong>{etiquetaDia(f.diaActivo)}</strong></>}
              </p>
              <div className="gt-builder-cat-lista">
                {f.catalogoFiltrado.length === 0 ? (
                  <p className="gt-text-muted gt-text-sm" style={{ textAlign: 'center', padding: '16px 0', margin: 0 }}>
                    {f.catalogo.length === 0 ? 'El catálogo está vacío. Cargá ejercicios en la sección Ejercicios.' : 'Sin coincidencias.'}
                  </p>
                ) : f.catalogoFiltrado.map(e => {
                  const yaEnDia = f.ejercicios.some(x => x.catId === e.id && (cantDias === 1 || (x.dia ?? 1) === f.diaActivo))
                  const img = e.imagenUrl || NAME_TO_STATIC_IMG[e.nombre.toLowerCase()]
                  return (
                    <button type="button" key={e.id} className={`gt-cat-item${yaEnDia ? ' agregado' : ''}${f.recienAgregado === e.id ? ' recien' : ''}`}
                      disabled={yaEnDia} onClick={() => f.agregarEjDesde(e)}>
                      {img ? <img src={img} alt="" className="gt-ej-thumb" style={{ width: 38, height: 38 }} loading="lazy" />
                        : <span className="gt-ej-thumb gt-bej-img vacio" style={{ width: 38, height: 38 }}><Dumbbell size={16} aria-hidden /></span>}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.nombre}</span>
                        <span className="gt-text-muted" style={{ fontSize: 11 }}>{(e.grupos ?? []).slice(0, 2).join(' · ')}</span>
                      </span>
                      <span className="gt-cat-mas" aria-hidden>{yaEnDia ? '✓' : <Plus size={16} />}</span>
                    </button>
                  )
                })}
              </div>
            </aside>
          </div>
        )}
      </form>

      {/* Barra fija para guardar */}
      <div className="gt-builder-barra">
        <span className="gt-text-sm gt-text-muted" style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{f.ejercicios.length}</strong> ejercicios{cantDias > 1 ? ` en ${cantDias} días` : ''}
          {obj && <> · {obj.label}</>}
        </span>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={() => f.navigate('/rutinas')}>Cancelar</button>
        <button type="submit" form="form-rutina" className="gt-btn gt-btn-primary" disabled={f.guardando}>{textoGuardar}</button>
      </div>

      {f.lightbox && (
        <div className="gt-lightbox" onClick={() => f.setLightbox(null)} role="dialog" aria-label={f.lightbox.nombre}>
          <p>{f.lightbox.nombre}</p>
          <img src={f.lightbox.url} alt={f.lightbox.nombre} />
          <button type="button" onClick={() => f.setLightbox(null)}>Cerrar</button>
        </div>
      )}
    </div>
  )
}
