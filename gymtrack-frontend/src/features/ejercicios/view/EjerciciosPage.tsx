import { useState, useEffect, useRef } from 'react'
import {
  listarTodosEjercicios, crearEjercicio, actualizarEjercicio,
  desactivarEjercicio, activarEjercicio, browseCatalogo, GRUPOS_CATEGORIAS,
  type Ejercicio,
} from '../services/ejercicioService'
import { listarMaquinas, type Maquina } from '../../maquinas/services/maquinaService'
import {
  EXERCISES_CATALOG, CATALOG_BODY_PARTS, ENGLISH_NAMES, type CatalogExercise,
} from '../assets/exercisesCatalog'

// ── Constantes ──────────────────────────────────────────────────────────────
const VACIO: Ejercicio = {
  nombre: '', descripcion: '', grupos: [], esMaquina: false,
  activo: true, imagenUrl: '', maquinaIds: [],
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function EjerciciosPage() {
  const [tab, setTab] = useState<'catalogo' | 'mis'>('catalogo')

  // ── Estado catálogo estático ────────────────────────────────────────────
  const [catBodyPart, setCatBodyPart] = useState('')
  const [catQ, setCatQ] = useState('')
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)
  const [guardandoCat, setGuardandoCat] = useState<string | null>(null)
  const timerCat = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [catQActivo, setCatQActivo] = useState('')

  // ── Estado mis ejercicios ───────────────────────────────────────────────
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState<Ejercicio>({ ...VACIO })
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [verInactivos, setVerInactivos] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendoImg, setSubiendoImg] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const imgRef = useRef<HTMLInputElement>(null)

  // Lightbox / demo mode
  const [lightbox, setLightbox] = useState<{ url: string; nombre: string } | null>(null)

  // GIF cache para ejercicios del catálogo (id → gifUrl)
  const [gifCache, setGifCache] = useState<Record<string, string>>({})
  const [loadingGif, setLoadingGif] = useState<string | null>(null)

  // Estado para quitar máquina de ejercicio
  const [quitandoMaquina, setQuitandoMaquina] = useState<string | null>(null)

  // ── Carga inicial ───────────────────────────────────────────────────────
  const cargarLocales = async () => {
    try {
      const [ejs, maks] = await Promise.all([listarTodosEjercicios(), listarMaquinas(false)])
      setEjercicios(ejs); setMaquinas(maks)
    } catch { setError('Error al cargar') }
  }

  useEffect(() => { cargarLocales() }, [])

  // Filtrado del catálogo estático
  const catFiltrados = EXERCISES_CATALOG.filter(ex => {
    const matchGrupo = !catBodyPart || ex.bodyPart === catBodyPart
    const matchQ = !catQActivo ||
      ex.name.toLowerCase().includes(catQActivo.toLowerCase()) ||
      ex.target.toLowerCase().includes(catQActivo.toLowerCase())
    return matchGrupo && matchQ
  })

  // Búsqueda con debounce
  const handleCatQ = (q: string) => {
    setCatQ(q)
    if (timerCat.current) clearTimeout(timerCat.current)
    timerCat.current = setTimeout(() => setCatQActivo(q), 300)
  }

  // Buscar GIF via backend proxy (exercisedb-api.vercel.app)
  const buscarGif = async (exerciseId: string): Promise<string | null> => {
    const englishName = ENGLISH_NAMES[exerciseId]
    if (!englishName) return null
    try {
      const results = await browseCatalogo(undefined, englishName, 1, 0)
      return results[0]?.gifUrl ?? null
    } catch {
      return null
    }
  }

  // Abrir lightbox para ejercicio del catálogo
  // Prioridad: cache → gifUrl (GitHub CDN) → ExerciseDB API (fallback)
  const abrirGifCatalogo = async (ex: CatalogExercise) => {
    const cached = gifCache[ex.id]
    if (cached) { setLightbox({ url: cached, nombre: ex.name }); return }
    // Si ya tenemos la URL del GitHub CDN, la usamos directamente
    if (ex.gifUrl) { setLightbox({ url: ex.gifUrl, nombre: ex.name }); return }
    // Fallback: intentar ExerciseDB API
    setLoadingGif(ex.id)
    const url = await buscarGif(ex.id)
    setLoadingGif(null)
    if (url) {
      setGifCache(c => ({ ...c, [ex.id]: url }))
      setLightbox({ url, nombre: ex.name })
    } else {
      setError('No se encontró imagen para este ejercicio.')
    }
  }

  // Guardar ejercicio del catálogo a "Mis ejercicios"
  const guardarDeCatalogo = async (ex: CatalogExercise) => {
    setGuardandoCat(ex.id)
    try {
      const grupos: string[] = [ex.bodyPart]
      const instrText = ex.instructions?.join('\n') || ''
      // Usar URL del CDN (ya en ex.gifUrl) o cache; evitar llamada al API caído
      const gifUrl = gifCache[ex.id] ?? ex.gifUrl ?? undefined
      await crearEjercicio({
        nombre: ex.name,
        descripcion: instrText.substring(0, 2000) || undefined,
        grupos,
        esMaquina: !['Peso corporal', 'Barra', 'Mancuernas', 'Soga'].includes(ex.equipment),
        activo: true,
        imagenUrl: gifUrl || ex.gifUrl || undefined,
        maquinaIds: [],
      })
      setMsg(`✓ "${ex.name}" guardado en Mis ejercicios`)
      await cargarLocales()
    } catch {
      setError('Error al guardar el ejercicio')
    } finally {
      setGuardandoCat(null)
    }
  }

  // ── Mis ejercicios — helpers ────────────────────────────────────────────
  const filtrados = ejercicios.filter(e => {
    if (e.esMaquina) return false
    if (!verInactivos && !e.activo) return false
    const matchBusq = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchGrupo = !filtroGrupo || (e.grupos ?? []).includes(filtroGrupo)
    return matchBusq && matchGrupo
  })

  const maquinasCompatibles = (grupos: string[]): Maquina[] => {
    if (!grupos || grupos.length === 0) return maquinas.filter(m => m.activa)
    return maquinas.filter(m => m.activa && (m.grupos ?? []).some(g => grupos.includes(g)))
  }

  const abrirNuevo = () => {
    setForm({ ...VACIO }); setEditandoId(null); setShowForm(true); setError(null); setExpandedId(null)
    setTimeout(() => document.getElementById('ej-nombre')?.focus(), 50)
  }
  const abrirEditar = (e: Ejercicio) => {
    setForm({ ...e, grupos: e.grupos ? [...e.grupos] : [], maquinaIds: e.maquinaIds ? [...e.maquinaIds] : [] })
    setEditandoId(e.id!); setShowForm(true); setError(null); setExpandedId(null)
  }
  const cancelar = () => { setShowForm(false); setForm({ ...VACIO }); setEditandoId(null) }

  const toggleGrupoForm = (g: string) =>
    setForm(f => ({
      ...f,
      grupos: (f.grupos ?? []).includes(g)
        ? (f.grupos ?? []).filter(x => x !== g)
        : [...(f.grupos ?? []), g],
    }))

  const toggleMaquinaForm = (mid: number) =>
    setForm(f => {
      const ids = f.maquinaIds ?? []
      return { ...f, maquinaIds: ids.includes(mid) ? ids.filter(i => i !== mid) : [...ids, mid] }
    })

  const handleImagen = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]; if (!file) return
    setSubiendoImg(true)
    try { setForm(f => ({ ...f, imagenUrl: '' })); const b = await resizeImage(file); setForm(f => ({ ...f, imagenUrl: b })) }
    catch { setError('Error al procesar imagen') }
    finally { setSubiendoImg(false) }
  }

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError(null)
    try {
      if (editandoId) { await actualizarEjercicio(editandoId, form); setMsg('Ejercicio actualizado.') }
      else { await crearEjercicio(form); setMsg('Ejercicio creado.') }
      cancelar(); await cargarLocales()
    } catch { setError('Error al guardar') } finally { setGuardando(false) }
  }

  const toggleActivo = async (e: Ejercicio) => {
    try {
      if (e.activo) await desactivarEjercicio(e.id!)
      else await activarEjercicio(e.id!)
      await cargarLocales()
    } catch { setError('Error al cambiar estado') }
  }

  const quitarMaquina = async (e: Ejercicio, maquinaId: number) => {
    const key = `${e.id}-${maquinaId}`
    setQuitandoMaquina(key)
    try {
      const nuevosIds = (e.maquinaIds ?? []).filter(id => id !== maquinaId)
      await actualizarEjercicio(e.id!, { ...e, maquinaIds: nuevosIds })
      await cargarLocales()
      setMsg('Máquina desasignada')
    } catch { setError('Error al quitar la máquina') }
    finally { setQuitandoMaquina(null) }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Ejercicios</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            Catálogo de más de 1000 ejercicios con GIFs animados
          </p>
        </div>
        {tab === 'mis' && (
          <button className="gt-btn gt-btn-primary" onClick={abrirNuevo}>+ Nuevo ejercicio</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #E5E7EB' }}>
        {([['catalogo', '📚 Catálogo ExerciseDB'], ['mis', '⭐ Mis ejercicios']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === key ? 700 : 400,
              background: 'none', borderBottom: tab === key ? '2px solid #2E75B6' : '2px solid transparent',
              color: tab === key ? '#2E75B6' : '#6B7280', marginBottom: -2, transition: 'all 0.15s',
            }}>
            {label}
            {key === 'mis' && ejercicios.filter(e => !e.esMaquina && e.activo).length > 0 && (
              <span style={{ marginLeft: 7, fontSize: 11, background: '#EFF6FF', color: '#2E75B6', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                {ejercicios.filter(e => !e.esMaquina && e.activo).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mensajes globales */}
      {msg && (
        <div className="gt-alert" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A', marginBottom: 12 }}>
          {msg}
          <button onClick={() => setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: CATÁLOGO EXERCISEDB
      ════════════════════════════════════════════════════════ */}
      {tab === 'catalogo' && (
        <div>
          {/* Filtros */}
          <div className="gt-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input className="gt-input" style={{ flex: 1 }}
                placeholder="Buscar ejercicio o músculo…"
                value={catQ}
                onChange={e => handleCatQ(e.target.value)} />
              {catQ && (
                <button className="gt-btn gt-btn-secondary" onClick={() => { setCatQ(''); setCatQActivo('') }}>
                  Limpiar
                </button>
              )}
            </div>

            {/* Chips de grupo muscular */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setCatBodyPart('')}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
                  fontWeight: !catBodyPart ? 700 : 400,
                  background: !catBodyPart ? '#2E75B6' : '#fff',
                  color: !catBodyPart ? '#fff' : '#374151',
                  borderColor: !catBodyPart ? '#2E75B6' : '#D1D5DB',
                }}>
                Todos ({EXERCISES_CATALOG.length})
              </button>
              {CATALOG_BODY_PARTS.map(bp => {
                const count = EXERCISES_CATALOG.filter(e => e.bodyPart === bp).length
                return (
                  <button key={bp} onClick={() => setCatBodyPart(bp === catBodyPart ? '' : bp)}
                    style={{
                      padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
                      fontWeight: catBodyPart === bp ? 700 : 400,
                      background: catBodyPart === bp ? '#2E75B6' : '#EFF6FF',
                      color: catBodyPart === bp ? '#fff' : '#2E75B6',
                      borderColor: catBodyPart === bp ? '#2E75B6' : '#BFDBFE',
                    }}>
                    {bp} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contador */}
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6B7280' }}>
            {catFiltrados.length} ejercicio{catFiltrados.length !== 1 ? 's' : ''} encontrados
          </p>

          {/* Grid de ejercicios */}
          {catFiltrados.length > 0 && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 14,
                marginBottom: 20,
              }}>
                {catFiltrados.map(ex => {
                  const yaGuardado = ejercicios.some(e => e.nombre.toLowerCase() === ex.name.toLowerCase())
                  const cargando = guardandoCat === ex.id
                  const isExp = expandedCatId === ex.id
                  const gifCached = gifCache[ex.id]
                  const gifLoading = loadingGif === ex.id

                  return (
                    <div key={ex.id} style={{
                      border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden',
                      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'box-shadow 0.15s, transform 0.15s',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}
                      onClick={() => setExpandedCatId(isExp ? null : ex.id)}>

                      {/* Imagen o emoji */}
                      <div
                        style={{ position: 'relative', background: '#F3F4F6', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: gifCached ? 'zoom-in' : 'pointer' }}
                        onClick={ev => { ev.stopPropagation(); abrirGifCatalogo(ex) }}
                        title="Ver GIF animado"
                      >
                        {(ex.gifUrl || gifCached) ? (
                          <img src={gifCached || ex.gifUrl} alt={ex.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 40 }}>💪</span>
                            {gifLoading
                              ? <span style={{ fontSize: 11, color: '#6B7280' }}>Cargando GIF…</span>
                              : <span style={{ fontSize: 11, color: '#2E75B6', fontWeight: 600 }}>▶ Ver GIF</span>
                            }
                          </div>
                        )}
                        {(ex.gifUrl || gifCached) && (
                          <span style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>▶ GIF</span>
                        )}
                        {/* Badge grupo */}
                        <span style={{
                          position: 'absolute', top: 8, left: 8,
                          fontSize: 10, fontWeight: 700,
                          background: 'rgba(46,117,182,0.9)', color: '#fff',
                          borderRadius: 6, padding: '2px 7px',
                        }}>
                          {ex.bodyPart}
                        </span>
                        {yaGuardado && (
                          <span style={{
                            position: 'absolute', top: 8, right: 8,
                            fontSize: 10, fontWeight: 700,
                            background: 'rgba(22,163,74,0.9)', color: '#fff',
                            borderRadius: 6, padding: '2px 7px',
                          }}>
                            ✓ Guardado
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{
                          margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#111827',
                          textTransform: 'capitalize', lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {ex.name}
                        </p>
                        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize' }}>
                          {ex.equipment} · {ex.target}
                        </p>

                        {/* Instrucciones expandidas */}
                        {isExp && ex.instructions?.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
                              {ex.instructions.slice(0, 4).map((inst, i) => (
                                <li key={i} style={{ marginBottom: 3 }}>{inst}</li>
                              ))}
                            </ol>
                            <button
                              onClick={ev => { ev.stopPropagation(); abrirGifCatalogo(ex) }}
                              disabled={gifLoading}
                              style={{
                                marginTop: 6, background: 'none', border: '1px solid #D1D5DB',
                                borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
                                color: '#6B7280', width: '100%',
                              }}>
                              {gifLoading ? '⏳ Cargando…' : '▶ Ver demostración'}
                            </button>
                          </div>
                        )}

                        {/* Botón guardar */}
                        <button
                          className={yaGuardado ? 'gt-btn gt-btn-secondary' : 'gt-btn gt-btn-primary'}
                          style={{ width: '100%', fontSize: 12, padding: '6px 0' }}
                          disabled={cargando || yaGuardado}
                          onClick={ev => { ev.stopPropagation(); if (!yaGuardado) guardarDeCatalogo(ex) }}
                        >
                          {cargando ? '⏳ Guardando…' : yaGuardado ? '✓ En mis ejercicios' : '+ Guardar en mis ejercicios'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

            </>
          )}

          {/* Sin resultados */}
          {catFiltrados.length === 0 && (
            <div className="gt-card" style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: 24, marginBottom: 6 }}>🔍</p>
              <p style={{ margin: 0 }}>Sin resultados para "{catQActivo || catBodyPart}"</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: MIS EJERCICIOS
      ════════════════════════════════════════════════════════ */}
      {tab === 'mis' && (
        <div>
          {/* Formulario inline */}
          {showForm && (
            <div className="gt-card" style={{ marginBottom: 20, border: '2px solid #2E75B6' }}>
              <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: '#111827' }}>
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
                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                                      borderColor: sel ? '#2E75B6' : '#D1D5DB',
                                      background: sel ? '#EFF6FF' : '#fff',
                                      color: sel ? '#2E75B6' : '#6B7280',
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
                            style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, imagenUrl: '' }))}
                            style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div onClick={() => imgRef.current?.click()}
                          style={{ border: '2px dashed #D1D5DB', borderRadius: 8, padding: '18px 0', textAlign: 'center', cursor: 'pointer', color: '#9CA3AF', fontSize: 13, background: '#F9FAFB' }}>
                          {subiendoImg ? '⏳ Procesando…' : '📷 Subir imagen o GIF'}
                        </div>
                      )}
                      <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagen} />
                    </div>

                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>🔧 Máquinas asociadas</span>
                        {(form.maquinaIds ?? []).length > 0 && (
                          <span style={{
                            fontSize: 11, background: '#2E75B6', color: '#fff',
                            borderRadius: 10, padding: '1px 8px', fontWeight: 700,
                          }}>
                            {(form.maquinaIds ?? []).length} seleccionada{(form.maquinaIds ?? []).length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </label>

                      {maquinasCompatibles(form.grupos ?? []).length === 0 ? (
                        <div style={{
                          marginTop: 6, background: '#F9FAFB',
                          border: '1.5px dashed #D1D5DB', borderRadius: 8,
                          padding: '14px', textAlign: 'center',
                        }}>
                          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                            {(form.grupos ?? []).length === 0
                              ? '👆 Seleccioná grupos musculares para ver máquinas compatibles'
                              : 'Sin máquinas disponibles para estos grupos'}
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {maquinasCompatibles(form.grupos ?? []).map(m => {
                            const sel = (form.maquinaIds ?? []).includes(m.id!)
                            return (
                              <button key={m.id} type="button" onClick={() => toggleMaquinaForm(m.id!)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '5px 10px 5px 6px', borderRadius: 20, fontSize: 12,
                                  cursor: 'pointer', transition: 'all 0.15s',
                                  border: `2px solid ${sel ? '#2E75B6' : '#E5E7EB'}`,
                                  background: sel ? '#EFF6FF' : '#fff',
                                  color: sel ? '#1D4ED8' : '#6B7280',
                                  fontWeight: sel ? 700 : 400,
                                  boxShadow: sel ? '0 0 0 2px rgba(46,117,182,0.12)' : 'none',
                                }}>
                                <span style={{
                                  background: sel ? '#2E75B6' : '#F3F4F6',
                                  color: sel ? '#fff' : '#9CA3AF',
                                  borderRadius: 10, padding: '1px 6px',
                                  fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                                  minWidth: 22, textAlign: 'center',
                                }}>
                                  {m.nroMaquina ?? '?'}
                                </span>
                                {sel && <span style={{ fontSize: 10, color: '#2E75B6' }}>✓</span>}
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
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button onClick={() => setFiltroGrupo('')} type="button"
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                    fontWeight: !filtroGrupo ? 700 : 400,
                    background: !filtroGrupo ? '#2E75B6' : '#fff',
                    color: !filtroGrupo ? '#fff' : '#374151',
                    borderColor: !filtroGrupo ? '#2E75B6' : '#D1D5DB',
                  }}>
                  Todos
                </button>
              </div>
              {GRUPOS_CATEGORIAS.map(cat => (
                <div key={cat.label} style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF', minWidth: 88, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {cat.label}
                  </span>
                  {cat.grupos.map(g => (
                    <button key={g} type="button" onClick={() => setFiltroGrupo(g === filtroGrupo ? '' : g)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                        fontWeight: filtroGrupo === g ? 700 : 400,
                        background: filtroGrupo === g ? '#2E75B6' : '#EFF6FF',
                        color: filtroGrupo === g ? '#fff' : '#2E75B6',
                        borderColor: filtroGrupo === g ? '#2E75B6' : '#BFDBFE',
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
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9CA3AF' }}>
              {filtrados.length} ejercicio{filtrados.length !== 1 ? 's' : ''}
            </p>

            {filtrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
                <p style={{ fontSize: 28, marginBottom: 6 }}>💪</p>
                <p style={{ margin: '0 0 12px' }}>
                  {ejercicios.filter(e => !e.esMaquina).length === 0
                    ? 'Todavía no hay ejercicios guardados.'
                    : 'Sin resultados para esa búsqueda.'}
                </p>
                {ejercicios.filter(e => !e.esMaquina).length === 0 && (
                  <button className="gt-btn gt-btn-secondary" onClick={() => setTab('catalogo')}>
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
                    <div key={e.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        background: isExp ? '#F0F9FF' : (e.activo ? '#fff' : '#FAFAFA'),
                        opacity: e.activo ? 1 : 0.65, cursor: 'pointer', transition: 'background 0.1s',
                      }}
                        onClick={() => setExpandedId(isExp ? null : e.id!)}>

                        {e.imagenUrl ? (
                          <button
                            onClick={ev => { ev.stopPropagation(); setLightbox({ url: e.imagenUrl!, nombre: e.nombre }) }}
                            title="Ver demostración"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                            <img src={e.imagenUrl} alt={e.nombre}
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, border: '1px solid #E5E7EB', display: 'block', transition: 'opacity .15s' }}
                              onMouseEnter={ev => (ev.currentTarget.style.opacity = '0.7')}
                              onMouseLeave={ev => (ev.currentTarget.style.opacity = '1')} />
                            <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 9, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 2, padding: '0 2px', lineHeight: '13px', pointerEvents: 'none' }}>▶</span>
                          </button>
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 7, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            💪
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{e.nombre}</span>
                            {!e.activo && (
                              <span style={{ fontSize: 10, background: '#FEF2F2', color: '#DC2626', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>INACTIVO</span>
                            )}
                          </div>
                          {e.grupos && e.grupos.length > 0 && (
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                              {e.grupos.map(g => (
                                <span key={g} style={{ fontSize: 11, background: '#EFF6FF', color: '#2E75B6', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {maquinasEj.length > 0 && (
                          <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 6, padding: '2px 8px', fontWeight: 600, flexShrink: 0 }}>
                            ⚙ {maquinasEj.length} máq.
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{isExp ? '▲' : '▼'}</span>

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
                        <div style={{ padding: '14px 16px 16px 70px', background: '#F8FBFF', borderTop: '1px solid #E5E7EB' }}>
                          {e.descripcion && (
                            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                              {e.descripcion}
                            </p>
                          )}

                          {/* Máquinas asignadas */}
                          {maquinasAsig.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <p style={{ margin: '0 0 7px', fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                🔧 Máquinas asignadas
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {maquinasAsig.map(m => {
                                  const key = `${e.id}-${m.id}`
                                  const cargando = quitandoMaquina === key
                                  return (
                                    <div key={m.id} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6,
                                      background: '#FFFBEB', border: '1.5px solid #F59E0B',
                                      borderRadius: 20, padding: '4px 6px 4px 8px',
                                      boxShadow: '0 1px 3px rgba(245,158,11,0.15)',
                                    }}>
                                      <span style={{
                                        background: '#F59E0B', color: '#fff',
                                        borderRadius: 10, padding: '0 6px',
                                        fontSize: 11, fontWeight: 800, fontFamily: 'monospace',
                                        minWidth: 22, textAlign: 'center', lineHeight: '18px',
                                      }}>
                                        {m.nroMaquina ?? '?'}
                                      </span>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>{m.nombre}</span>
                                      <button
                                        disabled={cargando}
                                        onClick={ev => { ev.stopPropagation(); quitarMaquina(e, m.id!) }}
                                        title="Quitar máquina"
                                        style={{
                                          background: 'none', border: 'none',
                                          color: '#D97706', fontWeight: 700, fontSize: 14,
                                          cursor: cargando ? 'not-allowed' : 'pointer',
                                          padding: '0 2px', lineHeight: 1,
                                          opacity: cargando ? 0.4 : 1,
                                        }}>
                                        {cargando ? '…' : '×'}
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Máquinas compatibles sin asignar */}
                          {maquinasEj.filter(m => !maquinasAsig.some(x => x.id === m.id)).length > 0 && (
                            <div style={{ marginBottom: maquinasAsig.length > 0 ? 0 : 0 }}>
                              <p style={{ margin: '0 0 7px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Compatibles por grupo
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {maquinasEj.filter(m => !maquinasAsig.some(x => x.id === m.id)).map(m => (
                                  <span key={m.id} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: 12, background: '#F9FAFB', color: '#6B7280',
                                    borderRadius: 20, padding: '3px 10px 3px 6px',
                                    border: '1.5px solid #E5E7EB', fontWeight: 500,
                                  }}>
                                    <span style={{
                                      background: '#E5E7EB', color: '#9CA3AF',
                                      borderRadius: 10, padding: '0 5px',
                                      fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                                    }}>
                                      {m.nroMaquina ?? '?'}
                                    </span>
                                    {m.nombre}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {maquinasEj.length === 0 && maquinasAsig.length === 0 && (
                            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Sin máquinas asignadas ni compatibles.</p>
                          )}

                          {/* Ver demo */}
                          {e.imagenUrl && (
                            <div style={{ marginTop: 12 }}>
                              <button
                                onClick={() => setLightbox({ url: e.imagenUrl!, nombre: e.nombre })}
                                style={{
                                  background: 'none', border: '1px solid #D1D5DB',
                                  borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
                                  color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: 5,
                                  transition: 'all 0.1s',
                                }}
                                onMouseEnter={ev => { ev.currentTarget.style.borderColor = '#2E75B6'; ev.currentTarget.style.color = '#2E75B6'; ev.currentTarget.style.background = '#EFF6FF' }}
                                onMouseLeave={ev => { ev.currentTarget.style.borderColor = '#D1D5DB'; ev.currentTarget.style.color = '#6B7280'; ev.currentTarget.style.background = 'none' }}>
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
      )}

      {/* ── Lightbox / Demo Modal ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          onKeyDown={e => e.key === 'Escape' && setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: 24,
          }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 16px', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {lightbox.nombre}
          </p>
          <img
            src={lightbox.url}
            alt={lightbox.nombre}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '70vh',
              objectFit: 'contain', borderRadius: 12,
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }} />
          <button
            onClick={() => setLightbox(null)}
            style={{
              marginTop: 20, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)',
              color: '#fff', borderRadius: 8, padding: '8px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
            }}>
            ✕ Cerrar
          </button>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 }}>
            Hacé clic fuera o Escape para cerrar
          </p>
        </div>
      )}
    </div>
  )
}
