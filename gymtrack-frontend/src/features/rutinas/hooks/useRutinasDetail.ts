import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import type { Rutina, Ejercicio, EjercicioRequestDTO } from '../types/Rutina'
import {
  obtenerRutina, obtenerEjercicios, agregarEjercicio, eliminarEjercicio, actualizarEjercicioEnRutina,
} from '../services/rutinaService'
import { guardarProgreso, getProgresoRutina } from '../services/progresoService'
import { obtenerPorSocio } from '../../membresias/services/membresiaService'
import type { Membresia } from '../../membresias/types/Membresia'
import { listarTodosEjercicios, type Ejercicio as EjercicioCat } from '../../ejercicios/services/ejercicioService'
import { listarMaquinas, type Maquina } from '../../maquinas/services/maquinaService'
import { resolverImagenEjercicio } from '../../ejercicios/assets/imagenesEjercicios'

export const TREN_CONFIG: Record<string, { emoji: string; label: string; bg: string; color: string; grupos: string[] }> = {
  SUPERIOR:  { emoji: '💪', label: 'Tren Superior',  bg: 'var(--blue-bg)',    color: 'var(--blue-text)',    grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'] },
  INFERIOR:  { emoji: '🦵', label: 'Tren Inferior',  bg: 'var(--green-bg)',   color: 'var(--green-text)',   grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'] },
  CORE:      { emoji: '🔥', label: 'Core / Abdomen', bg: 'var(--yellow-bg)',  color: 'var(--yellow-text)',  grupos: ['Abdominales', 'Core', 'Lumbares'] },
  CARDIO:    { emoji: '❤️', label: 'Cardio',          bg: 'var(--red-light)', color: 'var(--red)',          grupos: ['Cardio'] },
  FULL_BODY: { emoji: '⚡', label: 'Full Body',       bg: 'var(--purple-bg)', color: 'var(--purple-text)', grupos: [] },
}
export const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const resolverImgEstatica = resolverImagenEjercicio

export function useRutinasDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const esAdmin = user?.rol === 'ADMIN' || user?.rol === 'PROFESOR'
  const esSocio = user?.rol === 'SOCIO'
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

  // Agregar ejercicio
  const [showAgregar, setShowAgregar] = useState(false)
  const [busqEj, setBusqEj] = useState('')
  const [ejSel, setEjSel] = useState<EjercicioCat | null>(null)
  const [series, setSeries] = useState(3)
  const [reps, setReps] = useState(10)
  const [descanso, setDescanso] = useState(60)
  const [peso, setPeso] = useState<number | ''>('')
  const [notas, setNotas] = useState('')
  const [diaAgregar, setDiaAgregar] = useState(1)
  const [agregando, setAgregando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [confirmarQuitarId, setConfirmarQuitarId] = useState<number | null>(null)

  // Progreso
  const [progresoHoy, setProgresoHoy] = useState<Record<number, { pesoKg?: number; repeticionesReales?: number; seriesRealizadas?: number }>>({})
  const [guardandoProgreso, setGuardandoProgreso] = useState<number | null>(null)

  // Membresía del socio (para mostrarle sus pases del mes)
  const [membresia, setMembresia] = useState<Membresia | null>(null)

  // Día activo
  const [diaActivo, setDiaActivo] = useState(1)

  // Edición inline
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editSeries, setEditSeries] = useState('')
  const [editReps, setEditReps] = useState('')
  const [editDescanso, setEditDescanso] = useState('')
  const [editPeso, setEditPeso] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  // Lightbox / GIF
  const [lightbox, setLightbox] = useState<{ url: string; nombre: string } | null>(null)
  const [gifCache, setGifCache] = useState<Record<string, string>>({})

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
      if (esSocio && socioId) {
        getProgresoRutina(socioId, rutinaId).then(prog => {
          const hoy: Record<number, { pesoKg?: number; repeticionesReales?: number; seriesRealizadas?: number }> = {}
          for (const [ejId, registros] of Object.entries(prog)) {
            if (registros.length > 0) {
              const r = registros[0]
              hoy[Number(ejId)] = { pesoKg: r.pesoKg ?? undefined, repeticionesReales: r.repeticionesReales ?? undefined, seriesRealizadas: r.seriesRealizadas ?? undefined }
            }
          }
          setProgresoHoy(hoy)
        }).catch(() => {})
        obtenerPorSocio(socioId).then(setMembresia).catch(() => {})
      }
    }).catch(() => setError('Error al cargar la rutina'))
      .finally(() => setCargando(false))
  }, [id, esSocio, socioId])

  // Computed
  const trenInfo = (rutina?.trenes && rutina.trenes.length > 0)
    ? (TREN_CONFIG[rutina.trenes[0]] ?? null)
    : null

  const gruposRutina = Array.from(new Set(
    (rutina?.trenes ?? []).flatMap(tid => (TREN_CONFIG[tid]?.grupos ?? []))
  ))
  const hayFullBody = (rutina?.trenes ?? []).includes('FULL_BODY')

  const catalogoFiltrado = catalogo.filter(e => {
    if (!e.activo) return false
    const matchBusq = e.nombre.toLowerCase().includes(busqEj.toLowerCase())
    if (gruposRutina.length > 0 && !hayFullBody) {
      return matchBusq && (e.grupos ?? []).some(g => gruposRutina.includes(g))
    }
    return matchBusq
  })

  const resolverMaquinas = (maquinaIds?: number[]) =>
    (maquinaIds ?? []).map(mid => maquinas.find(m => m.id === mid)).filter(Boolean) as Maquina[]

  const maquinasFiltradas = gruposRutina.length > 0 && !hayFullBody
    ? maquinas.filter(m => gruposRutina.some(g => (m.grupos ?? []).includes(g)))
    : maquinas

  const linkEditar = esGeneral
    ? `/rutinas/editar/${id}?general=true`
    : esAdmin ? `/rutinas/editar/${id}?socioId=${socioId}` : `/rutinas/editar/${id}`

  // Handlers
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

  const abrirGif = (nombreEjercicio: string) => {
    if (gifCache[nombreEjercicio]) {
      setLightbox({ url: gifCache[nombreEjercicio], nombre: nombreEjercicio })
      return
    }
    const staticUrl = resolverImgEstatica(nombreEjercicio)
    if (staticUrl) {
      setGifCache(c => ({ ...c, [nombreEjercicio]: staticUrl }))
      setLightbox({ url: staticUrl, nombre: nombreEjercicio })
    }
  }

  const handleGuardarProgreso = async (ejId: number) => {
    if (!socioId) return
    setGuardandoProgreso(ejId)
    try {
      const prog = progresoHoy[ejId] ?? {}
      await guardarProgreso({ socioId, rutinaEjercicioId: ejId, pesoKg: prog.pesoKg ?? null, repeticionesReales: prog.repeticionesReales ?? null, seriesRealizadas: prog.seriesRealizadas ?? null })
    } catch { /* silencioso */ }
    finally { setGuardandoProgreso(null) }
  }

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
        dia: diaAgregar,
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

  return {
    id, navigate,
    esAdmin, esSocio, esGeneral, socioId, linkEditar,
    rutina, ejercicios, maquinas, catalogo, cargando, error, setError,
    // Agregar
    showAgregar, setShowAgregar,
    busqEj, setBusqEj,
    ejSel, setEjSel,
    series, setSeries,
    reps, setReps,
    descanso, setDescanso,
    peso, setPeso,
    notas, setNotas,
    diaAgregar, setDiaAgregar,
    agregando, eliminandoId,
    confirmarQuitarId, setConfirmarQuitarId,
    // Progreso
    progresoHoy, setProgresoHoy,
    guardandoProgreso,
    membresia,
    // Día activo
    diaActivo, setDiaActivo,
    // Edición inline
    editingId, setEditingId,
    editSeries, setEditSeries,
    editReps, setEditReps,
    editDescanso, setEditDescanso,
    editPeso, setEditPeso,
    guardandoEdit,
    // Lightbox
    lightbox, setLightbox, gifCache,
    // Computed
    trenInfo, gruposRutina, hayFullBody,
    catalogoFiltrado, resolverMaquinas, maquinasFiltradas,
    // Handlers
    abrirEdicion, guardarEdicion, abrirGif,
    handleGuardarProgreso, handleAgregar, handleEliminar,
  }
}
