import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { RutinaRequestDTO } from '../types/Rutina'
import { crearRutina, obtenerRutina, actualizarRutina } from '../services/rutinaService'

const SOCIO_ID = 1

export default function RutinaForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [nombre, setNombre]         = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [guardando, setGuardando]   = useState(false)

  useEffect(() => {
    if (esEdicion && id) {
      obtenerRutina(Number(id), SOCIO_ID)
        .then(r => { setNombre(r.nombre); setDescripcion(r.descripcion ?? '') })
        .catch(() => setError('No se pudo cargar la rutina'))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres'); return }
    const datos: RutinaRequestDTO = { nombre: nombre.trim(), descripcion: descripcion.trim() }
    try {
      setGuardando(true)
      esEdicion && id
        ? await actualizarRutina(Number(id), SOCIO_ID, datos)
        : await crearRutina(SOCIO_ID, datos)
      navigate('/rutinas')
    } catch { setError('Error al guardar la rutina') }
    finally { setGuardando(false) }
  }

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>
          {esEdicion ? 'Editar Rutina' : 'Nueva Rutina'}
        </h1>
      </div>

      <div className="gt-card">
        {error && <div className="gt-alert gt-alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="gt-form-grid">
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Nombre *</label>
              <input
                className="gt-input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Rutina de fuerza"
                maxLength={50}
                required
              />
            </div>
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Descripción</label>
              <textarea
                className="gt-textarea"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describe el objetivo o contenido..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear Rutina'}
            </button>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={() => navigate('/rutinas')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
