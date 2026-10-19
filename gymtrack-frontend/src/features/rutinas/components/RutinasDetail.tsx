import { useState } from 'react'
import { Link } from 'react-router-dom'
import MaquinasEjercicio from './MaquinasEjercicio'
import { Cog, Dumbbell, Flame, Link2, Lock, Pencil } from 'lucide-react'
import { PasesMeter } from '../../membresias/components/MembresiaResumen'
import { formatFecha } from '../../../shared/utils/fechas'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { etiquetaDia } from '../utils/rutinaUtils'
import { useRutinasDetail, TREN_CONFIG, DIAS_ORDER, resolverImgEstatica } from '../hooks/useRutinasDetail'
import { CargandoPagina, Spinner } from '../../../shared/components/ui'
import ListaAsignados from './ListaAsignados'
import type { Rutina } from '../types/Rutina'

export default function RutinasDetail() {
  const d = useRutinasDetail()
  // Socio: los ejercicios se ven plegados (nombre, series y máquina) y se abren de a uno
  const [abiertos, setAbiertos] = useState<Set<number>>(new Set())
  const [calorAbierto, setCalorAbierto] = useState(false)
  const toggleAbierto = (ejId: number) => setAbiertos(prev => {
    const s = new Set(prev)
    if (s.has(ejId)) s.delete(ejId); else s.add(ejId)
    return s
  })

  if (d.cargando) return <CargandoPagina resumen={false} filas={5} />
  if (!d.rutina) return <div className="gt-alert gt-alert-error">Rutina no encontrada</div>

  const { rutina, ejercicios } = d
  const calentamiento = ejercicios.filter(e => e.esCalentamiento)
  const principales = ejercicios.filter(e => !e.esCalentamiento)
  const dias = Array.from(new Set(principales.map(e => e.dia ?? 1))).sort((a, b) => a - b)
  const delDia = principales.filter(e => dias.length === 1 || (e.dia ?? 1) === d.diaActivo)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <button className="gt-btn gt-btn-secondary" onClick={() => d.navigate(d.esSocio ? '/mi-rutina' : '/rutinas')} style={{ marginBottom: 10 }}>← {d.esSocio ? 'Mi rutina' : 'Volver a Rutinas'}</button>
          <h1 className="gt-page-title" style={{ margin: 0 }}>{rutina.nombre}</h1>
          {rutina.descripcion && <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>{rutina.descripcion}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {rutina.socioId != null && principales.length > 0 && (
            <Link className="gt-btn gt-btn-primary"
              to={`/rutinas/${rutina.id}/entrenar?dia=${dias.length > 1 ? d.diaActivo : (dias[0] ?? 1)}${d.esSocio ? '' : `&socioId=${rutina.socioId}`}`}>
              ▶ Entrenar {dias.length > 1 ? etiquetaDia(rutina.diasSemana, d.diaActivo).replace(/^Día \d+ · /, '') : ''}
            </Link>
          )}
          {d.esAdmin && <Link to={d.linkEditar} className="gt-btn gt-btn-secondary">Editar rutina</Link>}
        </div>
      </div>

      {rutina.notasProfe && (
        <div className="gt-notas-profe" role="note">
          <strong>{d.esSocio ? 'Indicaciones de tu profe' : 'Indicaciones para el socio'}</strong>
          <p>{rutina.notasProfe}</p>
        </div>
      )}

      {d.error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 16 }}>
          {d.error}
          <button onClick={() => d.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Pases del mes (solo SOCIO con membresía activa) */}
      {d.esSocio && d.membresia && d.membresia.estadoMembresia === 'ACTIVA' && (
        <div className="gt-card" style={{ marginBottom: 16, padding: '12px 18px' }}>
          <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 6px' }}>
            {d.membresia.planNombre} · vence {formatFecha(d.membresia.fechaVencimiento)}
          </p>
          <PasesMeter m={d.membresia} compacto />
          {d.membresia.pasesRestantes === 0 && (
            <p className="gt-text-sm" style={{ margin: '6px 0 0', color: 'var(--red)' }}>
              Se acabaron tus pases de este mes. Consultá en recepción.
            </p>
          )}
        </div>
      )}

      {rutina.asignada && !d.esSocio && (
        <div className="gt-alert gt-alert-info" style={{ marginBottom: 16 }}>
          {rutina.socioNombre} tiene esta plantilla asignada tal cual. Si la editás, cambia para todos los socios que la tienen;
          para cambiarla solo para {rutina.socioNombre?.split(' ')[0] ?? 'este socio'}, usá "Ajustar" en su perfil.
        </div>
      )}

      {/* Info chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {(rutina.trenes ?? []).map(tid => {
          const cfg = TREN_CONFIG[tid]; if (!cfg) return null
          return <span key={tid} style={{ fontSize: 13, fontWeight: 700, borderRadius: 8, padding: '5px 14px', background: cfg.bg, color: cfg.color }}><cfg.icono size={14} aria-hidden /> {cfg.label}</span>
        })}
        {rutina.socioId === null
          ? <span style={{ fontSize: 13, fontWeight: 700, borderRadius: 8, padding: '5px 14px', background: 'var(--purple-bg)', color: 'var(--purple-text)' }}>Rutina general</span>
          : rutina.socioNombre && <span style={{ fontSize: 13, fontWeight: 600, borderRadius: 8, padding: '5px 14px', background: 'var(--blue-bg)', color: 'var(--blue-text)' }}>{rutina.socioNombre}</span>
        }
        {(rutina.diasSemana ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {DIAS_ORDER.filter(dia => rutina.diasSemana!.includes(dia)).map(dia => {
              const fin = dia === 'Sábado' || dia === 'Domingo'
              return <span key={dia} style={{ fontSize: 12, fontWeight: 700, borderRadius: 6, padding: '4px 10px', background: fin ? 'var(--yellow-bg)' : (d.trenInfo?.bg ?? 'var(--bg-surface-3)'), color: fin ? 'var(--yellow-text)' : (d.trenInfo?.color ?? 'var(--text-muted)') }}>{dia}</span>
            })}
          </div>
        )}
        <span style={{ fontSize: 13, borderRadius: 8, padding: '5px 14px', background: 'var(--bg-surface-3)', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Plantilla: a qué socios está asignada */}
      {rutina.socioId == null && d.esAdmin && <SociosDePlantilla plantilla={rutina} />}

      {/* Entrada en calor */}
      {calentamiento.length > 0 && (
        <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--yellow-text)' }}>
          <button type="button" disabled={!d.esSocio} onClick={() => setCalorAbierto(v => !v)} aria-expanded={!d.esSocio || calorAbierto}
            style={{ width: '100%', border: 'none', cursor: d.esSocio ? 'pointer' : 'default', textAlign: 'left', background: 'linear-gradient(90deg, #EA580C 0%, #F97316 100%)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flame size={18} color="#fff" aria-hidden />
            <span style={{ fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: 0.3 }}>ENTRADA EN CALOR</span>
            <span style={{ fontSize: 12, color: '#FFF7ED', marginLeft: 6, flex: 1 }}>({calentamiento.length} ejercicios de movilidad{d.esSocio ? '' : ' — inamovibles'})</span>
            {d.esSocio && <span style={{ color: '#fff', fontSize: 16 }}>{calorAbierto ? '▾' : '▸'}</span>}
          </button>
          {(!d.esSocio || calorAbierto) && (
          <div style={{ background: 'var(--bg-surface-2)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {calentamiento.map((ej, idx) => (
              <div key={ej.id ?? idx} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg-surface-3)', borderRadius: 8, border: '1px solid var(--border)', alignItems: 'center' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--yellow-bg)', color: 'var(--yellow-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{idx + 1}</div>
                {(() => {
                  const img = ej.imagenUrl || resolverImgEstatica(ej.nombreEjercicio)
                  return img ? (
                    <button type="button" onClick={() => d.setLightbox({ url: img, nombre: ej.nombreEjercicio })} title="Ver demostración"
                      style={{ background: '#fff', border: 'none', padding: 0, borderRadius: 7, cursor: 'zoom-in', flexShrink: 0 }}>
                      <img src={img} alt={ej.nombreEjercicio} loading="lazy" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, display: 'block' }}
                        onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }} />
                    </button>
                  ) : null
                })()}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{ej.nombreEjercicio}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                    {ej.series != null && <span><strong style={{ color: 'var(--text-secondary)' }}>{ej.series}</strong> series</span>}
                    {ej.repeticiones != null && <span>× <strong style={{ color: 'var(--text-secondary)' }}>{ej.repeticiones}</strong> reps</span>}
                    {ej.descansoSeg != null && ej.descansoSeg > 0 && <span>{ej.descansoSeg}s desc.</span>}
                  </div>
                  {ej.notas && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{ej.notas}</p>}
                </div>
                {d.esAdmin && (
                  <button type="button" onClick={() => d.abrirEdicion(ej)} title="Editar series/reps"
                    style={{ padding: '2px 7px', background: 'none', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, color: 'var(--yellow-text)', cursor: 'pointer' }}><Pencil size={12} aria-hidden /></button>
                )}
                {!d.esSocio && <span title="Ejercicio inamovible" style={{ fontSize: 16, color: 'var(--yellow-text)', marginLeft: 4, display: 'inline-flex' }}><Lock size={14} aria-hidden /></span>}
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Ejercicios principales */}
      <div className="gt-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Ejercicios principales
            <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>({principales.length})</span>
          </p>
          {d.esAdmin && (
            <button className="gt-btn gt-btn-primary" style={{ fontSize: 12 }}
              onClick={() => { d.setShowAgregar(v => !v); d.setBusqEj(''); d.setEjSel(null) }}>
              {d.showAgregar ? 'Cerrar' : '+ Agregar ejercicio'}
            </button>
          )}
        </div>

        {/* Panel agregar */}
        {d.showAgregar && d.esAdmin && (
          <div style={{ marginBottom: 16, padding: 14, background: 'var(--bg-surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <input className="gt-input" style={{ marginBottom: 10 }}
              placeholder={`Buscar ejercicio${d.gruposRutina.length > 0 && !d.hayFullBody ? ` de ${(rutina.trenes ?? []).map(tid => TREN_CONFIG[tid]?.label ?? tid).join('/')}` : ''}...`}
              value={d.busqEj} onChange={e => { d.setBusqEj(e.target.value); d.setEjSel(null) }} />
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.catalogoFiltrado.slice(0, 20).map(e => (
                <button type="button" key={e.id} aria-pressed={d.ejSel?.id === e.id} onClick={() => { d.setEjSel(e); d.setBusqEj(e.nombre) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', font: 'inherit', textAlign: 'left', color: 'inherit', width: '100%', border: '1px solid', borderColor: d.ejSel?.id === e.id ? 'var(--blue-text)' : 'var(--border)', background: d.ejSel?.id === e.id ? 'var(--blue-bg)' : 'var(--bg-surface)' }}
                  onMouseEnter={ev => { if (d.ejSel?.id !== e.id) ev.currentTarget.style.background = 'var(--bg-surface-2)' }}
                  onMouseLeave={ev => { if (d.ejSel?.id !== e.id) ev.currentTarget.style.background = 'var(--bg-surface)' }}>
                  {e.imagenUrl
                    ? <img src={e.imagenUrl} alt={e.nombre} style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                    : <div style={{ width: 34, height: 34, borderRadius: 5, background: 'var(--bg-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: 'var(--text-muted)' }}>{e.esMaquina ? <Cog size={16} aria-hidden /> : <Dumbbell size={16} aria-hidden />}</div>
                  }
                  <span style={{ flex: 1, fontWeight: d.ejSel?.id === e.id ? 700 : 400, fontSize: 13 }}>{e.nombre}</span>
                  {(e.grupos ?? []).slice(0, 2).map(g => (
                    <span key={g} style={{ fontSize: 10, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 4, padding: '1px 5px' }}>{g}</span>
                  ))}
                </button>
              ))}
              {d.busqEj && d.catalogoFiltrado.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0', textAlign: 'center' }}>Sin resultados. Escribí el nombre para agregar manualmente.</p>
              )}
            </div>
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Agregar al día:</label>
              {Array.from({ length: Math.max(rutina.diasSemana?.length ?? 0, dias[dias.length - 1] ?? 1, 1) }, (_, i) => i + 1).map(dia => (
                <button key={dia} type="button" onClick={() => d.setDiaAgregar(dia)}
                  style={{ padding: '4px 12px', borderRadius: 14, border: '1.5px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderColor: d.diaAgregar === dia ? 'var(--accent)' : 'var(--border)', background: d.diaAgregar === dia ? 'var(--accent)' : 'transparent', color: d.diaAgregar === dia ? 'var(--on-accent)' : 'var(--text-muted)' }}>
                  {etiquetaDia(rutina.diasSemana, dia)}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Series',       val: d.series,   set: (v: number) => d.setSeries(v),   min: 1,   max: 20  },
                { label: 'Repeticiones', val: d.reps,     set: (v: number) => d.setReps(v),     min: 1,   max: 200 },
                { label: 'Descanso (s)', val: d.descanso, set: (v: number) => d.setDescanso(v), min: 0,   max: 600 },
                { label: 'Peso (kg)',    val: d.peso,     set: (v: number) => d.setPeso(v),      min: 0,   max: 999 },
              ].map(({ label, val, set, min, max }) => (
                <div key={label}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{label}</label>
                  <input type="number" className="gt-input" min={min} max={max} value={val === '' ? '' : val}
                    onChange={e => set(Number(e.target.value))} placeholder="—" style={{ textAlign: 'center' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Notas</label>
                <input className="gt-input" value={d.notas} onChange={e => d.setNotas(e.target.value)} placeholder="Ej: Con agarre neutro..." maxLength={80} />
              </div>
            </div>
            <button className="gt-btn gt-btn-primary" disabled={d.agregando || (!d.ejSel && !d.busqEj.trim())} onClick={d.handleAgregar}>
              {d.agregando ? <><Spinner /> Guardando…</> : '✓ Agregar a la rutina'}
            </button>
          </div>
        )}

        {/* Lista de ejercicios por día */}
        {principales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: 8 }}><Dumbbell size={28} aria-hidden /></p>
            <p style={{ margin: 0 }}>Todavía no hay ejercicios principales.</p>
            {d.esAdmin && <p style={{ margin: '4px 0 0', fontSize: 12 }}>Usá "Agregar ejercicio" para agregar ejercicios al bloque principal.</p>}
          </div>
        ) : (
          <div>
            {dias.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {dias.map(dia => (
                  <button key={dia} type="button" onClick={() => d.setDiaActivo(dia)}
                    style={{ padding: '6px 16px', borderRadius: 20, border: '2px solid', borderColor: d.diaActivo === dia ? 'var(--accent)' : 'var(--border)', background: d.diaActivo === dia ? 'var(--accent)' : 'var(--bg-surface)', color: d.diaActivo === dia ? 'var(--on-accent)' : 'var(--text-secondary)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {etiquetaDia(rutina.diasSemana, dia)}
                    <span style={{ fontWeight: 400, marginLeft: 5, fontSize: 11, opacity: 0.8 }}>({principales.filter(e => (e.dia ?? 1) === dia).length} ej.)</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {delDia.map((ej, idx) => {
                const siguiente = delDia[idx + 1]
                const unidoConSiguiente = ej.superserie != null && siguiente?.superserie === ej.superserie
                const enSuperserie = ej.superserie != null && delDia.some(x => x.id !== ej.id && x.superserie === ej.superserie)
                const maks = d.resolverMaquinas(ej.maquinaIds)
                const ejGrupos = (ej.grupos && ej.grupos.length > 0) ? ej.grupos : d.gruposRutina
                const maqRecomendadas = ejGrupos.length > 0
                  ? d.maquinas.filter(m => (m.grupos ?? []).some(g => ejGrupos.includes(g)) && !maks.some(a => a.id === m.id)).slice(0, 5)
                  : []
                const gifUrl = ej.imagenUrl || d.gifCache[ej.nombreEjercicio] || resolverImgEstatica(ej.nombreEjercicio ?? '')

                if (d.esSocio) {
                  const abierto = abiertos.has(ej.id!)
                  const nros = (ej.maquinas ?? []).map(m => m.nroMaquina).filter(Boolean)
                  return (
                    <div key={ej.id ?? idx} className="gt-ej-plegable">
                      <button type="button" className="gt-ej-plegable-cab" onClick={() => toggleAbierto(ej.id!)} aria-expanded={abierto}>
                        <span className="gt-ej-plegable-n" style={{ background: d.trenInfo?.bg ?? 'var(--bg-surface-3)', color: d.trenInfo?.color ?? 'var(--text-muted)' }}>{idx + 1}</span>
                        {gifUrl
                          ? <img src={gifUrl} alt="" className="gt-ej-plegable-img" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden' }} />
                          : <span className="gt-ej-plegable-img" aria-hidden>{ej.esMaquina ? <Cog size={18} /> : <Dumbbell size={18} />}</span>}
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="gt-ej-plegable-nombre">{ej.nombreEjercicio}</span>
                          <span className="gt-ej-plegable-sub">
                            {ej.series ?? '?'} × {ej.repeticiones ?? '?'}{ej.pesoKg != null ? ` · ${ej.pesoKg} kg` : ''}
                            {nros.length > 0 && <> · <strong>Máquina N° {nros.join(', ')}</strong></>}
                            {enSuperserie && <> · <span className="gt-superserie-chip"><Link2 size={11} aria-hidden /> superserie</span></>}
                          </span>
                        </span>
                        <span aria-hidden style={{ fontSize: 18, color: 'var(--text-muted)' }}>{abierto ? '▾' : '▸'}</span>
                      </button>
                      {abierto && (
                        <div className="gt-ej-plegable-cuerpo">
                          {gifUrl && (
                            <button type="button" onClick={() => d.setLightbox({ url: gifUrl, nombre: ej.nombreEjercicio })} title="Ver en grande"
                              style={{ border: 'none', padding: 0, background: 'var(--bg-surface-2)', borderRadius: 10, cursor: 'zoom-in', width: '100%' }}>
                              <img src={gifUrl} alt={ej.nombreEjercicio} style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', borderRadius: 10 }}
                                onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }} />
                            </button>
                          )}
                          <MaquinasEjercicio maquinas={ej.maquinas} grande />
                          {ej.descansoSeg != null && ej.descansoSeg > 0 && <p className="gt-text-sm gt-text-muted" style={{ margin: 0 }}>Descanso entre series: {ej.descansoSeg}s</p>}
                          {ej.notas && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>{ej.notas}</p>}
                          {ej.descripcionEjercicio && (
                            <details>
                              <summary className="gt-text-sm" style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}>¿Cómo se hace?</summary>
                              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{ej.descripcionEjercicio}</p>
                            </details>
                          )}
                          {ej.id && (
                            <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px dashed var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                              <span style={{ width: '100%', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Mi sesión de hoy</span>
                              {[
                                { label: 'Series',    field: 'seriesRealizadas'  as const, placeholder: String(ej.series ?? '—') },
                                { label: 'Reps',      field: 'repeticionesReales' as const, placeholder: String(ej.repeticiones ?? '—') },
                                { label: 'Peso (kg)', field: 'pesoKg'            as const, placeholder: ej.pesoKg != null ? String(ej.pesoKg) : '—' },
                              ].map(({ label, field, placeholder }) => (
                                <div key={field} style={{ flex: '1 1 60px', maxWidth: 90 }}>
                                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>{label}</label>
                                  <input type="number" inputMode="decimal" min={0} max={999} className="gt-input"
                                    value={d.progresoHoy[ej.id!]?.[field] ?? ''}
                                    onChange={e => d.setProgresoHoy(p => ({ ...p, [ej.id!]: { ...p[ej.id!], [field]: e.target.value ? Number(e.target.value) : undefined } }))}
                                    style={{ textAlign: 'center', padding: '5px 6px' }} placeholder={placeholder} />
                                </div>
                              ))}
                              <button type="button" className="gt-btn gt-btn-primary gt-btn-sm" disabled={d.guardandoProgreso === ej.id} onClick={() => d.handleGuardarProgreso(ej.id!)}>
                                {d.guardandoProgreso === ej.id ? '…' : '✓ Guardar'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={ej.id ?? idx}>
                    <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--bg-surface-2)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: d.trenInfo?.bg ?? 'var(--bg-surface-3)', color: d.trenInfo?.color ?? 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 2 }}>{idx + 1}</div>

                      {gifUrl ? (
                        <button onClick={() => d.setLightbox({ url: gifUrl, nombre: ej.nombreEjercicio })} title="Ver demostración"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                          <img src={gifUrl} alt={ej.nombreEjercicio} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, display: 'block', transition: 'opacity .15s' }}
                            onMouseEnter={ev => (ev.currentTarget.style.opacity = '0.75')}
                            onMouseLeave={ev => (ev.currentTarget.style.opacity = '1')} />
                          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 3, padding: '0 3px', lineHeight: '14px', pointerEvents: 'none' }}>▶</span>
                        </button>
                      ) : (
                        <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--bg-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, color: 'var(--text-muted)' }}>{ej.esMaquina ? <Cog size={24} aria-hidden /> : <Dumbbell size={24} aria-hidden />}</div>
                      )}

                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{ej.nombreEjercicio}</p>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong>{ej.series ?? '?'}</strong> series</span>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong>{ej.repeticiones ?? '?'}</strong> reps</span>
                          {ej.descansoSeg != null && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ej.descansoSeg}s desc.</span>}
                          {ej.pesoKg != null && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ej.pesoKg} kg</span>}
                          {d.esAdmin && (
                            <button type="button" onClick={() => d.abrirEdicion(ej)} title="Editar"
                              style={{ marginLeft: 2, padding: '2px 7px', background: 'none', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}><Pencil size={12} aria-hidden /></button>
                          )}
                        </div>
                        {(ej.grupos ?? []).length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                            {ej.grupos!.map(g => <span key={g} style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>{g}</span>)}
                          </div>
                        )}
                        {maks.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: 'var(--yellow-text)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Máquinas asignadas</p>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {maks.map(m => <span key={m.id} style={{ fontSize: 11, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', borderRadius: 5, padding: '2px 8px', fontWeight: 600, border: '1px solid var(--border)' }}>{m.nroMaquina ? `${m.nroMaquina} — ` : ''}{m.nombre}</span>)}
                            </div>
                          </div>
                        )}
                        {maqRecomendadas.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Máquinas recomendadas</p>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {maqRecomendadas.map(m => <span key={m.id} style={{ fontSize: 11, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', borderRadius: 5, padding: '2px 8px', fontWeight: 500, border: '1px solid var(--border)' }}>{m.nroMaquina ? `${m.nroMaquina} — ` : ''}{m.nombre}</span>)}
                            </div>
                          </div>
                        )}
                        {ej.descripcionEjercicio && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{ej.descripcionEjercicio}</p>}
                        {ej.notas && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{ej.notas}</p>}
                      </div>

                      {d.esAdmin && (
                        <button onClick={() => d.setConfirmarQuitarId(ej.id!)} disabled={d.eliminandoId === ej.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, alignSelf: 'flex-start', padding: '2px 4px', transition: 'color 0.1s' }}
                          onMouseEnter={ev => (ev.currentTarget.style.color = 'var(--red)')}
                          onMouseLeave={ev => (ev.currentTarget.style.color = 'var(--text-muted)')}>
                          {d.eliminandoId === ej.id ? '…' : '✕'}
                        </button>
                      )}
                    </div>

                    {/* Unir con el siguiente en superserie */}
                    {d.esAdmin && siguiente && (
                      <div className={`gt-superserie-union${unidoConSiguiente ? ' unidos' : ''}`}>
                        {unidoConSiguiente ? (
                          <>
                            <span><Link2 size={14} aria-hidden /> Superserie con el siguiente</span>
                            <button type="button" onClick={() => d.superserie(siguiente.id!, false)}>Separar</button>
                          </>
                        ) : (
                          <button type="button" onClick={() => d.superserie(ej.id!, true)}><Link2 size={14} aria-hidden /> Unir con el siguiente en superserie</button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {d.lightbox && (
        <div onClick={() => d.setLightbox(null)} onKeyDown={e => e.key === 'Escape' && d.setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 24 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 16px', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{d.lightbox.nombre}</p>
          <img src={d.lightbox.url} alt={d.lightbox.nombre} onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
          <button onClick={() => d.setLightbox(null)}
            style={{ marginTop: 20, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 8, padding: '8px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>✕ Cerrar</button>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 }}>Hacé clic fuera de la imagen o presioná Escape para cerrar</p>
        </div>
      )}

      {/* Modal edición */}
      {d.editingId !== null && (
        <div onClick={() => d.setEditingId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 24, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Editar ejercicio</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Series',        val: d.editSeries,   set: d.setEditSeries,   min: 1,  max: 99  },
                { label: 'Repeticiones',  val: d.editReps,     set: d.setEditReps,     min: 1,  max: 999 },
                { label: 'Descanso (seg)',val: d.editDescanso, set: d.setEditDescanso, min: 0,  max: 600 },
                { label: 'Peso (kg)',     val: d.editPeso,     set: d.setEditPeso,     min: 0,  max: 999 },
              ].map(({ label, val, set, min, max }) => (
                <div key={label}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input className="gt-input" type="number" min={min} max={max} value={val} onChange={e => set(e.target.value)} placeholder="—" style={{ textAlign: 'center' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="gt-btn gt-btn-primary" style={{ flex: 1 }} disabled={d.guardandoEdit} onClick={() => d.guardarEdicion(d.editingId!)}>
                {d.guardandoEdit ? <><Spinner /> Guardando…</> : '✓ Guardar cambios'}
              </button>
              <button type="button" className="gt-btn" onClick={() => d.setEditingId(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={d.confirmarQuitarId !== null}
        title="Quitar ejercicio"
        message="¿Estás seguro que querés quitar este ejercicio de la rutina?"
        confirmLabel="Quitar" cancelLabel="Cancelar" danger
        onConfirm={() => { const ejId = d.confirmarQuitarId!; d.setConfirmarQuitarId(null); d.handleEliminar(ejId) }}
        onCancel={() => d.setConfirmarQuitarId(null)}
      />
    </div>
  )
}

/** En la pantalla de una plantilla: la lista de socios que la tienen asignada */
function SociosDePlantilla({ plantilla }: { plantilla: Rutina }) {
  const [cantidad, setCantidad] = useState<number | null>(null)
  return (
    <div className="gt-card gt-mb-20">
      <p className="gt-card-title" style={{ marginTop: 0 }}>
        Socios con esta plantilla{cantidad != null && <span className="gt-text-muted gt-peso-normal"> ({cantidad})</span>}
      </p>
      <ListaAsignados plantilla={plantilla} onCambio={n => setCantidad(n)} />
    </div>
  )
}
