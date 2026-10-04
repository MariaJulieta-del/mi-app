import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerFicha, guardarFicha } from '../services/fichaService'

export function useFichaMedica() {
  const { socioId } = useParams<{ socioId: string }>()
  const navigate = useNavigate()
  const id = Number(socioId)

  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!id) return
    obtenerFicha(id)
      .then(data => {
        if (data) {
          const partes = [
            data.observacionesMedicas,
            data.lesiones ? `Antecedentes/Lesiones: ${data.lesiones}` : '',
            data.historialGimnasio ? `Historial: ${data.historialGimnasio}` : '',
          ].filter(Boolean)
          setObservaciones(partes.join('\n\n'))
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true); setError(null); setExito(false)
    try {
      await guardarFicha(id, {
        lesiones: '', nivelAptitud: 'BUENO', historialGimnasio: '',
        disponibilidad: '', observacionesMedicas: observaciones,
      })
      setExito(true)
    } catch { setError('Error al guardar las observaciones') }
    finally { setGuardando(false) }
  }

  return { navigate, observaciones, setObservaciones, error, setError, exito, setExito, guardando, cargando, handleSubmit }
}
