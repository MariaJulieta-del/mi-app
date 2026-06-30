import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { PagoRequestDTO, MetodoPago } from '../types/Pago'
import { registrarPago } from '../services/pagoService'

const METODOS: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']

export default function PagosForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const membresiaIdParam = searchParams.get('membresiaId')

  const [membresiaId, setMembresiaId]     = useState<number | ''>(membresiaIdParam ? Number(membresiaIdParam) : '')
  const [monto, setMonto]                 = useState<number>(0)
  const [metodo, setMetodo]               = useState<MetodoPago>('EFECTIVO')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError]                 = useState<string | null>(null)
  const [guardando, setGuardando]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!membresiaId) { setError('Ingresá el ID de la membresía'); return }
    if (monto <= 0)   { setError('El monto debe ser mayor a cero'); return }
    const dto: PagoRequestDTO = { membresiaId: Number(membresiaId), monto, metodoPago: metodo, observaciones: observaciones || undefined }
    try {
      setGuardando(true)
      await registrarPago(dto)
      membresiaIdParam ? navigate(`/membresias/${membresiaIdParam}`) : navigate('/pagos')
    } catch { setError('Error al registrar el pago') }
    finally { setGuardando(false) }
  }

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Registrar Pago</h1>
      </div>

      <div className="gt-card">
        {error && <div className="gt-alert gt-alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label">ID de Membresía *</label>
              <input className="gt-input" type="number" value={membresiaId}
                onChange={e => setMembresiaId(Number(e.target.value))}
                readOnly={Boolean(membresiaIdParam)} required />
            </div>

            <div className="gt-form-group">
              <label className="gt-label">Monto ($) *</label>
              <input className="gt-input" type="number" value={monto}
                onChange={e => setMonto(Number(e.target.value))} min={0} step={0.01} required />
            </div>

            <div className="gt-form-group">
              <label className="gt-label">Método de Pago *</label>
              <select className="gt-select" value={metodo}
                onChange={e => setMetodo(e.target.value as MetodoPago)}>
                {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Observaciones</label>
              <textarea className="gt-textarea" value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Ej: Comprobante #123" rows={2} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
              {guardando ? 'Registrando...' : 'Registrar Pago'}
            </button>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
