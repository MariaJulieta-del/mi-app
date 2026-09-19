import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Rutina, RutinaRequestDTO } from '../types/Rutina'
import {
  crearRutina, obtenerRutina, actualizarRutina, agregarEjercicio,
  obtenerRutinasGenerales, obtenerEjercicios,
} from '../services/rutinaService'
import { listarTodosEjercicios, type Ejercicio as EjercicioCat } from '../../ejercicios/services/ejercicioService'
import { listarMaquinas, type Maquina } from '../../maquinas/services/maquinaService'
import { obtenerTodos, obtenerPorId } from '../../socios/services/socioService'
import { obtenerFicha } from '../../socios/services/fichaService'
import { useAuth } from '../../../shared/context/AuthContext'
import type { Socio } from '../../socios/types/Socio'
import { NAME_TO_STATIC_IMG } from '../../ejercicios/assets/exercisesCatalog'

// ── Configuración de trenes musculares ─────────────────────────────
const TRENES = [
  { id: 'SUPERIOR',  emoji: '💪', label: 'Tren Superior',  desc: 'Pecho, Espalda, Hombros, Bíceps, Tríceps', grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'], color: '#2E75B6', bg: '#EFF6FF' },
  { id: 'INFERIOR',  emoji: '🦵', label: 'Tren Inferior',  desc: 'Cuádriceps, Femoral, Glúteos, Pantorrillas',   grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'],               color: '#16A34A', bg: '#F0FDF4' },
  { id: 'CORE',      emoji: '🔥', label: 'Core / Abdomen', desc: 'Abdominales, Core, Lumbares',                  grupos: ['Abdominales', 'Core', 'Lumbares'],                                color: '#C2410C', bg: '#FFF7ED' },
  { id: 'CARDIO',    emoji: '❤️', label: 'Cardio',          desc: 'Actividad aeróbica y resistencia',             grupos: ['Cardio'],                                                         color: '#DC2626', bg: '#FEF2F2' },
  { id: 'FULL_BODY', emoji: '⚡', label: 'Full Body',       desc: 'Trabajo completo de todo el cuerpo',           grupos: [],                                                                 color: '#7C3AED', bg: '#F5F3FF' },
]
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface EjItem {
  catId?: number
  nombre: string
  series: number
  reps: number
  descanso: number
  notas: string
  imagenUrl?: string
}

export default function RutinaForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const esAdmin = user?.rol === 'ADMIN' || user?.rol === 'EMPLEADO'
  const esEdicion = Boolean(id)
  const socioIdAuth = user?.socioId ?? null
  const socioIdParam = searchParams.get('socioId') ? Number(searchParams.get('socioId')) : null
  const esGeneral = searchParams.get('general') === 'true'

  // ── Form state ─────────────────────────────────────────────────────
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [trenesSel, setTrenesSel] = useState<string[]>([])
  const [dias, setDias] = useState<string[]>([])
  const [dificultad, setDificultad] = useState('')
  const [ejercicios, setEjercicios] = useState<EjItem[]>([])

  // ── Socio (admin) ──────────────────────────────────────────────────
  const [sinSocio, setSinSocio] = useState(esGeneral || !esAdmin)
  const [socios, setSocios] = useState<Socio[]>([])
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [socioSel, setSocioSel] = useState<Socio | null>(null)
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [obsMovio, setObsMovio] = useState<string | null>(null)

  // ── Catálogo ───────────────────────────────────────────────────────
  const [catalogo, setCatalogo] = useState<EjercicioCat[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [busqEj, setBusqEj] = useState('')
  const [mostrarCat, setMostrarCat] = useState(false)

  // ── Rutinas generales como base ────────────────────────────────────
  const [generales, setGenerales] = useState<Rutina[]>([])
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const [busqGeneral, setBusqGeneral] = useState('')
  const [rutinaBaseNombre, setRutinaBaseNombre] = useState<string | null>(null)
  const [cargandoBase, setCargandoBase] = useState(false)

  // ── UI ─────────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; nombre: string } | null>(null)

  // ── Cargar datos iniciales ─────────────────────────────────────────
  useEffect(() => {
    listarTodosEjercicios().then(setCatalogo).catch(() => {})
    listarMaquinas(true).then(setMaquinas).catch(() => {})
  }, [])

  useEffect(() => {
    if (mostrarBuscador && socios.length === 0) {
      obtenerTodos().then(setSocios).catch(() => {})
    }
  }, [mostrarBuscador])

  useEffect(() => {
    if (mostrarPicker && generales.length === 0) {
      obtenerRutinasGenerales().then(setGenerales).catch(() => {})
    }
  }, [mostrarPicker])

  // Cargar rutina existente en modo edición
  useEffect(() => {
    if (!esEdicion || !id) return
    const sid = esAdmin ? (esGeneral ? null : socioIdParam) : socioIdAuth
    obtenerRutina(Number(id), sid)
      .then(r => {
        setNombre(r.nombre)
        setDescripcion(r.descripcion ?? '')
        setTrenesSel(r.trenes ?? [])
        setDias(r.diasSemana ?? [])
        setDificultad(r.dificultad ?? '')
        if (r.socioId === null) setSinSocio(true)
      })
      .catch(() => setError('No se pudo cargar la rutina'))
  }, [id])

  // Auto-seleccionar socio desde URL param
  useEffect(() => {
    if (socioIdParam && esAdmin && !esEdicion) {
      obtenerPorId(socioIdParam).then(s => seleccionarSocio(s)).catch(() => {})
    }
  }, [socioIdParam])

  // ── Helpers ────────────────────────────────────────────────────────
  const seleccionarSocio = (s: Socio) => {
    setSocioSel(s)
    setBusquedaSocio(`${s.nombre} ${s.apellido}`)
    setMostrarBuscador(false)
    setObsMovio(null)
    if (s.id) {
      obtenerFicha(s.id)
        .then(data => {
          const obs = [data?.observacionesMedicas, data?.lesiones ? `Lesiones: ${data.lesiones}` : '']
            .filter(Boolean).join('\n')
          setObsMovio(obs || null)
        })
        .catch(() => {})
    }
  }

  const aplicarRutinaGeneral = async (r: Rutina) => {
    setCargandoBase(true)
    setMostrarPicker(false)
    setBusqGeneral('')
    setNombre(r.nombre)
    setDescripcion(r.descripcion ?? '')
    setTrenesSel(r.trenes ?? [])
    setDias(r.diasSemana ?? [])
    setDificultad(r.dificultad ?? '')
    setRutinaBaseNombre(r.nombre)
    try {
      const ejsBase = await obtenerEjercicios(r.id!, null)
      setEjercicios(ejsBase.map(e => ({
        catId: e.ejercicioCatalogoId,
        nombre: e.nombreEjercicio,
        series: e.series ?? 3,
        reps: e.repeticiones ?? 10,
        descanso: e.descansoSeg ?? 60,
        notas: e.notas ?? '',
        imagenUrl: e.imagenUrl,
      })))
    } catch {
      setEjercicios([])
    } finally {
      setCargandoBase(false)
    }
  }

  const getSocioId = (): number | null => {
    if (!esAdmin) return socioIdAuth
    if (sinSocio) return null
    return socioSel?.id ?? null
  }

  const toggleDia = (dia: string) =>
    setDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia])

  const toggleTren = (id: string) =>
    setTrenesSel(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  // Grupos musculares combinados de todos los trenes seleccionados
  const gruposSeleccionados = Array.from(new Set(
    trenesSel.flatMap(tid => TRENES.find(t => t.id === tid)?.grupos ?? [])
  ))
  const hayFullBody = trenesSel.includes('FULL_BODY')

  // Ejercicios del catálogo filtrados por tren + búsqueda
  const catalogoFiltrado = catalogo.filter(e => {
    if (!e.activo) return false
    const matchBusq = e.nombre.toLowerCase().includes(busqEj.toLowerCase())
    if (trenesSel.length > 0 && !hayFullBody) {
      const matchTren = (e.grupos ?? []).some(g => gruposSeleccionados.includes(g))
      return matchBusq && matchTren
    }
    return matchBusq
  })

  // Máquinas filtradas por los grupos de los trenes seleccionados
  const maquinasFiltradas = trenesSel.length > 0 && !hayFullBody
    ? maquinas.filter(m =>
        gruposSeleccionados.some(g => (m.grupos ?? []).includes(g))
      )
    : maquinas

  const agregarEjDesde = (e: EjercicioCat) => {
    if (ejercicios.some(x => x.catId === e.id)) return
    setEjercicios(prev => [...prev, {
      catId: e.id,
      nombre: e.nombre,
      series: 3,
      reps: 10,
      descanso: 60,
      notas: '',
      imagenUrl: e.imagenUrl,
    }])
  }

  const quitarEj = (idx: number) => setEjercicios(prev => prev.filter((_, i) => i !== idx))

  const actualizarEj = (idx: number, campo: keyof EjItem, valor: string | number) => {
    setEjercicios(prev => prev.map((e, i) => i === idx ? { ...e, [campo]: valor } : e))
  }

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (esAdmin && !sinSocio && !socioSel) { setError('Seleccioná un socio o marcá "Sin asignar a socio"'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }

    const sid = getSocioId()
    const datos: RutinaRequestDTO = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      trenes: trenesSel.length > 0 ? trenesSel : undefined,
      diasSemana: dias.length > 0 ? dias : undefined,
      dificultad: dificultad || undefined,
    }

    setGuardando(true); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      if (esEdicion && id) {
        await actualizarRutina(Number(id), sid, datos)
        navigate(esGeneral ? `/rutinas/${id}?general=true` : esAdmin ? `/rutinas/${id}?socioId=${sid}` : `/rutinas/${id}`)
        return
      }

      const nueva = await crearRutina(sid, datos)
      const rutinaId = nueva.id!

      if (ejercicios.length > 0) {
        for (let i = 0; i < ejercicios.length; i++) {
          const ej = ejercicios[i]
          setProgreso(`Guardando ejercicios… (${i + 1}/${ejercicios.length})`)
          await agregarEjercicio(rutinaId, sid, {
            nombreEjercicio: ej.nombre,
            series: ej.series,
            repeticiones: ej.reps,
            descansoSeg: ej.descanso,
            notas: ej.notas || undefined,
            ejercicioCatalogoId: ej.catId,
          })
        }
      }

      navigate(sid === null ? `/rutinas/${rutinaId}?general=true` : esAdmin ? `/rutinas/${rutinaId}?socioId=${sid}` : `/rutinas/${rutinaId}`)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string; campos?: Record<string, string> } } }
      const serverMsg = axErr?.response?.data?.error
      const camposMsg = axErr?.response?.data?.campos
        ? Object.entries(axErr.response.data.campos).map(([k, v]) => `${k}: ${v}`).join(', ')
        : null
      setError(camposMsg ?? serverMsg ?? 'Error al guardar la rutina')
      console.error('Error al guardar rutina:', err)
    } finally {
      setGuardando(false); setProgreso(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>
            {esEdicion ? 'Editar Rutina' : 'Nueva Rutina'}
          </h1>
          {!esEdicion && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              Seleccioná el tren muscular, los días y los ejercicios
            </p>
          )}
        </div>
        <button className="gt-btn gt-btn-secondary" onClick={() => navigate('/rutinas')}>← Volver</button>
      </div>

      {error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 16 }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── SECCIÓN 0: Usar rutina general como base (solo admin, solo creación) ── */}
        {esAdmin && !esEdicion && !esGeneral && (
          <div className="gt-card" style={{ marginBottom: 14, border: '1.5px solid var(--accent-border)', background: 'var(--accent-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                  Basarse en una rutina general
                </p>
                {rutinaBaseNombre ? (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Campos pre-cargados desde <strong>{rutinaBaseNombre}</strong> — podés modificarlos antes de guardar.
                  </p>
                ) : (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Elegí una rutina general para pre-cargar todos sus datos y ejercicios.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {rutinaBaseNombre && (
                  <button type="button" className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
                    onClick={() => {
                      setRutinaBaseNombre(null)
                      setNombre(''); setDescripcion(''); setTrenesSel([]); setDias([]); setDificultad(''); setEjercicios([])
                    }}>
                    Limpiar
                  </button>
                )}
                <button type="button" className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
                  onClick={() => setMostrarPicker(v => !v)} disabled={cargandoBase}>
                  {cargandoBase ? 'Cargando…' : mostrarPicker ? 'Cerrar' : rutinaBaseNombre ? 'Cambiar' : 'Elegir rutina'}
                </button>
              </div>
            </div>

            {mostrarPicker && (
              <div style={{ marginTop: 12 }}>
                <input className="gt-input" placeholder="Buscar por nombre…"
                  value={busqGeneral} onChange={e => setBusqGeneral(e.target.value)}
                  style={{ marginBottom: 8 }} />
                {generales.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    No hay rutinas generales creadas todavía.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                    {generales
                      .filter(r => r.nombre.toLowerCase().includes(busqGeneral.toLowerCase()))
                      .map(r => {
                        const DIFIC: Record<string, { bg: string; color: string; label: string }> = {
                          BAJA:  { bg: 'var(--green-bg)',  color: 'var(--green-text)',  label: 'Baja' },
                          MEDIA: { bg: 'var(--yellow-bg)', color: 'var(--yellow-text)', label: 'Media' },
                          ALTA:  { bg: 'var(--red-light)', color: 'var(--red-text)',    label: 'Alta' },
                        }
                        const dif = r.dificultad ? DIFIC[r.dificultad] : null
                        return (
                          <div key={r.id} onClick={() => aplicarRutinaGeneral(r)}
                            style={{
                              padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                              border: '1px solid var(--border)', background: 'var(--bg-surface)',
                              display: 'flex', alignItems: 'center', gap: 12,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                                {r.nombre}
                              </p>
                              {r.descripcion && (
                                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                                  {r.descripcion}
                                </p>
                              )}
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                                {(r.trenes ?? []).map(t => (
                                  <span key={t} style={{ fontSize: 10, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', borderRadius: 4, padding: '1px 6px', border: '1px solid var(--border)' }}>
                                    {t}
                                  </span>
                                ))}
                                {(r.diasSemana ?? []).map(d => (
                                  <span key={d} style={{ fontSize: 10, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 4, padding: '1px 6px' }}>
                                    {d}
                                  </span>
                                ))}
                                {dif && (
                                  <span style={{ fontSize: 10, borderRadius: 4, padding: '1px 6px', background: dif.bg, color: dif.color, fontWeight: 700 }}>
                                    {dif.label}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Usar esta →
                            </span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SECCIÓN 1: Tren muscular (multi-select) ── */}
        <div className="gt-card" style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#111827' }}>
            1. ¿Qué trenes musculares trabaja esta rutina?
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6B7280' }}>
            Podés seleccionar más de uno
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {TRENES.map(t => {
              const sel = trenesSel.includes(t.id)
              return (
                <button key={t.id} type="button" onClick={() => toggleTren(t.id)}
                  style={{
                    padding: '14px 12px', borderRadius: 10, border: `2px solid`,
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                    borderColor: sel ? t.color : '#E5E7EB',
                    background: sel ? t.bg : '#FAFAFA',
                    transform: sel ? 'scale(1.03)' : 'scale(1)',
                    position: 'relative',
                  }}>
                  {sel && (
                    <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 13, color: t.color, fontWeight: 700 }}>✓</span>
                  )}
                  <p style={{ fontSize: 28, margin: '0 0 6px' }}>{t.emoji}</p>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 13, color: sel ? t.color : '#374151' }}>{t.label}</p>
                  <p style={{ margin: 0, fontSize: 10, color: '#9CA3AF', lineHeight: 1.3 }}>{t.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── SECCIÓN 2: Nombre, descripción y días ── */}
        <div className="gt-card" style={{ marginBottom: 14 }}>
          <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: '#111827' }}>
            2. Datos de la rutina
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">Nombre *</label>
              <input className="gt-input" value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Rutina de fuerza superior"
                maxLength={50} required />
            </div>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">Descripción (opcional)</label>
              <textarea className="gt-textarea" value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Objetivo, nivel, notas generales..."
                rows={2} maxLength={300} />
            </div>
            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">Días de la semana</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {DIAS.map(dia => {
                  const sel = dias.includes(dia)
                  const fin = dia === 'Sábado' || dia === 'Domingo'
                  return (
                    <button key={dia} type="button" onClick={() => toggleDia(dia)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        border: '1.5px solid', fontWeight: sel ? 700 : 400, transition: 'all 0.12s',
                        borderColor: sel ? (fin ? 'var(--yellow-text)' : 'var(--accent)') : 'var(--border)',
                        background: sel ? (fin ? 'var(--yellow-bg)' : 'var(--accent-light)') : 'var(--bg-surface)',
                        color: sel ? (fin ? 'var(--yellow-text)' : 'var(--accent)') : 'var(--text-secondary)',
                      }}>
                      {dia}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="gt-form-group" style={{ margin: 0 }}>
              <label className="gt-label">Nivel de dificultad</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {[
                  { val: '', label: 'Sin especificar', bg: 'var(--bg-surface)', color: 'var(--text-muted)', border: 'var(--border)' },
                  { val: 'BAJA',  label: 'Baja',  bg: 'var(--green-bg)',   color: 'var(--green-text)', border: 'var(--green-text)' },
                  { val: 'MEDIA', label: 'Media', bg: 'var(--yellow-bg)',  color: 'var(--yellow-text)', border: 'var(--yellow-text)' },
                  { val: 'ALTA',  label: 'Alta',  bg: 'var(--red-light)',  color: 'var(--red-text)',    border: 'var(--red)' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setDificultad(opt.val)}
                    style={{
                      padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                      border: `1.5px solid ${dificultad === opt.val ? opt.border : 'var(--border)'}`,
                      background: dificultad === opt.val ? opt.bg : 'var(--bg-surface)',
                      color: dificultad === opt.val ? opt.color : 'var(--text-secondary)',
                      fontWeight: dificultad === opt.val ? 700 : 400,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 3: Ejercicios ── */}
        {!esEdicion && (
          <div className="gt-card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>
                  3. Ejercicios
                  {ejercicios.length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 12, background: '#F3F4F6', color: '#374151', borderRadius: 10, padding: '2px 9px', fontWeight: 700 }}>
                      {ejercicios.length} agregado{ejercicios.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
                {trenesSel.length > 0 && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                    Mostrando ejercicios de {trenesSel.map(id => TRENES.find(t => t.id === id)?.label ?? id).join(' + ')}
                  </p>
                )}
              </div>
              <button type="button" className="gt-btn gt-btn-secondary"
                style={{ fontSize: 12 }}
                onClick={() => setMostrarCat(v => !v)}>
                {mostrarCat ? 'Cerrar catálogo' : '+ Agregar ejercicio'}
              </button>
            </div>

            {/* Catálogo desplegable */}
            {mostrarCat && (
              <div style={{ marginBottom: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>

                {/* Barra de búsqueda */}
                <div style={{ padding: '12px 14px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <input className="gt-input" style={{ flex: 1, border: 'none', outline: 'none', padding: '0', background: 'transparent', fontSize: 14 }}
                    placeholder={trenesSel.length > 0 && !hayFullBody
                      ? `Buscar en ${trenesSel.map(tid => TRENES.find(t => t.id === tid)?.label ?? tid).join(' + ')}…`
                      : 'Buscar ejercicio…'}
                    value={busqEj}
                    onChange={e => setBusqEj(e.target.value)} />
                  {busqEj && (
                    <button type="button" onClick={() => setBusqEj('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF' }}>✕</button>
                  )}
                  <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                    {catalogoFiltrado.length} ejercicio{catalogoFiltrado.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Grid de cards */}
                <div style={{ maxHeight: 420, overflowY: 'auto', padding: 14 }}>
                  {catalogoFiltrado.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
                      <p style={{ fontSize: 24, margin: '0 0 6px' }}>🔍</p>
                      <p style={{ margin: 0, fontSize: 13 }}>
                        {catalogo.length === 0
                          ? 'El catálogo está vacío. Primero agregá ejercicios en la sección Ejercicios.'
                          : 'Sin coincidencias para esa búsqueda.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                      {catalogoFiltrado.map(e => {
                        const yaAgregado = ejercicios.some(x => x.catId === e.id)
                        // Máquinas compatibles con este ejercicio
                        const maqEj = maquinas.filter(m =>
                          (m.grupos ?? []).some(g => (e.grupos ?? []).includes(g))
                        )
                        return (
                          <div key={e.id}
                            onClick={() => !yaAgregado && agregarEjDesde(e)}
                            style={{
                              borderRadius: 10, border: '1.5px solid',
                              borderColor: yaAgregado ? '#BBF7D0' : '#E5E7EB',
                              background: yaAgregado ? '#F0FDF4' : '#fff',
                              cursor: yaAgregado ? 'default' : 'pointer',
                              overflow: 'hidden', transition: 'all 0.15s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            }}
                            onMouseEnter={ev => { if (!yaAgregado) { ev.currentTarget.style.borderColor = '#93C5FD'; ev.currentTarget.style.boxShadow = '0 4px 12px rgba(46,117,182,0.12)'; ev.currentTarget.style.transform = 'translateY(-1px)' } }}
                            onMouseLeave={ev => { if (!yaAgregado) { ev.currentTarget.style.borderColor = '#E5E7EB'; ev.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; ev.currentTarget.style.transform = 'none' } }}>

                            {/* Header de la card */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: maqEj.length > 0 ? '1px solid #F3F4F6' : 'none' }}>
                              {/* Ícono */}
                              <div style={{
                                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                                background: yaAgregado ? '#DCFCE7' : (e.esMaquina ? '#FEF3C7' : '#EFF6FF'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                              }}>
                                {e.imagenUrl
                                  ? <img src={e.imagenUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }} />
                                  : (yaAgregado ? '✓' : e.esMaquina ? '⚙️' : '💪')}
                              </div>

                              {/* Nombre + grupos */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  margin: '0 0 3px', fontWeight: 700, fontSize: 13,
                                  color: yaAgregado ? '#16A34A' : '#111827',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                  {e.nombre}
                                </p>
                                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                  {(e.grupos ?? []).slice(0, 2).map(g => (
                                    <span key={g} style={{
                                      fontSize: 10, borderRadius: 4, padding: '1px 5px', fontWeight: 600,
                                      background: yaAgregado ? '#DCFCE7' : '#EFF6FF',
                                      color: yaAgregado ? '#16A34A' : '#2E75B6',
                                    }}>{g}</span>
                                  ))}
                                </div>
                              </div>

                              {/* Badge estado */}
                              {yaAgregado && (
                                <span style={{ fontSize: 10, background: '#16A34A', color: '#fff', borderRadius: 6, padding: '2px 7px', fontWeight: 700, flexShrink: 0 }}>
                                  ✓ En rutina
                                </span>
                              )}
                            </div>

                            {/* Máquinas recomendadas */}
                            {maqEj.length > 0 && (
                              <div style={{ padding: '7px 12px 9px' }}>
                                <p style={{ margin: '0 0 5px', fontSize: 9, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                                  ⚙️ Máquinas disponibles
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                  {maqEj.slice(0, 3).map(m => (
                                    <span key={m.id} style={{
                                      fontSize: 10, background: '#FFFBEB', color: '#92400E',
                                      border: '1px solid #FDE68A', borderRadius: 5,
                                      padding: '2px 7px', fontWeight: 600,
                                      whiteSpace: 'nowrap', maxWidth: 160,
                                      overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                      {m.nroMaquina ? `${m.nroMaquina} · ` : ''}{m.nombre}
                                    </span>
                                  ))}
                                  {maqEj.length > 3 && (
                                    <span style={{ fontSize: 10, color: '#9CA3AF', padding: '2px 4px' }}>+{maqEj.length - 3}</span>
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
              </div>
            )}

            {/* Lista de ejercicios agregados con config inline */}
            {ejercicios.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', margin: '8px 0 0' }}>
                Podés agregar ejercicios ahora o después desde el detalle de la rutina.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ejercicios.map((ej, idx) => {
                  // Máquinas recomendadas para este ejercicio (por grupos compartidos)
                  const ejCat = catalogo.find(c => c.id === ej.catId)
                  const ejGrupos = ejCat?.grupos ?? []
                  const maqParaEj = maquinas.filter(m =>
                    (m.grupos ?? []).some(g => ejGrupos.includes(g))
                  )
                  return (
                  <div key={idx} style={{ background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
                      {(() => {
                        const imgUrl = ej.imagenUrl || NAME_TO_STATIC_IMG[ej.nombre.toLowerCase()]
                        return imgUrl ? (
                          <button type="button"
                            onClick={() => setLightbox({ url: imgUrl, nombre: ej.nombre })}
                            title="Ver imagen completa"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'zoom-in', flexShrink: 0, position: 'relative' }}>
                            <img src={imgUrl} alt={ej.nombre}
                              style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, background: '#F3F4F6', display: 'block' }}
                              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
                            <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 9, background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 3, padding: '0 3px', lineHeight: '14px' }}>🔍</span>
                          </button>
                        ) : (
                          <div style={{ width: 52, height: 52, borderRadius: 8, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💪</div>
                        )
                      })()}
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{ej.nombre}</span>
                      <button type="button" onClick={() => quitarEj(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, padding: '0 4px' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 8, padding: '10px 14px', alignItems: 'center' }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Series</label>
                        <input type="number" className="gt-input" min={1} max={20}
                          value={ej.series}
                          onChange={e => actualizarEj(idx, 'series', Number(e.target.value))}
                          style={{ textAlign: 'center' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Repeticiones</label>
                        <input type="number" className="gt-input" min={1} max={200}
                          value={ej.reps}
                          onChange={e => actualizarEj(idx, 'reps', Number(e.target.value))}
                          style={{ textAlign: 'center' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Descanso (s)</label>
                        <input type="number" className="gt-input" min={0} max={600}
                          value={ej.descanso}
                          onChange={e => actualizarEj(idx, 'descanso', Number(e.target.value))}
                          style={{ textAlign: 'center' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 3 }}>Notas</label>
                        <input className="gt-input" value={ej.notas}
                          onChange={e => actualizarEj(idx, 'notas', e.target.value)}
                          placeholder="Con agarre neutro..." maxLength={80} />
                      </div>
                    </div>
                    {/* Máquinas recomendadas para este ejercicio */}
                    {maqParaEj.length > 0 && (
                      <div style={{ padding: '6px 14px 10px', borderTop: '1px solid #F3F4F6', background: '#FFFDF8' }}>
                        <p style={{ margin: '0 0 5px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          ⚙️ Máquinas recomendadas
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {maqParaEj.map(m => (
                            <span key={m.id} style={{
                              fontSize: 11, background: '#FEF3C7', color: '#92400E',
                              borderRadius: 5, padding: '2px 8px', fontWeight: 600,
                              border: '1px solid #FDE68A',
                            }}>
                              {m.nroMaquina ? `${m.nroMaquina} — ` : ''}{m.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SECCIÓN 4: Asignación de socio (admin) ── */}
        {esAdmin && !esEdicion && (
          <div className="gt-card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#111827' }}>
                4. Asignación
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={sinSocio}
                  onChange={e => { setSinSocio(e.target.checked); if (e.target.checked) { setSocioSel(null); setBusquedaSocio('') } }} />
                Guardar como rutina general (sin socio)
              </label>
            </div>

            {sinSocio ? (
              <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE', fontSize: 13, color: '#7C3AED' }}>
                📋 Rutina general — estará disponible para asignar a cualquier socio después.
              </div>
            ) : socioSel ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                <span style={{ fontWeight: 700, color: '#16A34A' }}>✓ {socioSel.nombre} {socioSel.apellido}</span>
                <span style={{ fontSize: 12, color: '#6B7280' }}>DNI {socioSel.dni}</span>
                <button type="button" className="gt-btn gt-btn-secondary" style={{ fontSize: 12, marginLeft: 'auto' }}
                  onClick={() => { setSocioSel(null); setBusquedaSocio('') }}>
                  Cambiar socio
                </button>
              </div>
            ) : (
              <div>
                <button type="button" className="gt-btn gt-btn-secondary" style={{ fontSize: 12, marginBottom: 10 }}
                  onClick={() => setMostrarBuscador(v => !v)}>
                  {mostrarBuscador ? 'Cerrar buscador' : 'Buscar socio'}
                </button>
                {mostrarBuscador && (
                  <div>
                    <input className="gt-input" placeholder="Nombre, apellido o DNI..."
                      value={busquedaSocio} onChange={e => setBusquedaSocio(e.target.value)}
                      style={{ marginBottom: 6 }} />
                    {busquedaSocio.length >= 1 && (
                      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
                        {socios
                          .filter(s => {
                            const q = busquedaSocio.toLowerCase()
                            return s.nombre.toLowerCase().includes(q) || s.apellido.toLowerCase().includes(q) || s.dni.includes(q)
                          })
                          .slice(0, 6)
                          .map(s => (
                            <div key={s.id} onClick={() => seleccionarSocio(s)}
                              style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 10, alignItems: 'center' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
                              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                              <span style={{ fontWeight: 700, color: '#1B5E44' }}>#{s.id}</span>
                              <span>{s.nombre} {s.apellido}</span>
                              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>DNI {s.dni}</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Observaciones del socio */}
            {obsMovio && socioSel && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 12, color: '#92400E' }}>
                  ⚠ Observaciones de {socioSel.nombre}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#78350F', whiteSpace: 'pre-wrap' }}>{obsMovio}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Botón submit ── */}
        {progreso && (
          <div className="gt-alert" style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#1D4ED8', marginBottom: 12 }}>
            {progreso}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando} style={{ minWidth: 160, fontSize: 15 }}>
            {guardando ? (progreso ?? 'Guardando…') : esEdicion ? 'Guardar cambios' : 'Crear rutina'}
          </button>
          <button type="button" className="gt-btn gt-btn-secondary" onClick={() => navigate('/rutinas')}>
            Cancelar
          </button>
        </div>

      </form>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 14, textAlign: 'center', padding: '0 20px' }}>
            {lightbox.nombre}
          </p>
          <img src={lightbox.url} alt={lightbox.nombre}
            style={{ maxWidth: '90vw', maxHeight: '75vh', borderRadius: 12, objectFit: 'contain', background: '#1a1a1a' }} />
          <button
            onClick={() => setLightbox(null)}
            style={{ marginTop: 18, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '8px 24px', cursor: 'pointer', fontSize: 14 }}>
            Cerrar
          </button>
        </div>
      )}

    </div>
  )
}
