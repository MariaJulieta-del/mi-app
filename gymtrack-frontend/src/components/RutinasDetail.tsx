import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import type { Rutina, Ejercicio, EjercicioRequestDTO } from '../types/Rutina'
import {
  obtenerRutina, obtenerEjercicios, agregarEjercicio, eliminarEjercicio, actualizarEjercicioEnRutina,
} from '../services/rutinaService'
import { listarTodosEjercicios, browseCatalogo, type Ejercicio as EjercicioCat } from '../services/ejercicioService'
import { listarMaquinas, type Maquina } from '../services/maquinaService'
import { useAuth } from '../context/AuthContext'
import { NAME_TO_ENGLISH, NAME_TO_STATIC_IMG } from '../data/exercisesCatalog'

/** Busca imagen estática por nombre exacto primero, luego por palabras clave (≥4 chars). */
function resolverImgEstatica(nombre: string): string | undefined {
  const lower = nombre.toLowerCase()
  if (NAME_TO_STATIC_IMG[lower]) return NAME_TO_STATIC_IMG[lower]
  const words = lower.split(/\s+/).filter(w => w.length >= 4)
  let best: { url: string; score: number } | null = null
  for (const [key, url] of Object.entries(NAME_TO_STATIC_IMG)) {
    const score = words.filter(w => key.includes(w)).length
    if (score > 0 && (!best || score > best.score)) best = { url, score }
  }
  return best?.url
}

