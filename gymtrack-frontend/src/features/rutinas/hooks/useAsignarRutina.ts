import { useEffect, useMemo, useState } from 'react'
import { NIVEL_A_DIFICULTAD } from '../utils/rutinaUtils'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Rutina } from '../types/Rutina'
import type { Socio } from '../../socios/types/Socio'
import { obtenerRutinasGenerales, clonarRutina, obtenerRutinas } from '../services/rutinaService'
import { obtenerTodos, obtenerPorId } from '../../socios/services/socioService'
import { obtenerFicha } from '../../socios/services/fichaService'
import { useToast } from '../../../shared/hooks/useToast'

export type Modo = 'plantilla' | 'personalizada'

/**
 * Asistente para que el profesor asigne una rutina a un socio:
 *   1. Socio  →  2. ¿Plantilla o personalizada?  →  3. Elegir plantilla y asignar  →  listo
 * Acepta ?socioId=… y/o ?plantillaId=… para saltear pasos.
 */
export function useAsignarRutina() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const socioIdParam = params.get('socioId')
  const plantillaIdParam = params.get('plantillaId')

  // Paso 1 — socio
  const [socio, setSocio] = useState<Socio | null>(null)
  const [socios, setSocios] = useState<Socio[]>([])
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [observaciones, setObservaciones] = useState<string | null>(null)
  const [rutinasDelSocio, setRutinasDelSocio] = useState<Rutina[]>([])

  // Paso 2/3 — plantilla
  const [modo, setModo] = useState<Modo | null>(plantillaIdParam ? 'plantilla' : null)
  const [plantillas, setPlantillas] = useState<Rutina[]>([])
  const [cargandoPlantillas, setCargandoPlantillas] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTren, setFiltroTren] = useState('')
  const [filtroObjetivo, setFiltroObjetivo] = useState('')
  /** Dificultad recomendada según el nivel de la ficha del socio (PRINCIPIANTE → BAJA…) */
  const [nivelRecomendado, setNivelRecomendado] = useState<string | null>(null)
  const [soloSuNivel, setSoloSuNivel] = useState(false)
  const [plantillaSel, setPlantillaSel] = useState<Rutina | null>(null)
  const [nombreEditado, setNombre] = useState<string | null>(null)

  const [asignando, setAsignando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [asignada, setAsignada] = useState<Rutina | null>(null)

  useEffect(() => {
    obtenerTodos().then(ss => setSocios(ss.filter(s => s.activo !== false))).catch(() => {})
    obtenerRutinasGenerales()
      .then(ps => {
        setPlantillas(ps)
        const pre = plantillaIdParam ? ps.find(p => String(p.id) === plantillaIdParam) : null
        if (pre) setPlantillaSel(pre)
      })
      .catch(() => setError('No se pudieron cargar las plantillas'))
      .finally(() => setCargandoPlantillas(false))
    if (socioIdParam) obtenerPorId(Number(socioIdParam)).then(elegirSocio).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Nombre sugerido: "<plantilla> — <Nombre>" (si el profe no lo cambió)
  const nombreSugerido = plantillaSel ? (socio ? `${plantillaSel.nombre} — ${socio.nombre}` : plantillaSel.nombre) : ''
  const nombre = nombreEditado ?? nombreSugerido
  const elegirPlantilla = (p: Rutina | null) => { setPlantillaSel(p); setNombre(null) }

  function elegirSocio(s: Socio) {
    setSocio(s); setBusquedaSocio(''); setObservaciones(null); setRutinasDelSocio([]); setNivelRecomendado(null); setSoloSuNivel(false)
    if (!s.id) return
    obtenerFicha(s.id)
      .then(f => {
        const obs = [f?.observacionesMedicas, f?.lesiones ? `Lesiones: ${f.lesiones}` : '']
          .filter(Boolean).join('\n')
        setObservaciones(obs || null)
        const nivel = f?.nivelAptitud ? NIVEL_A_DIFICULTAD[f.nivelAptitud] ?? null : null
        setNivelRecomendado(nivel)
        setSoloSuNivel(!!nivel)
      })
      .catch(() => {})
    obtenerRutinas(s.id).then(setRutinasDelSocio).catch(() => {})
  }

  const sociosFiltrados = useMemo(() => {
    const q = busquedaSocio.trim().toLowerCase()
    if (!q) return []
    return socios.filter(s =>
      `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) || s.dni.includes(q),
    ).slice(0, 6)
  }, [busquedaSocio, socios])

  const plantillasFiltradas = useMemo(() => plantillas
    .filter(p => !filtroTren || (p.trenes ?? []).includes(filtroTren))
    .filter(p => !filtroObjetivo || p.objetivo === filtroObjetivo)
    // Las plantillas sin nivel cargado se muestran siempre
    .filter(p => !soloSuNivel || !nivelRecomendado || !p.dificultad || p.dificultad === nivelRecomendado)
    .filter(p => {
      const q = busqueda.trim().toLowerCase()
      return !q || p.nombre.toLowerCase().includes(q) || (p.descripcion ?? '').toLowerCase().includes(q)
    }), [plantillas, filtroTren, filtroObjetivo, soloSuNivel, nivelRecomendado, busqueda])

  const elegirModo = (m: Modo) => {
    if (m === 'personalizada') {
      navigate(`/rutinas/nueva?socioId=${socio!.id}`)
      return
    }
    setModo(m)
  }

  const asignar = async () => {
    if (!socio?.id || !plantillaSel?.id) return
    setAsignando(true); setError(null)
    try {
      const nueva = await clonarRutina(plantillaSel.id, socio.id, nombre.trim() || undefined)
      setAsignada(nueva)
      toast.success('Rutina asignada', `${nueva.nombre} → ${socio.nombre} ${socio.apellido}`)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo asignar la rutina')
    } finally { setAsignando(false) }
  }

  const reiniciar = () => { setAsignada(null); setPlantillaSel(null); setModo(null) }

  const paso = asignada ? 4 : !socio ? 1 : !modo ? 2 : 3

  return {
    navigate, paso,
    socio, setSocio, busquedaSocio, setBusquedaSocio, sociosFiltrados, elegirSocio, observaciones, rutinasDelSocio,
    modo, setModo, elegirModo,
    plantillas, cargandoPlantillas, plantillasFiltradas, busqueda, setBusqueda, filtroTren, setFiltroTren, filtroObjetivo, setFiltroObjetivo,
    nivelRecomendado, soloSuNivel, setSoloSuNivel,
    plantillaSel, setPlantillaSel: elegirPlantilla, nombre, setNombre,
    asignar, asignando, error, setError, asignada, reiniciar,
  }
}
