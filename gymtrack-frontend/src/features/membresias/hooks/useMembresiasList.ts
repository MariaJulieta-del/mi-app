import { useEffect, useState } from 'react'
import type { Tarifa } from '../types/Tarifa'
import { listarTarifas, actualizarTarifa } from '../services/tarifaService'
import { useAuth } from '../../../shared/context/AuthContext'

export const TIPO_COLOR: Record<string, string> = {
  MENSUAL: '#2E75B6',
  TRIMESTRAL: '#7C3AED',
  SEMESTRAL: '#D97706',
  ANUAL: '#16A34A',
}
export function colorPara(tipo: string): string {
  return TIPO_COLOR[tipo] ?? 'var(--accent)'
}

export function useMembresiasList() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'ADMIN'
  const [planes, setPlanes] = useState<Tarifa[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editandoTipo, setEditandoTipo] = useState<string | null>(null)
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(0)
  /** '' = pase libre */
  const [nuevosPases, setNuevosPases] = useState<number | ''>('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    listarTarifas()
      .then(setPlanes)
      .catch(() => setError('Error al cargar los planes'))
      .finally(() => setCargando(false))
  }, [])

  const iniciarEdicion = (p: Tarifa) => {
    setEditandoTipo(p.tipo); setNuevoPrecio(p.precio); setNuevosPases(p.pasesMensuales ?? ''); setMsg(null)
  }

  const guardarPlan = async (tipo: string) => {
    if (nuevoPrecio <= 0) return
    try {
      setGuardando(true)
      const actualizado = await actualizarTarifa(tipo, {
        precio: nuevoPrecio,
        pasesMensuales: nuevosPases === '' || nuevosPases <= 0 ? null : nuevosPases,
      })
      setPlanes(prev => prev.map(p => p.tipo === tipo ? actualizado : p))
      setEditandoTipo(null)
      setMsg(`✓ Plan "${actualizado.nombre}" actualizado. Los cambios aplican cuando cada socio renueva.`)
      setTimeout(() => setMsg(null), 5000)
    } catch { setError('No se pudo actualizar el plan') }
    finally { setGuardando(false) }
  }

  return {
    isAdmin, planes, cargando, error, msg,
    editandoTipo, setEditandoTipo, nuevoPrecio, setNuevoPrecio, nuevosPases, setNuevosPases, guardando,
    iniciarEdicion, guardarPlan,
  }
}
