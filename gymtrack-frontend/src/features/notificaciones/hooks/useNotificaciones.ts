import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { obtenerPorId } from '../../socios/services/socioService'
import { formatFecha } from '../../../shared/utils/fechas'
import {
  listarNotificaciones, crearNotificacion, archivarNotificacion, obtenerCanales,
  type Canales, type Notificacion,
} from '../services/notificacionService'
import { useBuscarSocios } from '../../../shared/hooks/useBuscarSocios'
import { listarDisciplinas, type DisciplinaApi } from '../../disciplinas/services/disciplinaService'
import type { Socio } from '../../socios/types/Socio'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'

export const TIPOS = [
  { val: 'INFO',         label: 'Información' },
  { val: 'RECORDATORIO', label: 'Recordatorio' },
  { val: 'ALERTA',       label: 'Importante' },
  { val: 'URGENTE',      label: 'Urgente' },
  { val: 'VENCIMIENTO',  label: 'Vencimiento' },
  { val: 'CLASE',        label: 'Clase' },
] as const
export const TONO_TIPO: Record<string, 'info' | 'ok' | 'warn' | 'danger' | 'neutral'> = {
  INFO: 'info', RECORDATORIO: 'ok', ALERTA: 'warn', URGENTE: 'danger', VENCIMIENTO: 'warn', CLASE: 'info',
}

/** Mensajes de uso frecuente para no escribir siempre lo mismo */
export const PLANTILLAS = [
  { nombre: 'Feriado', tipo: 'INFO', titulo: 'Horario especial por feriado', mensaje: 'El [día] abrimos de [hora] a [hora]. ¡Te esperamos!' },
  { nombre: 'Clase cancelada', tipo: 'ALERTA', titulo: 'Clase suspendida', mensaje: 'Hoy se suspende la clase de [disciplina] de las [hora]. Disculpá las molestias.' },
  { nombre: 'Cambio de horario', tipo: 'INFO', titulo: 'Cambio de horario', mensaje: 'Desde el [fecha] el gimnasio abre de [hora] a [hora].' },
  { nombre: 'Membresía vencida', tipo: 'VENCIMIENTO', titulo: 'Se venció tu membresía', mensaje: '¡Hola! Tu membresía venció y por ahora no podés ingresar al gimnasio. Renovala en recepción o por transferencia y seguí entrenando. ¡Te esperamos!' },
  { nombre: 'Recordatorio de pago', tipo: 'VENCIMIENTO', titulo: 'Tu cuota está por vencer', mensaje: 'Te recordamos renovar tu membresía para seguir entrenando sin cortes. Podés pagar en recepción o por transferencia.' },
  { nombre: 'Mantenimiento', tipo: 'INFO', titulo: 'Máquina en mantenimiento', mensaje: 'La [máquina] está en reparación hasta el [fecha]. Podés usar [alternativa].' },
] as const

export type Para = 'TODOS' | 'DISCIPLINA' | 'SOCIO'

const VACIO = { titulo: '', mensaje: '', tipo: 'INFO' }

