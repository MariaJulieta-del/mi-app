import { mensajeError } from '../../../shared/utils/errores'
import { formatFecha } from '../../../shared/utils/fechas'
import { textoPases } from '../../membresias/types/Tarifa'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Socio } from '../types/Socio'
import {
  actualizarSocio, darDeBaja, reactivarSocio, altaSocioCompleta, generarPinesPendientes, buscarSocios,
  type PinGenerado, type PaginaSocios, type FiltrosSocios,
} from '../services/socioService'
import type { AltaSocioRequestDTO } from '../services/socioService'
import { useToast } from '../../../shared/hooks/useToast'

export const POR_PAGINA = 20

type Vista = NonNullable<FiltrosSocios['vista']>
type FiltroMem = '' | 'VENCIDA' | 'SIN_MEMBRESIA'
export type Orden = NonNullable<FiltrosSocios['orden']>

/**
 * Pantalla de Socios: la búsqueda, los filtros, el orden y la paginación los resuelve el servidor
 * (antes se traían todos los socios y todas las membresías en cada carga).
 */
export function useSociosPage() {
  const toast = useToast()
  const [datos, setDatos] = useState<PaginaSocios | null>(null)
  const [socioEditar, setSocioEditar] = useState<Socio | null>(null)
  const [error, setError] = useState('')
  const [vista, setVista] = useState<Vista>('activos')
  const [filtroMem, setFiltroMem] = useState<FiltroMem>('')
  const [busqueda, setBusqueda] = useState('')
  /** La búsqueda se manda al servidor recién cuando se deja de escribir */
  const [busquedaEnviada, setBusquedaEnviada] = useState('')
  const [orden, setOrden] = useState<Orden>('apellido')
  const [desc, setDesc] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [recarga, setRecarga] = useState(0)
  /** Socio al que se le está por dar de baja (se pide el motivo) */
  const [socioBaja, setSocioBaja] = useState<Socio | null>(null)
  /** PIN del socio recién dado de alta, para mostrarlo una sola vez */
  const [pinAlta, setPinAlta] = useState<{ nombre: string; dni: string; pin: string } | null>(null)
  const [pinesPendientes, setPinesPendientes] = useState<PinGenerado[] | null>(null)
  const [generandoPines, setGenerandoPines] = useState(false)
  /** Operación en curso (evita dobles clics en guardar, dar de baja o reactivar) */
  const [ocupado, setOcupado] = useState<number | 'editar' | null>(null)
  const ocupadoRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => { setBusquedaEnviada(busqueda.trim()); setPagina(1) }, 300)
    return () => clearTimeout(t)
  }, [busqueda])

  // Una sola petición en vuelo: si cambia un filtro, la anterior se cancela y no pisa el resultado
  useEffect(() => {
    const ctrl = new AbortController()
    buscarSocios({ q: busquedaEnviada, vista, membresia: filtroMem, orden, desc, pagina, tam: POR_PAGINA }, ctrl.signal)
      .then(d => { setDatos(d); setError('') })
      .catch(err => { if (!ctrl.signal.aborted) setError(mensajeError(err, 'Error al cargar los socios')) })
    return () => ctrl.abort()
  }, [busquedaEnviada, vista, filtroMem, orden, desc, pagina, recarga])

  const recargar = useCallback(() => setRecarga(r => r + 1), [])

  /** Ejecuta una operación una sola vez aunque se haga doble clic */
  const unaVez = async (clave: number | 'editar', fn: () => Promise<void>) => {
    if (ocupadoRef.current) return
    ocupadoRef.current = true
    setOcupado(clave)
    try { await fn() } finally { ocupadoRef.current = false; setOcupado(null) }
  }

  /** true si se registró (para cerrar la ventana de alta) */
  const handleAltaCompleta = async (data: AltaSocioRequestDTO): Promise<boolean> => {
    try {
      const resp = await altaSocioCompleta(data)
      toast.success('Socio registrado y cobrado',
        `${resp.nombre} ${resp.apellido} — activo hasta el ${formatFecha(resp.fechaVencimiento)} · ${textoPases(resp.pasesMensuales)}`)
      if (resp.pin) setPinAlta({ nombre: `${resp.nombre} ${resp.apellido}`, dni: resp.dni, pin: resp.pin })
      setError(''); recargar()
      return true
    } catch (err: unknown) {
      toast.error('Error al registrar', mensajeError(err, 'Error al registrar el socio'))
      return false
    }
  }

  const handleEditar = (socio: Socio) => unaVez('editar', async () => {
    if (!socioEditar?.id) return
    try {
      await actualizarSocio(socioEditar.id, socio)
      toast.success('Socio actualizado', `${socio.nombre} ${socio.apellido}`)
      setSocioEditar(null); setError(''); recargar()
    } catch (err: unknown) {
      // El motivo real que manda el servidor (dato inválido, socio inexistente, etc.)
      toast.error('No se pudo guardar', mensajeError(err, 'Revisá los datos e intentá de nuevo'))
    }
  })

  const handleEliminar = (id: number) => setSocioBaja(datos?.items.find(s => s.id === id) ?? null)

  const confirmarBaja = (motivo: string, detalle: string) => unaVez(socioBaja?.id ?? -1, async () => {
    if (!socioBaja?.id) return
    try {
      await darDeBaja(socioBaja.id, motivo, detalle.trim() || undefined)
      toast.success('Socio dado de baja', `${socioBaja.nombre} ${socioBaja.apellido}`)
      setSocioBaja(null)
      recargar()
    } catch (err: unknown) {
      toast.error('Error', mensajeError(err, 'No se pudo dar de baja al socio'))
    }
  })

  const handleReactivar = (id: number) => unaVez(id, async () => {
    try { await reactivarSocio(id); toast.success('Socio reactivado'); recargar() }
    catch (err: unknown) { toast.error('Error', mensajeError(err, 'No se pudo reactivar el socio')) }
  })

  const handleGenerarPinesPendientes = async () => {
    setGenerandoPines(true)
    try { setPinesPendientes(await generarPinesPendientes()) }
    catch { toast.error('Error', 'No se pudieron generar los PIN') }
    finally { setGenerandoPines(false) }
  }

  const ordenar = (o: Orden) => {
    if (o === orden) setDesc(d => !d)
    else { setOrden(o); setDesc(o === 'alta') }
    setPagina(1)
  }

  return {
    pinAlta, setPinAlta, pinesPendientes, setPinesPendientes, generandoPines, handleGenerarPinesPendientes,
    datos, cargando: datos === null && !error, socioEditar, setSocioEditar, error, setError,
    vista, setVista, filtroMem, setFiltroMem, busqueda, setBusqueda, orden, desc, ordenar,
    pagina, setPagina, ocupado,
    handleAltaCompleta, handleEditar, handleEliminar, handleReactivar,
    socioBaja, setSocioBaja, confirmarBaja,
  }
}
