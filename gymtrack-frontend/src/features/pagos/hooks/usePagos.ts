import { mensajeError } from '../../../shared/utils/errores'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../shared/context/AuthContext'
import type { Pago } from '../types/Pago'
import type { CierreCajaResumen } from '../types/CierreCaja'
import { listarPagos } from '../services/pagoService'
import { obtenerResumen, cerrarCaja, historialCierres } from '../services/cierreCajaService'

export type Filtro = 'todos' | 'hoy' | 'semana' | 'mes' | 'rango'
export type Tab = 'ingresos' | 'cierre'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function toLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function usePagos() {
  const { user } = useAuth()
  const esAdmin    = user?.rol === 'ADMIN'
  const esProfesor = user?.rol === 'PROFESOR'

  const [tab, setTab] = useState<Tab>('ingresos')

  // ── Ingresos ──
  const [pagos, setPagos] = useState<Pago[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>(esProfesor ? 'hoy' : 'todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  // ── Cierre de caja ──
  const [resumen, setResumen] = useState<CierreCajaResumen | null>(null)
  const [cargandoCierre, setCargandoCierre] = useState(false)
  const [errorCierre, setErrorCierre] = useState<string | null>(null)
  const [msgCierre, setMsgCierre] = useState<string | null>(null)
  const [historial, setHistorial] = useState<CierreCajaResumen[]>([])
  const [showHistorial, setShowHistorial] = useState(false)
  const [montoContado, setMontoContado] = useState('')
  const [obsCierre, setObsCierre] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const [showFormCierre, setShowFormCierre] = useState(false)

  const cargarResumen = () => {
    setCargandoCierre(true)
    setErrorCierre(null)
    obtenerResumen()
      .then(r => setResumen(r))
      .catch(() => setErrorCierre('Error al cargar resumen de caja'))
      .finally(() => setCargandoCierre(false))
  }

  const cargarHistorial = () => {
    historialCierres().then(h => setHistorial(h)).catch(() => {})
  }

  useEffect(() => {
    listarPagos()
      .then(data => {
        const sorted = [...data].sort((a, b) =>
          new Date(b.fechaPago ?? '').getTime() - new Date(a.fechaPago ?? '').getTime()
        )
        setPagos(sorted)
      })
      .catch(() => setError('Error al cargar los pagos'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (tab !== 'cierre') return
    obtenerResumen()
      .then(r => { setResumen(r); setErrorCierre(null) })
      .catch(() => setErrorCierre('Error al cargar resumen de caja'))
      .finally(() => setCargandoCierre(false))
    historialCierres().then(setHistorial).catch(() => {})
  }, [tab])

  const pagosFiltrados = useMemo(() => {
    const hoy = startOfDay(new Date())
    return pagos.filter(p => {
      if (!p.fechaPago) return filtro === 'todos'
      const fp = startOfDay(toLocalDate(p.fechaPago.slice(0, 10)))
      if (filtro === 'hoy') return fp.getTime() === hoy.getTime()
      if (filtro === 'semana') {
        const hace7 = new Date(hoy); hace7.setDate(hace7.getDate() - 6)
        return fp >= hace7 && fp <= hoy
      }
      if (filtro === 'mes') {
        return fp.getFullYear() === hoy.getFullYear() && fp.getMonth() === hoy.getMonth()
      }
      if (filtro === 'rango') {
        if (desde && fp < toLocalDate(desde)) return false
        if (hasta && fp > toLocalDate(hasta)) return false
        return true
      }
      return true
    })
  }, [pagos, filtro, desde, hasta])

  const totalIngresos = pagosFiltrados
    .filter(p => p.estadoPago === 'COMPLETADO')
    .reduce((s, p) => s + p.monto, 0)

  const labelRango = useMemo(() => {
    if (filtro !== 'rango' || (!desde && !hasta)) return 'Rango de fechas'
    if (desde && hasta) return `${desde} → ${hasta}`
    if (desde) return `Desde ${desde}`
    return `Hasta ${hasta}`
  }, [filtro, desde, hasta])

  const handleCerrarCaja = async () => {
    setCerrando(true)
    try {
      await cerrarCaja({
        montoContado: montoContado ? Number(montoContado) : undefined,
        observaciones: obsCierre || undefined,
      })
      setMsgCierre('✅ Caja cerrada correctamente. Mañana arranca en cero.')
      setShowFormCierre(false)
      setMontoContado(''); setObsCierre('')
      cargarResumen(); cargarHistorial()
    } catch (e: unknown) {
      setErrorCierre(mensajeError(e, 'Error al cerrar la caja'))
    } finally {
      setCerrando(false)
    }
  }

  return {
    esAdmin, esProfesor,
    tab, setTab,
    // Ingresos
    pagos, error, cargando,
    filtro, setFiltro,
    desde, setDesde,
    hasta, setHasta,
    pagosFiltrados, totalIngresos, labelRango,
    // Cierre
    resumen, cargandoCierre, errorCierre, msgCierre, setMsgCierre,
    historial, showHistorial, setShowHistorial,
    montoContado, setMontoContado,
    obsCierre, setObsCierre,
    cerrando, showFormCierre, setShowFormCierre,
    handleCerrarCaja,
  }
}
