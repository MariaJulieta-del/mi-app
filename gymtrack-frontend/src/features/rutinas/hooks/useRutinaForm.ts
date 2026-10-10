import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import {
  crearRutina, obtenerRutina, actualizarRutina, reemplazarEjercicios,
  obtenerRutinasGenerales, obtenerEjercicios, clonarRutina,
} from '../services/rutinaService'
import { DIAS_ORDER, ordenarDias, TREN_CONFIG, OBJETIVO_CONFIG } from '../utils/rutinaUtils'
import { listarTodosEjercicios, type Ejercicio as EjercicioCat } from '../../ejercicios/services/ejercicioService'
import { listarMaquinas, type Maquina } from '../../maquinas/services/maquinaService'
import { obtenerPorId } from '../../socios/services/socioService'
import { useBuscarSocios } from '../../../shared/hooks/useBuscarSocios'
import { obtenerFicha } from '../../socios/services/fichaService'
import type { Socio } from '../../socios/types/Socio'
import type { Rutina } from '../types/Rutina'

export const TRENES = [
  { id: 'SUPERIOR',  desc: 'Pecho, Espalda, Hombros, Bíceps, Tríceps',  grupos: ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Antebrazos'] },
  { id: 'INFERIOR',  desc: 'Cuádriceps, Femoral, Glúteos, Pantorrillas', grupos: ['Cuádriceps', 'Femoral', 'Glúteos', 'Pantorrillas'] },
  { id: 'CORE',      desc: 'Abdominales, Core, Lumbares',                grupos: ['Abdominales', 'Core', 'Lumbares'] },
  { id: 'CARDIO',    desc: 'Actividad aeróbica y resistencia',           grupos: ['Cardio'] },
  { id: 'FULL_BODY', desc: 'Trabajo completo de todo el cuerpo',         grupos: [] as string[] },
].map(t => ({ ...t, ...TREN_CONFIG[t.id] }))

export const DIAS = DIAS_ORDER

export interface EjItem {
  /** Id en la rutina (los que ya estaban guardados) */
  id?: number
  catId?: number
  nombre: string
  series: number
  reps: number
  descanso: number
  notas: string
  imagenUrl?: string
  /** Día dentro de la rutina (1 = primer día de diasSemana, 2 = segundo, etc.) */
  dia?: number
}

export function useRutinaForm() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const esAdmin = user?.rol === 'ADMIN' || user?.rol === 'PROFESOR'
  const esEdicion = Boolean(id)
  const socioIdAuth = user?.socioId ?? null
  const socioIdParam = searchParams.get('socioId') ? Number(searchParams.get('socioId')) : null
  const esGeneral = searchParams.get('general') === 'true'

  // ── Form state ──
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [trenesSel, setTrenesSel] = useState<string[]>([])
  const [dias, setDias] = useState<string[]>([])
  const [dificultad, setDificultad] = useState('')
  const [objetivo, setObjetivo] = useState('')
  /** Indicaciones personales del profe (solo rutinas de un socio) */
  const [notasProfe, setNotasProfe] = useState('')
  /** Al editar: de quién es la rutina */
  const [duenio, setDuenio] = useState<{ id: number | null; nombre: string | null } | null>(null)
  const [cargandoRutina, setCargandoRutina] = useState(esEdicion)
  const [ejercicios, setEjercicios] = useState<EjItem[]>([])
  /** Día que se está armando (pestaña activa); los ejercicios del catálogo se agregan a este día */
  const [diaActivo, setDiaActivo] = useState(1)
  /** Al crear para un socio, guardar además una copia como plantilla */
  const [tambienPlantilla, setTambienPlantilla] = useState(false)

  // ── Socio (admin) ──
  const [sinSocio, setSinSocio] = useState(esGeneral || !esAdmin)
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [socioSel, setSocioSel] = useState<Socio | null>(null)
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  // Búsqueda en el servidor mientras se escribe
  const socios = useBuscarSocios(mostrarBuscador ? busquedaSocio : '', { tam: 6 }).resultados
  const [obsMovio, setObsMovio] = useState<string | null>(null)

  // ── Catálogo ──
  const [catalogo, setCatalogo] = useState<EjercicioCat[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [busqEj, setBusqEj] = useState('')
  const [mostrarCat, setMostrarCat] = useState(false)
  /** Filtro rápido del catálogo por grupo muscular */
  const [grupoCat, setGrupoCat] = useState('')
  /** Último ejercicio agregado (para resaltarlo un momento) */
  const [recienAgregado, setRecienAgregado] = useState<number | null>(null)

  // ── Rutinas generales como base ──
  const [generales, setGenerales] = useState<Rutina[]>([])
  const [mostrarPicker, setMostrarPicker] = useState(false)
  const [busqGeneral, setBusqGeneral] = useState('')
  const [rutinaBaseNombre, setRutinaBaseNombre] = useState<string | null>(null)
  const [cargandoBase, setCargandoBase] = useState(false)

  // ── UI ──
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ url: string; nombre: string } | null>(null)

  // ── Efectos ──
  useEffect(() => {
    listarTodosEjercicios().then(setCatalogo).catch(() => {})
    listarMaquinas(true).then(setMaquinas).catch(() => {})
  }, [])

  useEffect(() => {
    if (mostrarPicker && generales.length === 0) {
      obtenerRutinasGenerales().then(setGenerales).catch(() => {})
    }
  }, [mostrarPicker, generales.length])

  useEffect(() => {
    if (!esEdicion || !id) return
    const sid = esAdmin ? (esGeneral ? null : socioIdParam) : socioIdAuth
    Promise.all([obtenerRutina(Number(id), sid), obtenerEjercicios(Number(id), sid)])
      .then(([r, ejs]) => {
        setNombre(r.nombre)
        setDescripcion(r.descripcion ?? '')
        setTrenesSel(r.trenes ?? [])
        setDias(ordenarDias(r.diasSemana))
        setDificultad(r.dificultad ?? '')
        setObjetivo(r.objetivo ?? '')
        setNotasProfe(r.notasProfe ?? '')
        setDuenio({ id: r.socioId ?? null, nombre: r.socioNombre ?? null })
        setSinSocio(r.socioId == null)
        setEjercicios(ejs.filter(e => !e.esCalentamiento).map(e => ({
          id: e.id,
          catId: e.ejercicioCatalogoId,
          nombre: e.nombreEjercicio,
          series: e.series ?? 3,
          reps: e.repeticiones ?? 10,
          descanso: e.descansoSeg ?? 60,
          notas: e.notas ?? '',
          imagenUrl: e.imagenUrl,
          dia: e.dia ?? 1,
        })))
      })
      .catch(() => setError('No se pudo cargar la rutina'))
      .finally(() => setCargandoRutina(false))
  }, [id, esAdmin, esEdicion, esGeneral, socioIdAuth, socioIdParam])

  useEffect(() => {
    if (socioIdParam && esAdmin && !esEdicion) {
      obtenerPorId(socioIdParam).then(s => seleccionarSocio(s)).catch(() => {})
    }
  }, [socioIdParam, esAdmin, esEdicion])

  // ── Helpers ──
  function seleccionarSocio(s: Socio) {
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
    setDias(ordenarDias(r.diasSemana))
    setDiaActivo(1)
    setDificultad(r.dificultad ?? '')
    setObjetivo(r.objetivo ?? '')
    setRutinaBaseNombre(r.nombre)
    try {
      const ejsBase = await obtenerEjercicios(r.id!, null)
      setEjercicios(ejsBase.filter(e => !e.esCalentamiento).map(e => ({
        catId: e.ejercicioCatalogoId,
        nombre: e.nombreEjercicio,
        series: e.series ?? 3,
        reps: e.repeticiones ?? 10,
        descanso: e.descansoSeg ?? 60,
        notas: e.notas ?? '',
        imagenUrl: e.imagenUrl,
        dia: e.dia ?? 1,
      })))
    } catch {
      setEjercicios([])
    } finally {
      setCargandoBase(false)
    }
  }

  const limpiarBase = () => {
    setRutinaBaseNombre(null)
    setNombre(''); setDescripcion(''); setTrenesSel([]); setDias([]); setDiaActivo(1); setDificultad(''); setObjetivo(''); setEjercicios([])
  }

  const getSocioId = (): number | null => {
    if (!esAdmin) return socioIdAuth
    // Al editar, la rutina ya tiene dueño: no se vuelve a elegir
    if (esEdicion) return duenio?.id ?? null
    if (sinSocio) return null
    return socioSel?.id ?? null
  }

  /**
   * Los días siempre quedan ordenados de lunes a domingo. Como cada ejercicio guarda
   * el NÚMERO de día (posición en esa lista), al marcar/desmarcar un día se reubican
   * los ejercicios para que sigan en el mismo día de la semana. Los ejercicios de un
   * día que se desmarca pasan al Día 1.
   */
  const toggleDia = (dia: string) => {
    const antes = dias
    const despues = ordenarDias(antes.includes(dia) ? antes.filter(d => d !== dia) : [...antes, dia])
    setDias(despues)
    setEjercicios(prev => prev.map(e => {
      const nombreDia = antes[(e.dia ?? 1) - 1]
      const nuevo = nombreDia ? despues.indexOf(nombreDia) + 1 : (e.dia ?? 1)
      return { ...e, dia: nuevo >= 1 && nuevo <= Math.max(despues.length, 1) ? nuevo : 1 }
    }))
    const nombreActivo = antes[diaActivo - 1]
    const nuevoActivo = nombreActivo ? despues.indexOf(nombreActivo) + 1 : 0
    setDiaActivo(nuevoActivo >= 1 ? nuevoActivo : 1)
  }

  const toggleTren = (tid: string) =>
    setTrenesSel(prev => prev.includes(tid) ? prev.filter(t => t !== tid) : [...prev, tid])

  const agregarEjDesde = (e: EjercicioCat, dia = diaActivo) => {
    if (ejercicios.some(x => x.catId === e.id && (x.dia ?? 1) === dia)) return
    // Series, repeticiones y descanso según el objetivo elegido
    const esq = OBJETIVO_CONFIG[objetivo]?.esquema ?? { series: 3, reps: 10, descanso: 60 }
    if (e.id) setRecienAgregado(e.id)
    setEjercicios(prev => [...prev, {
      catId: e.id,
      nombre: e.nombre,
      series: esq.series,
      reps: esq.reps,
      descanso: esq.descanso,
      notas: '',
      imagenUrl: e.imagenUrl,
      dia,
    }])
  }

  /** Aplica el esquema del objetivo (ej. 4×10, 90 s) a todos los ejercicios cargados */
  const aplicarEsquema = () => {
    const esq = OBJETIVO_CONFIG[objetivo]?.esquema
    if (!esq) return
    setEjercicios(prev => prev.map(e => ({ ...e, series: esq.series, reps: esq.reps, descanso: esq.descanso })))
  }

  const quitarEj = (idx: number) => setEjercicios(prev => prev.filter((_, i) => i !== idx))

  /** Sube o baja un ejercicio dentro de su día */
  const moverEj = (idx: number, dir: -1 | 1) => setEjercicios(prev => {
    const dia = prev[idx].dia ?? 1
    const delDia = prev.map((e, i) => ({ e, i })).filter(x => (x.e.dia ?? 1) === dia).map(x => x.i)
    const pos = delDia.indexOf(idx)
    const otro = delDia[pos + dir]
    if (otro == null) return prev
    const copia = [...prev]
    const tmp = copia[idx]
    copia[idx] = copia[otro]
    copia[otro] = tmp
    return copia
  })

  /** Copia todos los ejercicios de un día a otro (los que ya estén no se repiten) */
  const copiarDia = (desde: number, hacia: number) => setEjercicios(prev => {
    const yaHay = new Set(prev.filter(e => (e.dia ?? 1) === hacia).map(e => e.catId ?? e.nombre))
    const nuevos = prev.filter(e => (e.dia ?? 1) === desde && !yaHay.has(e.catId ?? e.nombre)).map(e => ({ ...e, dia: hacia }))
    return [...prev, ...nuevos]
  })

  const actualizarEj = (idx: number, campo: keyof EjItem, valor: string | number) => {
    setEjercicios(prev => prev.map((e, i) => i === idx ? { ...e, [campo]: valor } : e))
  }

  // ── Computed ──
  const gruposSeleccionados = Array.from(new Set(
    trenesSel.flatMap(tid => TRENES.find(t => t.id === tid)?.grupos ?? [])
  ))
  const hayFullBody = trenesSel.includes('FULL_BODY')

  const catalogoFiltrado = catalogo.filter(e => {
    if (!e.activo) return false
    const matchBusq = e.nombre.toLowerCase().includes(busqEj.toLowerCase())
    if (grupoCat && !(e.grupos ?? []).includes(grupoCat)) return false
    if (trenesSel.length > 0 && !hayFullBody) {
      return matchBusq && (e.grupos ?? []).some(g => gruposSeleccionados.includes(g))
    }
    return matchBusq
  })

  const maquinasFiltradas = trenesSel.length > 0 && !hayFullBody
    ? maquinas.filter(m => gruposSeleccionados.some(g => (m.grupos ?? []).includes(g)))
    : maquinas

  // ── Submit ──
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    if (esAdmin && !esEdicion && !sinSocio && !socioSel) { setError('Seleccioná un socio o marcá "Sin asignar a socio"'); window.scrollTo({ top: 0, behavior: 'smooth' }); return }

    const sid = getSocioId()
    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      trenes: trenesSel.length > 0 ? trenesSel : undefined,
      diasSemana: dias.length > 0 ? dias : undefined,
      dificultad: dificultad || undefined,
      objetivo: objetivo || undefined,
      notasProfe: sid !== null ? notasProfe.trim() : undefined,
    }
    // Ordenados por día (y dentro del día, como están en pantalla)
    const lista = [...ejercicios]
      .map((e, i) => ({ e, i }))
      .sort((a, b) => (a.e.dia ?? 1) - (b.e.dia ?? 1) || a.i - b.i)
      .map(({ e }) => ({
        id: e.id,
        nombreEjercicio: e.nombre,
        series: e.series,
        repeticiones: e.reps,
        descansoSeg: e.descanso,
        notas: e.notas || undefined,
        ejercicioCatalogoId: e.catId,
        dia: e.dia ?? 1,
      }))

    setGuardando(true); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      if (esEdicion && id) {
        await actualizarRutina(Number(id), sid, datos)
        setProgreso('Guardando ejercicios…')
        await reemplazarEjercicios(Number(id), sid, lista)
        navigate(esGeneral ? `/rutinas/${id}?general=true` : esAdmin ? `/rutinas/${id}?socioId=${sid}` : `/rutinas/${id}`)
        return
      }

      const nueva = await crearRutina(sid, datos)
      const rutinaId = nueva.id!
      if (lista.length > 0) {
        setProgreso('Guardando ejercicios…')
        await reemplazarEjercicios(rutinaId, sid, lista.map(x => ({ ...x, id: undefined })))
      }

      if (sid !== null && esAdmin && tambienPlantilla) {
        setProgreso('Guardando copia como plantilla…')
        try { await clonarRutina(rutinaId, null, nombre.trim()) }
        catch { /* la rutina del socio ya quedó guardada; la plantilla se puede crear después desde la lista */ }
      }

      navigate(sid === null ? `/rutinas/${rutinaId}?general=true` : esAdmin ? `/rutinas/${rutinaId}?socioId=${sid}` : `/rutinas/${rutinaId}`)
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string; campos?: Record<string, string> } } }
      const serverMsg = axErr?.response?.data?.error
      const camposMsg = axErr?.response?.data?.campos
        ? Object.entries(axErr.response.data.campos).map(([k, v]) => `${k}: ${v}`).join(', ')
        : null
      setError(camposMsg ?? serverMsg ?? 'Error al guardar la rutina')
    } finally {
      setGuardando(false); setProgreso(null)
    }
  }

  return {
    // Config
    esAdmin, esEdicion, esGeneral, socioIdParam,
    navigate,
    // Form fields
    nombre, setNombre,
    descripcion, setDescripcion,
    trenesSel, toggleTren,
    dias, toggleDia,
    dificultad, setDificultad,
    objetivo, setObjetivo, aplicarEsquema,
    notasProfe, setNotasProfe, duenio, cargandoRutina,
    ejercicios,
    diaActivo, setDiaActivo,
    tambienPlantilla, setTambienPlantilla,
    // Socio
    sinSocio, setSinSocio,
    socios, busquedaSocio, setBusquedaSocio,
    socioSel, setSocioSel,
    mostrarBuscador, setMostrarBuscador,
    obsMovio, seleccionarSocio,
    // Catálogo
    catalogo, maquinas, maquinasFiltradas,
    busqEj, setBusqEj,
    mostrarCat, setMostrarCat,
    grupoCat, setGrupoCat, recienAgregado,
    // Picker
    generales, mostrarPicker, setMostrarPicker,
    busqGeneral, setBusqGeneral,
    rutinaBaseNombre, cargandoBase,
    aplicarRutinaGeneral, limpiarBase,
    // Computed
    gruposSeleccionados, hayFullBody, catalogoFiltrado,
    // Ej ops
    agregarEjDesde, quitarEj, actualizarEj, moverEj, copiarDia,
    // UI
    error, setError,
    guardando, progreso,
    lightbox, setLightbox,
    // Submit
    handleSubmit,
  }
}
