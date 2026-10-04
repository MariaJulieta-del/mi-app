import { mensajeError } from '../../../shared/utils/errores'
import { useState, useEffect, useRef } from 'react'
import { registrarCheckin, listarHoy } from '../services/asistenciaService'

export interface CheckinResultado {
  id: number
  socioId: number
  socioNombre: string
  socioDni: string
  fecha: string
  hora: string
  tipo: string
  permitido: boolean
  observacion?: string
  fechaVencimiento?: string
  tipoMembresia?: string
  paseLibre?: boolean
  pasesMensuales?: number | null
  pasesUsados?: number
  pasesRestantes?: number | null
  /** Semáforo calculado en el backend */
  estadoAcceso?: "VERDE" | "AMARILLO" | "ROJO"
}

export interface Asistencia {
  id: number
  socioNombre: string
  socioDni: string
  hora: string
  tipo: string
  permitido: boolean
  observacion?: string
}

export function diasHastaVencer(fechaVencimiento?: string): number | null {
  if (!fechaVencimiento) return null
  const [y, m, d] = fechaVencimiento.split('-').map(Number)
  const vence = new Date(y, m - 1, d)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export function useAcceso() {
  const [busqueda, setBusqueda] = useState('')
  const [resultado, setResultado] = useState<CheckinResultado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [historial, setHistorial] = useState<Asistencia[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const cargarHoy = async () => {
    try { setHistorial(await listarHoy()) } catch { /* el historial es informativo: si falla, queda el anterior */ }
  }

  useEffect(() => { listarHoy().then(setHistorial).catch(() => {}) }, [])

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!busqueda.trim()) { setError('Ingresá el DNI o ID del socio'); return }
    setError(null); setResultado(null); setLoading(true)
    const trimmed = busqueda.trim()
    const isId = /^\d{1,5}$/.test(trimmed)
    const payload = isId ? { socioId: parseInt(trimmed), tipo: 'ENTRADA' } : { dni: trimmed, tipo: 'ENTRADA' }
    try {
      const data = await registrarCheckin(payload)
      setResultado(data)
      setBusqueda('')
      cargarHoy()
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err: unknown) {
      setError(mensajeError(err, 'Error al registrar el acceso'))
    } finally { setLoading(false) }
  }

  const dias = resultado ? diasHastaVencer(resultado.fechaVencimiento) : null
  const semaforo = resultado
    ? (resultado.estadoAcceso ?? (resultado.permitido ? "VERDE" : "ROJO"))
    : null

  return {
    busqueda, setBusqueda,
    resultado, error, loading,
    historial, inputRef,
    handleCheckin, dias, semaforo,
  }
}
