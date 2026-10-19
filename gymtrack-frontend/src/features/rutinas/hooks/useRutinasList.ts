import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cambiarVisibilidadPlantilla } from '../services/pedidosService'
import { mensajeError } from '../../../shared/utils/errores'
import type { Rutina } from '../types/Rutina'
import {
  obtenerRutinas, obtenerTodasRutinas, obtenerRutinasGenerales, eliminarRutina, clonarRutina,
} from '../services/rutinaService'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'
import { esPlantilla } from '../utils/rutinaUtils'

export type Tab = 'plantillas' | 'asignadas' | 'pedidos'

export function useRutinasList() {
  const { user } = useAuth()
  const toast = useToast()
  const esStaff = user?.rol === 'ADMIN' || user?.rol === 'PROFESOR'
  const socioId = user?.socioId ?? null

  const [asignadas, setAsignadas] = useState<Rutina[]>([])
  const [plantillas, setPlantillas] = useState<Rutina[]>([])
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => (params.get('tab') === 'pedidos' ? 'pedidos' : params.get('tab') === 'asignadas' ? 'asignadas' : 'plantillas'))
  const [filtroTren, setFiltroTren] = useState('')
  const [filtroDificultad, setFiltroDificultad] = useState('')
  const [filtroObjetivo, setFiltroObjetivo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  /** Ventana con las rutinas para renovar (personalizadas y plantillas asignadas) */
  const [verRenovar, setVerRenovar] = useState(false)
  /** Plantilla cuyos socios asignados se están mirando */
  const [verAsignados, setVerAsignados] = useState<Rutina | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<Rutina | null>(null)
  const [guardandoPlantillaId, setGuardandoPlantillaId] = useState<number | null>(null)

  const cargar = () => {
    const pedido = esStaff
      ? Promise.all([obtenerTodasRutinas(), obtenerRutinasGenerales()]).then(([todas, generales]) => {
          // "De socios": solo las personalizadas (las plantillas asignadas se ven en cada plantilla)
          setAsignadas(todas.filter(r => !esPlantilla(r)))
          setPlantillas(generales)
        })
      : socioId
        ? obtenerRutinas(socioId).then(r => { setAsignadas(r); setTab('asignadas') })
        : Promise.resolve()
    return pedido
      .catch(() => setError('Error al cargar las rutinas'))
      .finally(() => setCargando(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar() }, [])

  const confirmarEliminarRutina = async () => {
    if (!confirmarEliminar) return
    const r = confirmarEliminar
    setConfirmarEliminar(null)
    try {
      await eliminarRutina(r.id!, r.socioId ?? null)
      if (esPlantilla(r)) setPlantillas(p => p.filter(x => x.id !== r.id))
      else setAsignadas(p => p.filter(x => x.id !== r.id))
      toast.success('Rutina eliminada', r.nombre)
    } catch (e) {
      toast.error('No se pudo eliminar', mensajeError(e, 'Probá de nuevo'))
    }
  }

  /** La lista de socios de una plantilla cambió (se quitó alguno) */
  const actualizarAsignados = (plantillaId: number, cantidad: number, paraRenovar: number) =>
    setPlantillas(p => p.map(x => (x.id === plantillaId ? { ...x, cantidadAsignados: cantidad, asignadosParaRenovar: paraRenovar } : x)))

  /** Copia una rutina de un socio como plantilla reutilizable */
  const guardarComoPlantilla = async (r: Rutina) => {
    if (!r.id) return
    setGuardandoPlantillaId(r.id)
    try {
      const nueva = await clonarRutina(r.id, null, r.nombre.replace(/ — .*$/, ''))
      setPlantillas(p => [...p, nueva])
      toast.success('Plantilla creada', `"${nueva.nombre}" ya se puede asignar a otros socios`)
    } catch {
      toast.error('Error', 'No se pudo crear la plantilla')
    } finally { setGuardandoPlantillaId(null) }
  }

  /** Mostrar u ocultar una plantilla en la app de los socios */
  const [cambiandoVisible, setCambiandoVisible] = useState<number | null>(null)
  const alternarVisible = async (r: Rutina) => {
    if (!r.id) return
    setCambiandoVisible(r.id)
    try {
      const nueva = await cambiarVisibilidadPlantilla(r.id, !r.visibleSocios)
      setPlantillas(p => p.map(x => (x.id === r.id ? { ...x, visibleSocios: nueva.visibleSocios } : x)))
      toast.success(nueva.visibleSocios ? 'Visible para los socios' : 'Oculta para los socios', r.nombre)
    } catch (e) {
      toast.error('No se pudo cambiar', mensajeError(e, 'Probá de nuevo'))
    } finally { setCambiandoVisible(null) }
  }

  const listaBase = tab === 'plantillas' ? plantillas : asignadas

  const lista = useMemo(() => listaBase
    .filter(r => !filtroTren || (r.trenes ?? []).includes(filtroTren))
    .filter(r => !filtroDificultad || r.dificultad === filtroDificultad)
    .filter(r => !filtroObjetivo || r.objetivo === filtroObjetivo)
    .filter(r => {
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return r.nombre.toLowerCase().includes(q) || (r.descripcion ?? '').toLowerCase().includes(q) || (r.socioNombre ?? '').toLowerCase().includes(q)
    }),
    [listaBase, filtroTren, filtroDificultad, filtroObjetivo, busqueda],
  )

  const hayFiltros = !!(filtroTren || filtroDificultad || filtroObjetivo || busqueda.trim())
  /** Personalizadas vencidas + socios con una plantilla asignada vencida */
  const paraRenovar = asignadas.filter(r => r.paraRenovar).length
    + plantillas.reduce((n, p) => n + (p.asignadosParaRenovar ?? 0), 0)
  const resetFiltros = () => { setFiltroTren(''); setFiltroDificultad(''); setFiltroObjetivo(''); setBusqueda('') }
  const cambiarTab = (t: Tab) => { setTab(t); resetFiltros() }

  return {
    esStaff, tab, cambiarTab, asignadas, plantillas,
    filtroTren, setFiltroTren, filtroDificultad, setFiltroDificultad, filtroObjetivo, setFiltroObjetivo, busqueda, setBusqueda,
    error, setError, cargando, lista, hayFiltros, resetFiltros, paraRenovar, verRenovar, setVerRenovar,
    verAsignados, setVerAsignados, actualizarAsignados,
    confirmarEliminar, setConfirmarEliminar, confirmarEliminarRutina,
    guardarComoPlantilla, guardandoPlantillaId, alternarVisible, cambiandoVisible,
  }
}
