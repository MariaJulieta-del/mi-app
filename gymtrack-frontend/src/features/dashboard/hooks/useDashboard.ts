import { useEffect, useState } from 'react'
import { getDashboard, getSinAsistencias } from '../../reportes/services/reporteService'
import { listarProximasAVencer } from '../../membresias/services/membresiaService'
import { crearNotificacion } from '../../notificaciones/services/notificacionService'
import { listarMantenimientos } from '../../maquinas/services/mantenimientoService'
import type { Mantenimiento } from '../../maquinas/types/Mantenimiento'
import { useToast } from '../../../shared/hooks/useToast'

export interface DashboardStats {
  totalSociosActivos: number; membresiasActivas: number; membresiasVencidas: number
  totalRecaudadoMes: number; asistentesHoy: number; mesReporte: string
}

export interface MembresiaProxima {
  id: number; socioId: number; socioNombreCompleto: string; tipoMembresia: string; fechaVencimiento: string
}

export interface SinAsistencia { socioId: number; nombre: string; dni: string; ultimaAsistencia: string }

export function useDashboard() {
  const toast = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [proximas, setProximas] = useState<MembresiaProxima[]>([])
  const [diasFiltro, setDiasFiltro] = useState(7)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [notificando, setNotificando] = useState<number | null>(null)
  const [notificandoTodos, setNotificandoTodos] = useState(false)
  const [sinAsist, setSinAsist] = useState<SinAsistencia[]>([])
  const [maqPendientes, setMaqPendientes] = useState<Mantenimiento[]>([])

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setCargando(false))
    getSinAsistencias(60).then(setSinAsist).catch(() => {})
    listarMantenimientos()
      .then(all => setMaqPendientes(all.filter(m => m.tipo === 'PENDIENTE')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    listarProximasAVencer(diasFiltro).then(data => setProximas(data as MembresiaProxima[])).catch(() => {})
  }, [diasFiltro])

  const diasRestantes = (fecha: string) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const venc = new Date(fecha + 'T00:00:00')
    return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  const notificarSocio = async (m: MembresiaProxima) => {
    try {
      setNotificando(m.id)
      const dias = diasRestantes(m.fechaVencimiento)
      await crearNotificacion({
        socioId: m.socioId,
        mensaje: `Tu membresía (${m.tipoMembresia}) vence ${dias === 0 ? 'hoy' : `en ${dias} día${dias === 1 ? '' : 's'}`} (${m.fechaVencimiento}). ¡Renová para seguir entrenando!`,
        tipo: 'VENCIMIENTO',
      })
      toast.success('Notificación enviada', m.socioNombreCompleto)
    } catch {
      toast.error('Error', 'No se pudo enviar la notificación')
    } finally { setNotificando(null) }
  }

  const notificarTodos = async () => {
    if (!proximas.length) return
    try {
      setNotificandoTodos(true)
      for (const m of proximas) {
        const dias = diasRestantes(m.fechaVencimiento)
        await crearNotificacion({
          socioId: m.socioId,
          mensaje: `Tu membresía (${m.tipoMembresia}) vence ${dias === 0 ? 'hoy' : `en ${dias} día${dias === 1 ? '' : 's'}`} (${m.fechaVencimiento}). ¡Renová para seguir entrenando!`,
          tipo: 'VENCIMIENTO',
        })
      }
      toast.success('Notificaciones enviadas', `${proximas.length} socio(s) notificados`)
    } catch {
      toast.error('Error', 'No se pudieron enviar las notificaciones')
    } finally { setNotificandoTodos(false) }
  }

  const sinMembresia = stats ? Math.max(0, stats.totalSociosActivos - stats.membresiasActivas) : 0

  return {
    stats, proximas, diasFiltro, setDiasFiltro, error, cargando,
    notificando, notificandoTodos, sinAsist, maqPendientes,
    diasRestantes, notificarSocio, notificarTodos, sinMembresia,
  }
}