export function useNotificaciones() {
  const toast = useToast()
  const [notifs, setNotifs] = useState<Notificacion[] | null>(null)
  const [canales, setCanales] = useState<Canales | null>(null)
  const [form, setForm] = useState(VACIO)
  const [para, setParaEstado] = useState<Para>('TODOS')
  const [porEmail, setPorEmail] = useState(true)
  const [porWhatsapp, setPorWhatsapp] = useState(false)
  const [creando, setCreando] = useState(false)
  const [confirmarEnvio, setConfirmarEnvio] = useState(false)
  const [confirmarArchivarId, setConfirmarArchivarId] = useState<number | null>(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [verArchivadas, setVerArchivadas] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  /** Aviso del que se muestran los links de WhatsApp */
  const [whatsappDe, setWhatsappDe] = useState<Notificacion | null>(null)

  const [socioSel, setSocioSel] = useState<Socio | null>(null)
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [disciplinas, setDisciplinas] = useState<DisciplinaApi[]>([])
  const [disciplinaId, setDisciplinaId] = useState<number | ''>('')

  /** Si se llega desde Socios (botón "Avisar"), el aviso ya viene armado para ese socio */
  const [params, setParams] = useSearchParams()
  const [preparando, setPreparando] = useState(() => !!params.get('socio'))
  useEffect(() => {
    const id = Number(params.get('socio'))
    if (!id) return
    const motivo = params.get('motivo')
    const vence = params.get('vence')
    obtenerPorId(id)
      .then(s => {
        setParaEstado('SOCIO'); setSocioSel(s)
        if (motivo === 'vencida') {
          setForm({
            tipo: 'VENCIMIENTO',
            titulo: 'Se venció tu membresía',
            mensaje: `¡Hola ${s.nombre}! Tu membresía ${vence ? `venció el ${formatFecha(vence)}` : 'está vencida'} y por ahora no podés ingresar al gimnasio. `
              + 'Renovala en recepción o por transferencia y seguí entrenando. ¡Te esperamos!',
          })
          if (s.telefono) setPorWhatsapp(true)
        }
      })
      .catch(() => toast.error('No se encontró el socio', 'Elegilo a mano en "Un socio"'))
      .finally(() => { setPreparando(false); setParams({}, { replace: true }) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- solo al entrar a la página

  const cargar = () => listarNotificaciones().then(setNotifs).catch(() => { setNotifs([]); toast.error('Error', 'No se pudieron cargar los avisos') })

  useEffect(() => {
    cargar()
    obtenerCanales().then(c => { setCanales(c); if (!c.email) setPorEmail(false) }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- solo al entrar a la página

  const setPara = (p: Para) => {
    setParaEstado(p)
    setSocioSel(null); setBusquedaSocio(''); setDisciplinaId('')
    if (p === 'DISCIPLINA' && disciplinas.length === 0) listarDisciplinas(true).then(setDisciplinas).catch(() => {})
  }

  const sociosFiltrados = useBuscarSocios(busquedaSocio, { tam: 6 }).resultados

  const usarPlantilla = (p: (typeof PLANTILLAS)[number]) => setForm({ titulo: p.titulo, mensaje: p.mensaje, tipo: p.tipo })

  /** A cuántos socios le llega (aprox.) */
  const disciplinaSel = disciplinas.find(d => d.id === disciplinaId)
  const alcance = para === 'SOCIO' ? (socioSel ? 1 : 0) : para === 'DISCIPLINA' ? (disciplinaSel?.totalInscritos ?? 0) : (canales?.socios ?? 0)

  const validar = () => {
    if (!form.titulo.trim() || !form.mensaje.trim()) { toast.error('Faltan datos', 'Poné un título y el mensaje'); return false }
    if (para === 'SOCIO' && !socioSel) { toast.error('Faltan datos', 'Elegí a qué socio va'); return false }
    if (para === 'DISCIPLINA' && !disciplinaId) { toast.error('Faltan datos', 'Elegí la clase'); return false }
    return true
  }

  const pedirEnvio = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar()) return
    // A todos se confirma antes (llega a mucha gente)
    if (para === 'TODOS') setConfirmarEnvio(true)
    else enviar()
  }

  const enviar = async () => {
    setConfirmarEnvio(false)
    setCreando(true)
    try {
      const nueva = await crearNotificacion({
        titulo: form.titulo.trim(), mensaje: form.mensaje.trim(), tipo: form.tipo,
        destinatario: para, socioId: para === 'SOCIO' ? socioSel!.id : null,
        disciplinaId: para === 'DISCIPLINA' ? Number(disciplinaId) : null,
        porEmail: porEmail && !!canales?.email, porWhatsapp,
      })
      toast.success('Aviso enviado', `${nueva.titulo}${porEmail && canales?.email ? ' · en la app y por mail' : ' · en la app'}`)
      setForm(VACIO); setSocioSel(null); setBusquedaSocio(''); setDisciplinaId('')
      cargar()
      if (porWhatsapp) setWhatsappDe(nueva)
    } catch (err) {
      toast.error('No se pudo enviar', mensajeError(err, 'Error al enviar el aviso'))
    } finally {
      setCreando(false)
    }
  }

  const handleArchivar = async () => {
    if (confirmarArchivarId === null) return
    const id = confirmarArchivarId
    setConfirmarArchivarId(null)
    try { await archivarNotificacion(id); toast.success('Aviso archivado'); cargar() }
    catch { toast.error('Error', 'No se pudo archivar') }
  }

  const lista = notifs ?? []
  const activas = lista.filter(n => n.activa)
  const archivadas = lista.filter(n => !n.activa)
  const q = busqueda.trim().toLowerCase()
  const listaVer = (verArchivadas ? archivadas : activas)
    .filter(n => !filtroTipo || n.tipo === filtroTipo)
    .filter(n => !q || n.titulo.toLowerCase().includes(q) || n.mensaje.toLowerCase().includes(q) || (n.socioNombre ?? '').toLowerCase().includes(q))

  return {
    cargando: notifs === null, preparando, canales, form, setForm, para, setPara, porEmail, setPorEmail, porWhatsapp, setPorWhatsapp,
    creando, pedirEnvio, enviar, confirmarEnvio, setConfirmarEnvio, alcance,
    filtroTipo, setFiltroTipo, verArchivadas, setVerArchivadas, busqueda, setBusqueda,
    confirmarArchivarId, setConfirmarArchivarId, handleArchivar,
    socioSel, setSocioSel, busquedaSocio, setBusquedaSocio, sociosFiltrados,
    disciplinas, disciplinaId, setDisciplinaId, usarPlantilla,
    whatsappDe, setWhatsappDe,
    activas, archivadas, listaVer,
  }
}
