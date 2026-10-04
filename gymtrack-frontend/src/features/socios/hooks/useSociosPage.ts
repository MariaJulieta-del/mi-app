import { mensajeError } from '../../../shared/utils/errores'
import { formatFecha } from '../../../shared/utils/fechas'
import { textoPases } from '../../membresias/types/Tarifa'
import { useState, useEffect, useMemo } from 'react'
import type { Socio } from '../types/Socio'
import {
  obtenerConInactivos, actualizarSocio, darDeBaja,
  reactivarSocio, eliminarPermanente, altaSocioCompleta, generarPinesPendientes, type PinGenerado,
} from '../services/socioService'
import type { AltaSocioRequestDTO } from '../services/socioService'
import { listarMembresias } from '../../membresias/services/membresiaService'
import { useToast } from '../../../shared/hooks/useToast'

const POR_PAGINA = 20

export function useSociosPage() {
  const toast = useToast()
  const [socios, setSocios] = useState<Socio[]>([])
  const [membresiaMap, setMembresiaMap] = useState<Map<number, string>>(new Map())
  const [socioEditar, setSocioEditar] = useState<Socio | null>(null)
  const [error, setError] = useState('')
  const [verInactivos, setVerInactivos] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<number | null>(null)
  const [pagina, setPagina] = useState(1)
  /** PIN del socio recién dado de alta, para mostrarlo una sola vez */
  const [pinAlta, setPinAlta] = useState<{ nombre: string; dni: string; pin: string } | null>(null)
  const [pinesPendientes, setPinesPendientes] = useState<PinGenerado[] | null>(null)
  const [generandoPines, setGenerandoPines] = useState(false)

  const cargarSocios = () =>
    Promise.all([obtenerConInactivos(), listarMembresias()])
      .then(([sociosData, membresiasData]) => {
        setSocios(sociosData)
        // Cada socio tiene una sola membresía
        setMembresiaMap(new Map(membresiasData.map(m => [m.socioId, m.estadoMembresia])))
      })
      .catch(() => setError('Error al cargar los socios'))

  useEffect(() => { cargarSocios() }, [])

  const handleAltaCompleta = async (data: AltaSocioRequestDTO) => {
    try {
      const resp = await altaSocioCompleta(data)
      toast.success('Socio registrado y cobrado',
        `${resp.nombre} ${resp.apellido} — activo hasta el ${formatFecha(resp.fechaVencimiento)} · ${textoPases(resp.pasesMensuales)}`)
      if (resp.pin) setPinAlta({ nombre: `${resp.nombre} ${resp.apellido}`, dni: resp.dni, pin: resp.pin })
      setError(''); cargarSocios()
    } catch (err: unknown) {
      const msg = mensajeError(err, 'Error al registrar el socio')
      setError(msg); toast.error('Error al registrar', msg)
    }
  }

  const handleEditar = async (socio: Socio) => {
    if (!socioEditar?.id) return
    try {
      await actualizarSocio(socioEditar.id, socio)
      toast.success('Socio actualizado', `${socio.nombre} ${socio.apellido}`)
      setSocioEditar(null); setError(''); cargarSocios()
    } catch {
      const msg = 'El DNI ya existe o hay un problema con los datos'
      setError(msg); toast.error('Error al guardar', msg)
    }
  }

  const handleEliminar = async (id: number) => {
    try { await darDeBaja(id); toast.success('Socio dado de baja'); cargarSocios() }
    catch { toast.error('Error', 'No se pudo dar de baja al socio') }
  }

  const handleReactivar = async (id: number) => {
    try { await reactivarSocio(id); toast.success('Socio reactivado correctamente'); cargarSocios() }
    catch { toast.error('Error', 'No se pudo reactivar el socio') }
  }

  const confirmarEliminar = async () => {
    if (confirmarEliminarId === null) return
    const id = confirmarEliminarId
    setConfirmarEliminarId(null)
    try {
      await eliminarPermanente(id)
      toast.success('Socio eliminado', 'El socio y todos sus datos fueron eliminados permanentemente')
      cargarSocios()
    } catch (err: unknown) {
      toast.error('Error al eliminar', mensajeError(err, 'No se pudo eliminar el socio'))
    }
  }

  const sociosFiltrados = useMemo(() => socios.filter(s => {
    const esInactivo = s.activo === false || s.estado === 'INACTIVO'
    if (!verInactivos && esInactivo) return false
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return s.nombre.toLowerCase().includes(q) || s.apellido.toLowerCase().includes(q) ||
      s.dni.includes(q) || (s.email ?? '').toLowerCase().includes(q)
  }), [socios, verInactivos, busqueda])

  const activos = useMemo(() => socios.filter(s => s.activo !== false && s.estado !== 'INACTIVO').length, [socios])
  const inactivos = socios.length - activos
  const totalPaginas = Math.max(1, Math.ceil(sociosFiltrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const sociosPagina = sociosFiltrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  const handleGenerarPinesPendientes = async () => {
    setGenerandoPines(true)
    try { setPinesPendientes(await generarPinesPendientes()) }
    catch { toast.error('Error', 'No se pudieron generar los PIN') }
    finally { setGenerandoPines(false) }
  }

  return {
    pinAlta, setPinAlta, pinesPendientes, setPinesPendientes, generandoPines, handleGenerarPinesPendientes,
    socios, membresiaMap, socioEditar, setSocioEditar, error, setError,
    verInactivos, setVerInactivos, busqueda, setBusqueda,
    confirmarEliminarId, setConfirmarEliminarId,
    pagina, setPagina, POR_PAGINA,
    sociosFiltrados, activos, inactivos, totalPaginas, paginaActual, sociosPagina,
    handleAltaCompleta, handleEditar, handleEliminar, handleReactivar,
    confirmarEliminar,
  }
}
