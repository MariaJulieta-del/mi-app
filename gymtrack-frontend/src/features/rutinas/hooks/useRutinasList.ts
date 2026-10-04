import { useEffect, useMemo, useState } from 'react'
import type { Rutina } from '../types/Rutina'
import {
  obtenerRutinas, obtenerTodasRutinas, obtenerRutinasGenerales, eliminarRutina, clonarRutina,
} from '../services/rutinaService'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'
import { esPlantilla } from '../utils/rutinaUtils'

export type Tab = 'plantillas' | 'asignadas'

export function useRutinasList() {
  const { user } = useAuth()
  const toast = useToast()
  const esStaff = user?.rol === 'ADMIN' || user?.rol === 'PROFESOR'
  const socioId = user?.socioId ?? null

  const [asignadas, setAsignadas] = useState<Rutina[]>([])
  const [plantillas, setPlantillas] = useState<Rutina[]>([])
  const [tab, setTab] = useState<Tab>('plantillas')
  const [filtroTren, setFiltroTren] = useState('')
  const [filtroDificultad, setFiltroDificultad] = useState('')
  const [filtroObjetivo, setFiltroObjetivo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<Rutina | null>(null)
  const [guardandoPlantillaId, setGuardandoPlantillaId] = useState<number | null>(null)

  const cargar = () => {
    const pedido = esStaff
      ? Promise.all([obtenerTodasRutinas(), obtenerRutinasGenerales()]).then(([todas, generales]) => {
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
    } catch {
      toast.error('Error', 'No se pudo eliminar la rutina')
    }
  }

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
  const resetFiltros = () => { setFiltroTren(''); setFiltroDificultad(''); setFiltroObjetivo(''); setBusqueda('') }
  const cambiarTab = (t: Tab) => { setTab(t); resetFiltros() }

  return {
    esStaff, tab, cambiarTab, asignadas, plantillas,
    filtroTren, setFiltroTren, filtroDificultad, setFiltroDificultad, filtroObjetivo, setFiltroObjetivo, busqueda, setBusqueda,
    error, setError, cargando, lista, hayFiltros, resetFiltros,
    confirmarEliminar, setConfirmarEliminar, confirmarEliminarRutina,
    guardarComoPlantilla, guardandoPlantillaId,
  }
}