const TREN_CONFIG: Record<string, { emoji: string; label: string; bg: string; color: string; grupos: string[] }> = {
  SUPERIOR:  { emoji: '💪', label: 'Tren Superior',  bg: '#EFF6FF', color: '#2E75B6', grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'] },
  INFERIOR:  { emoji: '🦵', label: 'Tren Inferior',  bg: '#F0FDF4', color: '#16A34A', grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'] },
  CORE:      { emoji: '🔥', label: 'Core / Abdomen', bg: '#FFF7ED', color: '#C2410C', grupos: ['Abdominales', 'Core', 'Lumbares'] },
  CARDIO:    { emoji: '❤️', label: 'Cardio',          bg: '#FEF2F2', color: '#DC2626', grupos: ['Cardio'] },
  FULL_BODY: { emoji: '⚡', label: 'Full Body',       bg: '#F5F3FF', color: '#7C3AED', grupos: [] },
}
const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function RutinasDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const esAdmin = user?.rol === 'ADMIN' || user?.rol === 'EMPLEADO'
  const esGeneral = searchParams.get('general') === 'true'
  const socioId: number | null = esGeneral
    ? null
    : esAdmin
      ? (searchParams.get('socioId') ? Number(searchParams.get('socioId')) : null)
      : (user?.socioId ?? null)

  const [rutina, setRutina] = useState<Rutina | null>(null)
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [catalogo, setCatalogo] = useState<EjercicioCat[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Panel agregar ejercicio
  const [showAgregar, setShowAgregar] = useState(false)
  const [busqEj, setBusqEj] = useState('')
  const [ejSel, setEjSel] = useState<EjercicioCat | null>(null)
  const [series, setSeries] = useState(3)
  const [reps, setReps] = useState(10)
  const [descanso, setDescanso] = useState(60)
  const [peso, setPeso] = useState<number | ''>('')
  const [notas, setNotas] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  // Edición inline de series/reps/descanso — estado como string para evitar bloqueos con type=number
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editSeries, setEditSeries] = useState('')
  const [editReps, setEditReps] = useState('')
  const [editDescanso, setEditDescanso] = useState('')
  const [editPeso, setEditPeso] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  const abrirEdicion = (ej: Ejercicio) => {
    setEditingId(ej.id ?? null)
    setEditSeries(String(ej.series ?? 3))
    setEditReps(String(ej.repeticiones ?? 10))
    setEditDescanso(String(ej.descansoSeg ?? 60))
    setEditPeso(ej.pesoKg != null ? String(ej.pesoKg) : '')
  }

  const guardarEdicion = async (ejId: number) => {
    if (!id) return
    setGuardandoEdit(true)
    try {
      const updated = await actualizarEjercicioEnRutina(Number(id), ejId, socioId, {
        series: editSeries ? parseInt(editSeries) : undefined,
        repeticiones: editReps ? parseInt(editReps) : undefined,
        descansoSeg: editDescanso ? parseInt(editDescanso) : undefined,
        pesoKg: editPeso ? parseFloat(editPeso) : undefined,
      })
      setEjercicios(prev => prev.map(e => e.id === ejId ? { ...e, ...updated } : e))
      setEditingId(null)
    } finally {
      setGuardandoEdit(false)
    }
  }

  // Lightbox / demo mode
  const [lightbox, setLightbox] = useState<{ url: string; nombre: string } | null>(null)

  // GIF cache para ejercicios sin imagenUrl (nombreEjercicio → gifUrl)
  const [gifCache, setGifCache] = useState<Record<string, string>>({})
  const [loadingGif, setLoadingGif] = useState<string | null>(null)

  /** Abre imagen de demostración del ejercicio.
   *  Prioridad: imagenUrl en DB → cache → imagen estática GitHub → API (si está disponible) */
  const abrirGif = async (nombreEjercicio: string) => {
    // 1. Ya tenemos la URL en cache → abrir directo
    if (gifCache[nombreEjercicio]) {
      setLightbox({ url: gifCache[nombreEjercicio], nombre: nombreEjercicio })
      return
    }
    // 2. Imagen estática (exacta o por palabras clave)
    const staticUrl = resolverImgEstatica(nombreEjercicio)
    if (staticUrl) {
      setGifCache(c => ({ ...c, [nombreEjercicio]: staticUrl }))
      setLightbox({ url: staticUrl, nombre: nombreEjercicio })
      return
    }
    // 3. Fallback: intentar API externa (puede estar caída)
    const englishName = NAME_TO_ENGLISH[nombreEjercicio.toLowerCase()]
    if (!englishName) return
    setLoadingGif(nombreEjercicio)
    try {
      const results = await browseCatalogo(undefined, englishName, 1, 0)
      const url = results[0]?.gifUrl
      if (url) {
        setGifCache(c => ({ ...c, [nombreEjercicio]: url }))
        setLightbox({ url, nombre: nombreEjercicio })
      }
    } catch { /* silencioso */ } finally {
      setLoadingGif(null)
    }
  }

  useEffect(() => {
    if (!id) return
    const rutinaId = Number(id)
    Promise.all([
      obtenerRutina(rutinaId, socioId),
      obtenerEjercicios(rutinaId, socioId),
      listarMaquinas(true),
      listarTodosEjercicios(),
    ]).then(([r, ejs, maks, cat]) => {
      setRutina(r)
      setEjercicios(ejs)
      setMaquinas(maks)
      setCatalogo(cat)
    }).catch(() => setError('Error al cargar la rutina'))
      .finally(() => setCargando(false))
  }, [id])

  // Usar el primer tren para color/info de referencia
  const trenInfo = (rutina?.trenes && rutina.trenes.length > 0)
    ? (TREN_CONFIG[rutina.trenes[0]] ?? null)
    : null

  // Grupos combinados de todos los trenes de la rutina
  const gruposRutina = Array.from(new Set(
    (rutina?.trenes ?? []).flatMap(tid => (TREN_CONFIG[tid]?.grupos ?? []))
  ))
  const hayFullBody = (rutina?.trenes ?? []).includes('FULL_BODY')

  // Catálogo filtrado por tren de la rutina + búsqueda
  const catalogoFiltrado = catalogo.filter(e => {
    if (!e.activo) return false
    const matchBusq = e.nombre.toLowerCase().includes(busqEj.toLowerCase())
    if (gruposRutina.length > 0 && !hayFullBody) {
      const matchTren = (e.grupos ?? []).some(g => gruposRutina.includes(g))
      return matchBusq && matchTren
    }
    return matchBusq
  })

  // Máquinas del ejercicio seleccionado o del tren
  const resolverMaquinas = (maquinaIds?: number[]) =>
    (maquinaIds ?? []).map(mid => maquinas.find(m => m.id === mid)).filter(Boolean) as Maquina[]

  const maquinasFiltradas = gruposRutina.length > 0 && !hayFullBody
    ? maquinas.filter(m => gruposRutina.some(g => (m.grupos ?? []).includes(g)))
    : maquinas

  const handleAgregar = async () => {
    if (!ejSel && !busqEj.trim()) return
    setAgregando(true)
    try {
      const dto: EjercicioRequestDTO = {
        nombreEjercicio: ejSel?.nombre ?? busqEj.trim(),
        series, repeticiones: reps, descansoSeg: descanso,
        pesoKg: peso === '' ? undefined : Number(peso),
        notas: notas || undefined,
        ejercicioCatalogoId: ejSel?.id,
      }
      const nuevo = await agregarEjercicio(Number(id), socioId, dto)
      setEjercicios(prev => [...prev, nuevo])
      setEjSel(null); setBusqEj(''); setNotas('')
      setSeries(3); setReps(10); setDescanso(60); setPeso('')
      setShowAgregar(false)
    } catch {
      setError('Error al agregar ejercicio')
    } finally {
      setAgregando(false)
    }
  }

  const handleEliminar = async (ejId: number) => {
    if (!confirm('¿Quitar este ejercicio de la rutina?')) return
    setEliminandoId(ejId)
    try {
      await eliminarEjercicio(Number(id), ejId, socioId)
      setEjercicios(prev => prev.filter(e => e.id !== ejId))
    } catch {
      setError('Error al eliminar ejercicio')
    } finally {
      setEliminandoId(null)
    }
  }

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Cargando rutina…</div>
  if (!rutina) return <div className="gt-alert gt-alert-error">Rutina no encontrada</div>

  const linkEditar = esGeneral
    ? `/rutinas/editar/${id}?general=true`
    : esAdmin ? `/rutinas/editar/${id}?socioId=${socioId}` : `/rutinas/editar/${id}`

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <button className="gt-btn gt-btn-secondary" onClick={() => navigate('/rutinas')} style={{ marginBottom: 10 }}>
            ← Volver a Rutinas
          </button>
          <h1 className="gt-page-title" style={{ margin: 0 }}>{rutina.nombre}</h1>
          {rutina.descripcion && (
            <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6B7280' }}>{rutina.descripcion}</p>
          )}
        </div>
        {esAdmin && (
          <Link to={linkEditar} className="gt-btn gt-btn-secondary">Editar rutina</Link>
        )}
      </div>

      {error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Info chips ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {/* Trenes musculares */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(rutina?.trenes && rutina.trenes.length > 0)
            ? rutina.trenes.map(tid => {
                const cfg = TREN_CONFIG[tid]
                if (!cfg) return null
                return (
                  <span key={tid} style={{ fontSize: 13, fontWeight: 700, borderRadius: 8, padding: '5px 14px', background: cfg.bg, color: cfg.color }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                )
              })
            : null
          }
        </div>
        {/* Socio */}
        {rutina.socioId === null ? (
          <span style={{ fontSize: 13, fontWeight: 700, borderRadius: 8, padding: '5px 14px', background: '#F5F3FF', color: '#7C3AED' }}>
            📋 Rutina general
          </span>
        ) : rutina.socioNombre && (
          <span style={{ fontSize: 13, fontWeight: 600, borderRadius: 8, padding: '5px 14px', background: '#EFF6FF', color: '#2E75B6' }}>
            👤 {rutina.socioNombre}
          </span>
        )}
        {/* Días */}
        {rutina.diasSemana && rutina.diasSemana.length > 0 && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {DIAS_ORDER.filter(d => rutina.diasSemana!.includes(d)).map(dia => {
              const fin = dia === 'Sábado' || dia === 'Domingo'
              return (
                <span key={dia} style={{
                  fontSize: 12, fontWeight: 700, borderRadius: 6, padding: '4px 10px',
                  background: fin ? '#FEF3C7' : (trenInfo?.bg ?? '#F3F4F6'),
                  color: fin ? '#92400E' : (trenInfo?.color ?? '#6B7280'),
                }}>
                  {dia}
                </span>
              )
            })}
          </div>
        )}
        {/* Cantidad */}
        <span style={{ fontSize: 13, borderRadius: 8, padding: '5px 14px', background: '#F3F4F6', color: '#374151', marginLeft: 'auto' }}>
          {ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''}
        </span>
      </div>


      {/* ── Lista de ejercicios ── */}
      <div className="gt-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>Ejercicios</p>
          {esAdmin && (
            <button className="gt-btn gt-btn-primary" style={{ fontSize: 12 }}
              onClick={() => { setShowAgregar(v => !v); setBusqEj(''); setEjSel(null) }}>
              {showAgregar ? 'Cerrar' : '+ Agregar ejercicio'}
            </button>
          )}
        </div>

        {/* Panel agregar */}
        {showAgregar && esAdmin && (
          <div style={{ marginBottom: 16, padding: 14, background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <input className="gt-input" style={{ marginBottom: 10 }}
              placeholder={`Buscar ejercicio${gruposRutina.length > 0 && !hayFullBody ? ` de ${(rutina?.trenes ?? []).map(tid => TREN_CONFIG[tid]?.label ?? tid).join('/')}` : ''}...`}
              value={busqEj} onChange={e => { setBusqEj(e.target.value); setEjSel(null) }} />

            {/* Resultados catálogo */}
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {catalogoFiltrado.slice(0, 20).map(e => (
                <div key={e.id} onClick={() => { setEjSel(e); setBusqEj(e.nombre) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 7, cursor: 'pointer', border: '1px solid',
                    borderColor: ejSel?.id === e.id ? '#2E75B6' : '#E5E7EB',
                    background: ejSel?.id === e.id ? '#EFF6FF' : '#fff',
                  }}
                  onMouseEnter={ev => { if (ejSel?.id !== e.id) ev.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={ev => { if (ejSel?.id !== e.id) ev.currentTarget.style.background = '#fff' }}>
                  {e.imagenUrl
                    ? <img src={e.imagenUrl} alt={e.nombre} style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                    : <div style={{ width: 34, height: 34, borderRadius: 5, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{e.esMaquina ? '⚙' : '💪'}</div>
                  }
                  <span style={{ flex: 1, fontWeight: ejSel?.id === e.id ? 700 : 400, fontSize: 13 }}>{e.nombre}</span>
                  {e.grupos && e.grupos.slice(0, 2).map(g => (
                    <span key={g} style={{ fontSize: 10, background: '#EFF6FF', color: '#2E75B6', borderRadius: 4, padding: '1px 5px' }}>{g}</span>
                  ))}
                </div>
              ))}
              {busqEj && catalogoFiltrado.length === 0 && (
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0', textAlign: 'center' }}>
                  Sin resultados. Escribí el nombre para agregar manualmente.
                </p>
              )}
            </div>

            {/* Config series/reps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Series</label>
                <input type="number" className="gt-input" min={1} max={20} value={series}
                  onChange={e => setSeries(Number(e.target.value))} style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Repeticiones</label>
                <input type="number" className="gt-input" min={1} max={200} value={reps}
                  onChange={e => setReps(Number(e.target.value))} style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Descanso (s)</label>
                <input type="number" className="gt-input" min={0} max={600} value={descanso}
                  onChange={e => setDescanso(Number(e.target.value))} style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Peso (kg)</label>
                <input type="number" className="gt-input" min={0} max={999} value={peso}
                  onChange={e => setPeso(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="—" style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Notas</label>
                <input className="gt-input" value={notas} onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: Con agarre neutro..." maxLength={80} />
              </div>
            </div>
            <button className="gt-btn gt-btn-primary" disabled={agregando || (!ejSel && !busqEj.trim())}
              onClick={handleAgregar}>
              {agregando ? 'Guardando…' : '✓ Agregar a la rutina'}
            </button>
          </div>
        )}

        {/* Ejercicios list */}
        {ejercicios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>🏋️</p>
            <p style={{ margin: 0 }}>Esta rutina todavía no tiene ejercicios.</p>
            {esAdmin && <p style={{ margin: '4px 0 0', fontSize: 12 }}>Usá el botón "Agregar ejercicio" para empezar.</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ejercicios.map((ej, idx) => {
              // Máquinas asignadas directamente al ejercicio
              const maks = resolverMaquinas(ej.maquinaIds)
              // Grupos para filtrar máquinas: ejercicio > tren de rutina
              const ejGrupos = (ej.grupos && ej.grupos.length > 0)
                ? ej.grupos
                : gruposRutina
              // Solo mostrar máquinas si hay grupos concretos que coincidan — nunca "todas las máquinas"
              const maqRecomendadas = ejGrupos.length > 0
                ? maquinas
                    .filter(m => (m.grupos ?? []).some(g => ejGrupos.includes(g)) && !maks.some(a => a.id === m.id))
                    .slice(0, 5)
                : []
              return (
                <div key={ej.id ?? idx} style={{
                  display: 'flex', gap: 12, padding: '12px 14px',
                  background: '#FAFAFA', borderRadius: 10,
                  border: '1px solid #F0F0F0',
                }}>
                  {/* Número de orden */}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: trenInfo?.bg ?? '#F3F4F6', color: trenInfo?.color ?? '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 2 }}>
                    {idx + 1}
                  </div>

                  {/* Imagen — clickeable para demo */}
                  {(() => {
                    const gifUrl = ej.imagenUrl || gifCache[ej.nombreEjercicio] || resolverImgEstatica(ej.nombreEjercicio ?? '')
                    const hasEnglish = !!NAME_TO_ENGLISH[ej.nombreEjercicio?.toLowerCase() ?? '']
                    const isLoading = loadingGif === ej.nombreEjercicio
                    if (gifUrl) {
                      return (
                        <button
                          onClick={() => setLightbox({ url: gifUrl, nombre: ej.nombreEjercicio })}
                          title="Ver demostración"
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                          <img src={gifUrl} alt={ej.nombreEjercicio}
                            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, display: 'block', transition: 'opacity .15s' }}
                            onMouseEnter={ev => (ev.currentTarget.style.opacity = '0.75')}
                            onMouseLeave={ev => (ev.currentTarget.style.opacity = '1')} />
                          <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 3, padding: '0 3px', lineHeight: '14px', pointerEvents: 'none' }}>▶</span>
                        </button>
                      )
                    }
                    if (hasEnglish) {
                      return (
                        <button
                          onClick={() => abrirGif(ej.nombreEjercicio)}
                          disabled={isLoading}
                          title="Ver GIF de demostración"
                          style={{ width: 52, height: 52, borderRadius: 8, background: '#EFF6FF', border: '1.5px dashed #93C5FD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, gap: 2 }}>
                          {isLoading
                            ? <span style={{ fontSize: 10, color: '#6B7280' }}>⏳</span>
                            : <>
                                <span style={{ fontSize: 16 }}>▶</span>
                                <span style={{ fontSize: 8, color: '#2E75B6', fontWeight: 700 }}>GIF</span>
                              </>
                          }
                        </button>
                      )
                    }
                    return (
                      <div style={{ width: 52, height: 52, borderRadius: 8, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                        {ej.esMaquina ? '⚙' : '💪'}
                      </div>
                    )
                  })()}

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#111827' }}>{ej.nombreEjercicio}</p>

                    {/* Series × Reps × Descanso */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>
                        <strong>{ej.series ?? '?'}</strong> series
                      </span>
                      <span style={{ fontSize: 13, color: '#374151' }}>
                        <strong>{ej.repeticiones ?? '?'}</strong> reps
                      </span>
                      {ej.descansoSeg != null && (
                        <span style={{ fontSize: 13, color: '#6B7280' }}>
                          {ej.descansoSeg}s desc.
                        </span>
                      )}
                      {ej.pesoKg != null && (
                        <span style={{ fontSize: 13, color: '#6B7280' }}>
                          {ej.pesoKg} kg
                        </span>
                      )}
                      {esAdmin && (
                        <button type="button" onClick={() => abrirEdicion(ej)} title="Editar"
                          style={{ marginLeft: 2, padding: '2px 7px', background: 'none', border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 11, color: '#6B7280', cursor: 'pointer' }}>
                          ✏
                        </button>
                      )}
                    </div>

                    {/* Grupos musculares */}
                    {ej.grupos && ej.grupos.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        {ej.grupos.map(g => (
                          <span key={g} style={{ fontSize: 11, background: '#EFF6FF', color: '#2E75B6', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Máquinas asignadas */}
                    {maks.length > 0 && (
                      <div style={{ marginBottom: 4 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.4 }}>⚙ Máquinas asignadas</p>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {maks.map(m => (
                            <span key={m.id} style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 5, padding: '2px 8px', fontWeight: 600, border: '1px solid #FDE68A' }}>
                              {m.nroMaquina ? `${m.nroMaquina} — ` : ''}{m.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Máquinas recomendadas por grupo */}
                    {maqRecomendadas.length > 0 && (
                      <div style={{ marginBottom: 4 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4 }}>⚙ Máquinas recomendadas</p>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {maqRecomendadas.map(m => (
                            <span key={m.id} style={{ fontSize: 11, background: '#FFFBEB', color: '#B45309', borderRadius: 5, padding: '2px 8px', fontWeight: 500, border: '1px solid #FDE68A' }}>
                              {m.nroMaquina ? `${m.nroMaquina} — ` : ''}{m.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Descripción */}
                    {ej.descripcionEjercicio && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9CA3AF' }}>{ej.descripcionEjercicio}</p>
                    )}

                    {/* Notas */}
                    {ej.notas && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                        📝 {ej.notas}
                      </p>
                    )}

                  </div>

                  {/* Botón eliminar */}
                  {esAdmin && (
                    <button onClick={() => handleEliminar(ej.id!)} disabled={eliminandoId === ej.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 16, alignSelf: 'flex-start', padding: '2px 4px', transition: 'color 0.1s' }}
                      onMouseEnter={ev => (ev.currentTarget.style.color = '#DC2626')}
                      onMouseLeave={ev => (ev.currentTarget.style.color = '#D1D5DB')}>
                      {eliminandoId === ej.id ? '…' : '✕'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

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
            Hacé clic fuera de la imagen o presioná Escape para cerrar
          </p>
        </div>
      )}

      {/* Modal edición de ejercicio */}
      {editingId !== null && (
        <div
          onClick={() => setEditingId(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, padding: 24, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}>
            <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 16, color: '#111827' }}>
              ✏ Editar ejercicio
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Series</label>
                <input className="gt-input" type="number" min={1} max={99} value={editSeries}
                  onChange={e => setEditSeries(e.target.value)}
                  style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Repeticiones</label>
                <input className="gt-input" type="number" min={1} max={999} value={editReps}
                  onChange={e => setEditReps(e.target.value)}
                  style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Descanso (seg)</label>
                <input className="gt-input" type="number" min={0} max={600} value={editDescanso}
                  onChange={e => setEditDescanso(e.target.value)}
                  style={{ textAlign: 'center' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Peso (kg)</label>
                <input className="gt-input" type="number" min={0} max={999} value={editPeso}
                  onChange={e => setEditPeso(e.target.value)}
                  placeholder="sin peso" style={{ textAlign: 'center' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="gt-btn gt-btn-primary"
                style={{ flex: 1 }}
                disabled={guardandoEdit}
                onClick={() => guardarEdicion(editingId!)}>
                {guardandoEdit ? 'Guardando…' : '✓ Guardar cambios'}
              </button>
              <button type="button" className="gt-btn"
                onClick={() => setEditingId(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
