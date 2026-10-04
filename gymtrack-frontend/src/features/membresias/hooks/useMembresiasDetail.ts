import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Membresia } from '../types/Membresia'
import type { Pago } from '../../pagos/types/Pago'
import { obtenerMembresia, cambiarEstado } from '../services/membresiaService'
import { pagosPorMembresia } from '../../pagos/services/pagoService'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'

export function useMembresiasDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const [membresia, setMembresia] = useState<Membresia | null>(null)
  const [pagos, setPagos] = useState<Pago[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)

  useEffect(() => {
    if (!id) return
    const nId = Number(id)
    // El historial de pagos lo ve solo el admin (el profesor puede cobrar, pero no ver pagos)
    const esAdmin = user?.rol === 'ADMIN'
    Promise.all([obtenerMembresia(nId), esAdmin ? pagosPorMembresia(nId) : Promise.resolve([] as Pago[])])
      .then(([mem, pgs]) => { setMembresia(mem); setPagos(pgs) })
      .catch(() => setError('No se pudo cargar la membresía'))
      .finally(() => setCargando(false))
  }, [id, user?.rol])

  const handleCancelar = async () => {
    setConfirmarCancelar(false)
    if (!membresia) return
    try {
      setMembresia(await cambiarEstado(membresia.id, 'CANCELADA'))
      toast.success('Membresía cancelada', membresia.socioNombreCompleto)
    } catch { toast.error('No se pudo cancelar', 'Intentá nuevamente') }
  }

  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0)

  return {
    membresia, pagos, error, cargando, navigate, totalPagado,
    esAdmin: user?.rol === 'ADMIN',
    puedeCobrar: user?.rol === 'ADMIN' || user?.rol === 'PROFESOR',
    confirmarCancelar, setConfirmarCancelar, handleCancelar,
  }
}
