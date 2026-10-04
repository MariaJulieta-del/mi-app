import { useState, useEffect, useRef } from 'react'
import { listarNotificaciones, crearNotificacion, archivarNotificacion } from '../services/notificacionService'
import { obtenerTodos } from '../../socios/services/socioService'
import type { Socio } from '../../socios/types/Socio'
import { useToast } from '../../../shared/hooks/useToast'

export interface Notificacion {
  id: number; titulo: string; mensaje: string; tipo: string; destinatario: string
  socioId?: number | null; socioNombre?: string; fechaCreacion: string; activa: boolean
}

export const TIPOS = [
  { val: 'INFO',         label: 'Información',  bg: 'var(--blue-bg)',   color: 'var(--blue-text)' },
  { val: 'ALERTA',       label: 'Alerta',       bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
  { val: 'URGENTE',      label: 'Urgente',      bg: 'var(--red-light)', color: 'var(--red-text)' },
  { val: 'RECORDATORIO', label: 'Recordatorio', bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  { val: 'VENCIMIENTO',  label: 'Vencimiento',  bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
]

const VACIO = { titulo: '', mensaje: '', tipo: 'INFO', destinatario: 'TODOS' }

export function useNotificaciones() {
  const toast = useToast()
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [form, setForm] = useState(VACIO)
  const [creando, setCreando] = useState(false)
  const [confirmarArchivarId, setConfirmarArchivarId] = useState<number | null>(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [verArchivadas, setVerArchivadas] = useState(false)

  const [socios, setSocios] = useState<Socio[]>([])
  const [socioSel, setSocioSel] = useState<Socio | null>(null)
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const cargar = () => listarNotificaciones().then(setNotifs).catch(() => toast.error('Error', 'No se pudieron cargar las notificaciones'))

  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps -- solo al entrar a la página

  useEffect(() => {
    if (mostrarBuscador && socios.length === 0) {
      obtenerTodos().then(setSocios).catch(() => {})
    }
    if (mostrarBuscador) setTimeout(() => inputRef.current?.focus(), 50)
  }, [mostrarBuscador, socios.length])

  const sociosFiltrados = busquedaSocio.length >= 1
    ? socios.filter(s => {
        const q = busquedaSocio.toLowerCase()
        return s.nombre.toLowerCase().includes(q) || s.apellido.toLowerCase().includes(q) || s.dni.includes(q)
      }).slice(0, 6)
    : []

  const seleccionarSocio = (s: Socio) => {
    setSocioSel(s); setBusquedaSocio(''); setMostrarBuscador(false)
  }

  const setDestinatario = (val: string) => {
    setForm(f => ({ ...f, destinatario: val }))
    setSocioSel(null)
    setMostrarBuscador(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      toast.error('Campos incompletos', 'Título y mensaje son obligatorios')
      return
    }
    if (form.destinatario === 'SOCIO' && !socioSel) {
      toast.error('Faltan datos', 'Seleccioná un socio para la notificación individual')
      return
    }
    setCreando(true)
    try {
      await crearNotificacion({ ...form, socioId: form.destinatario === 'SOCIO' ? socioSel!.id : null })
      toast.success('Notificación enviada', form.titulo)
      setForm(VACIO); setSocioSel(null); cargar()
    } catch {
      toast.error('Error', 'No se pudo enviar la notificación')
    } finally {
      setCreando(false)
    }
  }

  const handleArchivar = async () => {
    if (confirmarArchivarId === null) return
    const id = confirmarArchivarId
    setConfirmarArchivarId(null)
    try {
      await archivarNotificacion(id)
      toast.success('Notificación archivada')
      cargar()
    } catch {
      toast.error('Error', 'No se pudo archivar la notificación')
    }
  }

  const activas   = notifs.filter(n => n.activa)
  const archivadas = notifs.filter(n => !n.activa)
  const listaVer  = (verArchivadas ? archivadas : activas).filter(n => !filtroTipo || n.tipo === filtroTipo)

  return {
    notifs, form, setForm, creando, filtroTipo, setFiltroTipo, verArchivadas, setVerArchivadas,
    confirmarArchivarId, setConfirmarArchivarId,
    socios, socioSel, busquedaSocio, setBusquedaSocio, mostrarBuscador, setMostrarBuscador,
    inputRef, sociosFiltrados, seleccionarSocio, setDestinatario,
    handleSubmit, handleArchivar,
    activas, archivadas, listaVer,
  }
}
