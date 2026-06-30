import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MembresiaRequestDTO, TipoMembresia } from '../types/Membresia'
import { crearMembresia } from '../services/membresiaService'

const TIPOS: TipoMembresia[] = ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']
const PRECIO_SUGERIDO: Record<TipoMembresia, number> = {
  MENSUAL: 5000, TRIMESTRAL: 13000, SEMESTRAL: 24000, ANUAL: 45000,
}

export default function MembresiasForm() {
  const navigate = useNavigate()
  const [socioId, setSocioId]         = useState<number | ''>('')
  const [tipo, setTipo]               = useState<TipoMembresia>('MENSUAL')
  const [fechaInicio, setFechaInicio] = useState('')
  const [precio, setPrecio]           = useState<number>(PRECIO_SUGERIDO['MENSUAL'])
  const [error, setError]             = useState<string | null>(null)
  const [guardando, setGuardando]     = useState(false)

  const handleTipoChange = (t: TipoMembresia) => { setTipo(t); setPrecio(PRECIO_SUGERIDO[t]) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!socioId) { setError('Ingresá el ID del socio'); return }
    try {
      setGuardando(true)
      await crearMembresia({ socioId: Number(socioId), tipoMembresia: tipo, fechaInicio: fechaInicio || undefined, precio })
      navigate('/membresias')
    } catch { setError('Error al crear la membresía') }
    finally { setGuardando(false) }
  }

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Nueva Membresía</h1>
      </div>

      <div className="gt-card">
        {error && <div className="gt-alert gt-alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label">ID del Socio *</label>
              <input className="gt-input" type="number" value={socioId}
                onChange={e => setSocioId(Number(e.target.value))} placeholder="Ej: 1" required />
            </div>

            <div className="gt-form-group">
              <label className="gt-label">Tipo de Membresía *</label>
              <select className="gt-select" value={tipo}
                onChange={e => handleTipoChange(e.target.value as TipoMembresia)}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="gt-form-group">
              <label className="gt-label">Fecha de Inicio (opcional)</label>
              <input className="gt-input" type="date" value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)} />
            </div>

            <div className="gt-form-group">
              <label className="gt-label">Precio ($) *</label>
              <input className="gt-input" type="number" value={precio}
                onChange={e => setPrecio(Number(e.target.value))} min={0} step={0.01} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Crear Membresía'}
            </button>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={() => navigate('/membresias')}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
