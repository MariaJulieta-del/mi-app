import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TarifaCreateDTO } from '../types/Tarifa'
import { crearTarifa } from '../services/tarifaService'

export function useMembresiasForm() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [duracionDias, setDuracionDias] = useState<number | ''>(30)
  const [precio, setPrecio] = useState<number | ''>(0)
  /** '' = pase libre */
  const [pasesMensuales, setPasesMensuales] = useState<number | ''>(12)
  const [incluye, setIncluye] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const tipoGenerado = nombre.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!duracionDias || duracionDias <= 0) { setError('La duración debe ser mayor a 0 días'); return }
    if (!precio || precio <= 0) { setError('El precio debe ser mayor a cero'); return }
    const dto: TarifaCreateDTO = {
      tipo: tipoGenerado,
      nombre: nombre.trim(),
      precio: Number(precio),
      duracionDias: Number(duracionDias),
      pasesMensuales: pasesMensuales === '' || pasesMensuales <= 0 ? null : Number(pasesMensuales),
      incluye: incluye.trim() || undefined,
    }
    try {
      setGuardando(true)
      await crearTarifa(dto)
      navigate('/membresias')
    } catch {
      setError('Error al crear el plan. Es posible que ya exista uno con ese nombre.')
    } finally { setGuardando(false) }
  }

  return {
    navigate, nombre, setNombre, duracionDias, setDuracionDias,
    precio, setPrecio, pasesMensuales, setPasesMensuales, incluye, setIncluye,
    error, setError, guardando, tipoGenerado, handleSubmit,
  }
}
