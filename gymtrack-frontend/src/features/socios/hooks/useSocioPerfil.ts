import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'
import { obtenerPorId } from '../services/socioService'
import { obtenerPorSocio, cambiarEstado } from '../../membresias/services/membresiaService'
import { obtenerRutinas, obtenerEjercicios, eliminarRutina, quitarAsignacion, personalizarPlantilla } from '../../rutinas/services/rutinaService'
import { linkEditarRutina } from '../../rutinas/utils/rutinaUtils'
import { guardarProgreso } from '../../rutinas/services/progresoService'
import { listarMaquinas, type Maquina } from '../../maquinas/services/maquinaService'
import { obtenerFicha } from '../services/fichaService'
import type { Socio } from '../types/Socio'
import type { Membresia } from '../../membresias/types/Membresia'
import type { Rutina, Ejercicio } from '../../rutinas/types/Rutina'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const hoyIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()

type ErrorApi = { response?: { data?: { error?: string } } }
const mensajeError = (e: unknown, porDefecto: string) => (e as ErrorApi)?.response?.data?.error ?? porDefecto

export function useSocioPerfil() {
  const { socioId } = useParams<{ socioId: string }>()
  const navigate = useNavigate()
  const id = Number(socioId)
  const { user, logout } = useAuth()
  const toast = useToast()
  const esSocio = user?.rol === 'SOCIO'
  const esAdmin = user?.rol === 'ADMIN'

  // ── Datos principales ──
  const [socio, setSocio] = useState<Socio | null>(null)
  const [membresia, setMembresia] = useState<Membresia | null>(null)
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [observacionesMedicas, setObservacionesMedicas] = useState<string | null>(null)
  const [ejerciciosPorRutina, setEjerciciosPorRutina] = useState<Record<number, Ejercicio[]>>({})
  const [cargandoEjs, setCargandoEjs] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Acciones con confirmación ──
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const [confirmarEliminarRutinaId, setConfirmarEliminarRutinaId] = useState<number | null>(null)
  const [eliminandoRutinaId, setEliminandoRutinaId] = useState<number | null>(null)


  // ── Mi semana ──
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoyIdx)
  const [expandedEjs, setExpandedEjs] = useState<Set<number>>(new Set())
  const [progresoHoy, setProgresoHoy] = useState<Record<number, { seriesRealizadas?: number; repeticionesReales?: number; pesoKg?: number }>>({})
  const [guardandoProgreso, setGuardandoProgreso] = useState<number | null>(null)

  // ── Logout ──
  const [confirmLogout, setConfirmLogout] = useState(false)

  const cargar = () => {
    if (!id) return Promise.resolve()
    return Promise.all([
      obtenerPorId(id),
      obtenerPorSocio(id).catch(() => null),
      obtenerRutinas(id).catch(() => [] as Rutina[]),
    ]).then(async ([s, mem, ruts]) => {
    setSocio(s); setMembresia(mem); setRutinas(ruts)

    if (!esSocio) {
      obtenerFicha(id)
        .then(f => {
          const obs = [f?.observacionesMedicas, f?.lesiones ? `Lesiones: ${f.lesiones}` : ''].filter(Boolean).join(' · ')
          setObservacionesMedicas(obs || null)
        })
        .catch(() => {})
    }

    setCargandoEjs(true)
    const [maks, ejsArr] = await Promise.all([
      listarMaquinas().catch(() => [] as Maquina[]),
      Promise.all(ruts.map(r => r.id != null ? obtenerEjercicios(r.id, id).catch(() => [] as Ejercicio[]) : Promise.resolve([] as Ejercicio[]))),
    ])
    setMaquinas(maks)
    const mapa: Record<number, Ejercicio[]> = {}
    ruts.forEach((r, i) => { mapa[r.id!] = ejsArr[i] })
    setEjerciciosPorRutina(mapa)
    setCargandoEjs(false)
    })
  }

  useEffect(() => {
    cargar()
      .catch(() => setError('No se pudo cargar la información del socio'))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleCancelarMembresia = async () => {
    setConfirmarCancelar(false)
    if (!membresia) return
    try {
      setMembresia(await cambiarEstado(membresia.id, 'CANCELADA'))
      toast.success('Membresía cancelada', 'El socio ya no tiene acceso al gimnasio.')
    } catch (e) {
      const m = mensajeError(e, 'No se pudo cancelar la membresía')
      setError(m); toast.error('Error al cancelar', m)
    }
  }

  const handleGuardarProgreso = async (ejId: number) => {
    setGuardandoProgreso(ejId)
    try {
      const prog = progresoHoy[ejId] ?? {}
      await guardarProgreso({
        socioId: id,
        rutinaEjercicioId: ejId,
        pesoKg: prog.pesoKg ?? null,
        repeticionesReales: prog.repeticionesReales ?? null,
        seriesRealizadas: prog.seriesRealizadas ?? null,
      })
      toast.success('Sesión guardada', '¡Buen trabajo!')
    } catch { toast.error('No se pudo guardar', 'Intentá nuevamente') }
    finally { setGuardandoProgreso(null) }
  }

  const handleEliminarRutina = async (rutinaId: number) => {
    setEliminandoRutinaId(rutinaId)
    const asignada = rutinas.find(r => r.id === rutinaId)?.asignada
    try {
      // Una plantilla asignada no se borra: se le quita al socio
      if (asignada) await quitarAsignacion(rutinaId, id)
      else await eliminarRutina(rutinaId, id)
      toast.success(asignada ? 'Plantilla quitada' : 'Rutina eliminada', asignada ? 'La plantilla sigue disponible para otros socios' : 'La rutina fue eliminada correctamente')
      await cargar()
    } catch (e) {
      setError(mensajeError(e, 'No se pudo eliminar la rutina'))
    } finally { setEliminandoRutinaId(null); setConfirmarEliminarRutinaId(null) }
  }

  const toggleExpandedEj = (ejId: number) => {
    setExpandedEjs(prev => {
      const next = new Set(prev)
      if (next.has(ejId)) next.delete(ejId); else next.add(ejId)
      return next
    })
  }

  /** Copia la plantilla asignada como rutina propia del socio y abre el editor */
  const ajustarPlantilla = async (r: Rutina) => {
    if (!r.id) return
    setEliminandoRutinaId(r.id)
    try {
      const nueva = await personalizarPlantilla(r.id, id)
      navigate(linkEditarRutina(nueva, true))
    } catch (e) {
      setError(mensajeError(e, 'No se pudo copiar la rutina'))
      setEliminandoRutinaId(null)
    }
  }

  return {
    id, socio, membresia, rutinas, maquinas, observacionesMedicas,
    ejerciciosPorRutina, cargandoEjs, cargando, error, setError,
    esSocio, esAdmin, navigate,
    // Membresía
    confirmarCancelar, setConfirmarCancelar, handleCancelarMembresia,
    // Rutinas
    confirmarEliminarRutinaId, setConfirmarEliminarRutinaId, eliminandoRutinaId, handleEliminarRutina, ajustarPlantilla,
    // Mi semana
    diaSeleccionado, setDiaSeleccionado, expandedEjs, toggleExpandedEj,
    progresoHoy, setProgresoHoy, guardandoProgreso, handleGuardarProgreso,
    // Logout
    confirmLogout, setConfirmLogout, logout,
    DIAS_SEMANA, hoyIdx,
  }
}
