import { mensajeError } from '../../../shared/utils/errores'
import { useState, useEffect, useMemo } from 'react'
import type { Maquina } from '../types/Maquina'
import { fechaLocalISO } from '../../../shared/utils/fechas'
import type { Ejercicio } from '../../ejercicios/services/ejercicioService'
import type { CatalogMaquina } from '../assets/maquinasCatalog'
import type { MaquinaEstadisticas } from '../types/Mantenimiento'
import {
  listarMaquinas, crearMaquina, actualizarMaquina,
  desactivarMaquina, activarMaquina,
} from '../services/maquinaService'
import { listarTodosEjercicios } from '../../ejercicios/services/ejercicioService'
import { estadisticasMaquina, crearMantenimiento } from '../services/mantenimientoService'

const VACIO: Omit<Maquina, 'id'> = {
  nroMaquina: '', nombre: '', descripcion: '',
  grupos: [], instruccionesUso: '', ajustes: '', activa: true,
}

/** onMantenimientoCreado: para refrescar la lista de Mantenimiento al reportar desde Mis máquinas */
export function useMaquinas(onMantenimientoCreado?: () => void) {
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [cargando, setCargando] = useState(true)

  // Mis máquinas — filtros
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [verInactivas, setVerInactivas] = useState(false)

  // Mis máquinas — form
  const [form, setForm] = useState<Omit<Maquina, 'id'>>({ ...VACIO })
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Expand / stats
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [statsCache, setStatsCache] = useState<Record<number, MaquinaEstadisticas>>({})
  const [loadingStats, setLoadingStats] = useState<number | null>(null)

  // Catálogo helpers
  const [guardandoCat, setGuardandoCat] = useState<string | null>(null)
  const [catError, setCatError] = useState<string | null>(null)

  // Reportar mantenimiento rápido
  const [reportarId, setReportarId] = useState<number | null>(null)
  const [reportarTipo, setReportarTipo] = useState<'PREVENTIVO' | 'CORRECTIVO' | null>(null)
  const [reportarDesc, setReportarDesc] = useState('')
  const [reportarCosto, setReportarCosto] = useState('')
  const [reportarGuardando, setReportarGuardando] = useState(false)
  const [reportarError, setReportarError] = useState<string | null>(null)

  const abrirMenuReportar = (maquinaId: number) => {
    setReportarId(maquinaId)
    setReportarTipo(null)
    setReportarDesc('')
    setReportarCosto('')
    setReportarError(null)
  }

  const abrirReportar = (maquinaId: number, tipo: 'PREVENTIVO' | 'CORRECTIVO' = 'CORRECTIVO') => {
    setReportarId(maquinaId)
    setReportarTipo(tipo)
    setReportarDesc('')
    setReportarCosto('')
    setReportarError(null)
  }

  const cerrarReportar = () => {
    setReportarId(null)
    setReportarTipo(null)
    setReportarDesc('')
    setReportarCosto('')
    setReportarError(null)
  }

  const submitReportar = async () => {
    if (!reportarId || !reportarTipo) return
    if (!reportarDesc.trim()) { setReportarError('Describí el problema antes de reportar'); return }
    setReportarGuardando(true)
    setReportarError(null)
    try {
      const costoNum = reportarCosto.trim() ? Number(reportarCosto.replace(',', '.')) : undefined
      await crearMantenimiento({
        maquinaId: reportarId,
        tipo: 'PENDIENTE',
        categoria: reportarTipo,
        descripcion: reportarDesc.trim(),
        fechaMantenimiento: fechaLocalISO(),
        ...(costoNum != null && !isNaN(costoNum) ? { costo: costoNum } : {}),
      })
      setMsg(`Reporte ${reportarTipo === 'PREVENTIVO' ? 'preventivo' : 'correctivo'} registrado.`)
      cerrarReportar()
      onMantenimientoCreado?.()
      // Refrescar stats de esa máquina
      if (statsCache[reportarId]) {
        estadisticasMaquina(reportarId)
          .then(s => setStatsCache(prev => ({ ...prev, [reportarId]: s })))
          .catch(() => {/* silencioso */})
      }
    } catch (e: unknown) {
      setReportarError(mensajeError(e, 'Error al guardar el reporte'))
    } finally {
      setReportarGuardando(false)
    }
  }

  const cargar = () =>
    Promise.all([listarMaquinas(false), listarTodosEjercicios()])
      .then(([maks, ejs]) => { setMaquinas(maks); setEjercicios(ejs) })
      .catch(() => setError('Error al cargar'))
      .finally(() => setCargando(false))

  useEffect(() => { cargar() }, [])

  const ejerciciosCompatibles = (grupos: string[]): Ejercicio[] => {
    if (!grupos || grupos.length === 0) return []
    return ejercicios.filter(e =>
      e.activo && !e.esMaquina && (e.grupos ?? []).some(g => grupos.includes(g))
    )
  }

  /** Ejercicios asociados a la máquina (los que el socio ve con este número) */
  const ejerciciosDe = (maquinaId: number): Ejercicio[] =>
    ejercicios.filter(e => e.activo !== false && (e.maquinaIds ?? []).includes(maquinaId))

  const nombresGuardados = useMemo(
    () => new Set(maquinas.map(m => m.nombre.toLowerCase())),
    [maquinas]
  )

  const filtradas = maquinas.filter(m => {
    if (!verInactivas && !m.activa) return false
    const matchBusq = m.nombre.toLowerCase().includes(busqueda.toLowerCase())
      || (m.nroMaquina ?? '').toLowerCase().includes(busqueda.toLowerCase())
    const matchGrupo = !filtroGrupo || (m.grupos ?? []).includes(filtroGrupo)
    return matchBusq && matchGrupo
  })

  const toggleExpand = (id: number) => {
    const newId = expandedId === id ? null : id
    setExpandedId(newId)
    if (newId && !statsCache[newId]) {
      setLoadingStats(newId)
      estadisticasMaquina(newId)
        .then(s => setStatsCache(prev => ({ ...prev, [newId]: s })))
        .catch(() => {/* silencioso */})
        .finally(() => setLoadingStats(null))
    }
  }

  const abrirNuevo = () => {
    setForm({ ...VACIO }); setEditandoId(null); setShowForm(true); setError(null); setExpandedId(null)
  }

  const abrirEditar = (m: Maquina) => {
    setForm({
      nroMaquina: m.nroMaquina, nombre: m.nombre, descripcion: m.descripcion ?? '',
      grupos: m.grupos ? [...m.grupos] : [], instruccionesUso: m.instruccionesUso ?? '',
      ajustes: m.ajustes ?? '', activa: m.activa,
    })
    setEditandoId(m.id!); setShowForm(true); setError(null); setExpandedId(null)
  }

  const cancelar = () => { setShowForm(false); setForm({ ...VACIO }); setEditandoId(null) }

  const toggleGrupoForm = (g: string) =>
    setForm(f => ({
      ...f,
      grupos: (f.grupos ?? []).includes(g)
        ? (f.grupos ?? []).filter(x => x !== g)
        : [...(f.grupos ?? []), g],
    }))

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError(null)
    try {
      if (editandoId) { await actualizarMaquina(editandoId, form); setMsg('Máquina actualizada.') }
      else { await crearMaquina(form); setMsg('Máquina creada.') }
      cancelar(); await cargar()
    } catch (e: unknown) {
      setError(mensajeError(e, 'Error al guardar'))
    } finally { setGuardando(false) }
  }

  const toggleActiva = async (m: Maquina) => {
    try {
      if (m.activa) await desactivarMaquina(m.id!)
      else await activarMaquina(m.id!)
      await cargar()
    } catch { setError('Error al cambiar estado') }
  }

  const guardarDeCatalogo = async (cat: CatalogMaquina) => {
    setGuardandoCat(cat.id)
    setCatError(null)
    try {
      await crearMaquina({
        nroMaquina: '',
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        grupos: [...cat.grupos],
        instruccionesUso: cat.instruccionesUso,
        ajustes: cat.ajustes,
        activa: true,
      })
      setMsg(`"${cat.nombre}" guardada en Mis máquinas.`)
      await cargar()
    } catch (e: unknown) {
      setCatError(mensajeError(e, 'Error al guardar'))
    } finally {
      setGuardandoCat(null)
    }
  }

  return {
    // data
    maquinas, ejercicios, filtradas, nombresGuardados, cargando, ejerciciosDe,
    // filtros
    busqueda, setBusqueda, filtroGrupo, setFiltroGrupo,
    verInactivas, setVerInactivas,
    // form
    form, setForm, editandoId, showForm, guardando,
    msg, setMsg, error, setError,
    // expand
    expandedId, statsCache, loadingStats,
    // catalogo
    guardandoCat, catError, setCatError,
    // reportar
    reportarId, reportarTipo, setReportarTipo, reportarDesc, setReportarDesc,
    reportarCosto, setReportarCosto,
    reportarGuardando, reportarError,
    abrirMenuReportar, abrirReportar, cerrarReportar, submitReportar,
    // handlers
    cargar, abrirNuevo, abrirEditar, cancelar, guardar,
    toggleActiva, toggleExpand, toggleGrupoForm,
    ejerciciosCompatibles, guardarDeCatalogo,
  }
}
