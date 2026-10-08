import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIngresos, getAsistencias, getProximosAVencer, getSinAsistencias, getDashboard } from '../services/reporteService'
import { listarMantenimientos } from '../../maquinas/services/mantenimientoService'
import type { Mantenimiento } from '../../maquinas/types/Mantenimiento'
import { fechaLocalISO } from '../../../shared/utils/fechas'

export interface IngresoMes { mes: string; total: number }
export interface AsistenciaDia { fecha: string; total: number }
export interface ProximoVencer { socioId: number; nombre: string; dni: string; tipoMembresia: string; fechaVencimiento: string; diasRestantes: number }
export interface SinAsistencia { socioId: number; nombre: string; dni: string; ultimaAsistencia: string }
export interface DashboardStats { membresiasActivas: number; membresiasVencidas: number; totalRecaudadoMes: number }

export function hoy() { return fechaLocalISO() }
export function hace30() { const d = new Date(); d.setDate(d.getDate() - 30); return fechaLocalISO(d) }

export function useReportes() {
  const navigate = useNavigate()
  const [ingresos, setIngresos] = useState<IngresoMes[]>([])
  const [asistencias, setAsistencias] = useState<AsistenciaDia[]>([])
  const [meses, setMesesEstado] = useState(6)
  const [desde, setDesde] = useState(hace30())
  const [hasta, setHasta] = useState(hoy())
  const [loadingI, setLoadingI] = useState(true)
  const [loadingA, setLoadingA] = useState(true)
  const [errorI, setErrorI] = useState<string | null>(null)
  const [errorA, setErrorA] = useState<string | null>(null)
  const [proximos, setProximos] = useState<ProximoVencer[]>([])
  const [diasVencer, setDiasVencer] = useState(15)
  const [sinAsist, setSinAsist] = useState<SinAsistencia[]>([])
  const [diasInactivo, setDiasInactivo] = useState(14)
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null)
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])

  /** Cambiar el período recarga los ingresos */
  const setMeses = (m: number) => { setLoadingI(true); setMesesEstado(m) }

  const cargarAsistencias = async () => {
    setLoadingA(true); setErrorA(null)
    try { setAsistencias(await getAsistencias(desde, hasta)) }
    catch { setErrorA('Error al cargar asistencias') }
    finally { setLoadingA(false) }
  }

  useEffect(() => {
    getIngresos(meses)
      .then(d => { setIngresos(d); setErrorI(null) })
      .catch(() => setErrorI('Error al cargar ingresos'))
      .finally(() => setLoadingI(false))
  }, [meses])
  // Asistencias: al entrar con el rango por defecto; después se consulta con el botón
  useEffect(() => {
    getAsistencias(desde, hasta)
      .then(setAsistencias)
      .catch(() => setErrorA('Error al cargar asistencias'))
      .finally(() => setLoadingA(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getProximosAVencer(diasVencer).then(setProximos).catch(() => {}) }, [diasVencer])
  useEffect(() => { getSinAsistencias(diasInactivo).then(setSinAsist).catch(() => {}) }, [diasInactivo])
  useEffect(() => { getDashboard().then(setDashStats).catch(() => {}) }, [])
  useEffect(() => { listarMantenimientos().then(setMantenimientos).catch(() => {}) }, [])

  const maxIngreso = Math.max(...ingresos.map(i => i.total), 1)
  const maxAsist = Math.max(...asistencias.map(a => a.total), 1)
  const totalIngresos = ingresos.reduce((acc, i) => acc + i.total, 0)
  const totalAsistencias = asistencias.reduce((acc, a) => acc + a.total, 0)

  // Gastos de mantenimiento con costo registrado
  const gastosMantenimiento = mantenimientos.filter(m => m.costo != null && Number(m.costo) > 0)
  const totalGastosMantenimiento = gastosMantenimiento.reduce((acc, m) => acc + Number(m.costo ?? 0), 0)

  // Gastos por máquina (para el ranking)
  const gastosPorMaquina = Object.values(
    gastosMantenimiento.reduce((acc, m) => {
      const id = m.maquinaId
      if (!acc[id]) acc[id] = { nombre: m.maquinaNombre ?? '—', nro: m.maquinaNroMaquina ?? null, reps: 0, costoTotal: 0 }
      acc[id].reps += 1
      acc[id].costoTotal += Number(m.costo ?? 0)
      return acc
    }, {} as Record<number, { nombre: string; nro: string | null; reps: number; costoTotal: number }>)
  ).sort((a, b) => b.costoTotal - a.costoTotal)

  return {
    navigate,
    ingresos, asistencias,
    meses, setMeses,
    desde, setDesde,
    hasta, setHasta,
    loadingI, loadingA, errorI, errorA,
    proximos, diasVencer, setDiasVencer,
    sinAsist, diasInactivo, setDiasInactivo,
    dashStats,
    maxIngreso, maxAsist, totalIngresos, totalAsistencias,
    cargarAsistencias,
    // mantenimiento
    mantenimientos, gastosMantenimiento, totalGastosMantenimiento, gastosPorMaquina,
  }
}
