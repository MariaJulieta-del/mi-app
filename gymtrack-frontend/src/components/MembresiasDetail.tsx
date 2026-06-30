import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { Membresia, EstadoMembresia } from '../types/Membresia'
import type { Pago } from '../types/Pago'
import { obtenerMembresia, cambiarEstado } from '../services/membresiaService'
import { pagosPorMembresia } from '../services/pagoService'

const BADGE_COLOR: Record<EstadoMembresia, string> = {
  ACTIVA: 'green', PENDIENTE_PAGO: 'orange', VENCIDA: 'gray', CANCELADA: 'red',
}

/**
 * Detalle de una membresía con el historial completo de pagos.
 */
export default function MembresiasDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [membresia, setMembresia] = useState<Membresia | null>(null)
  const [pagos, setPagos]         = useState<Pago[]>([])
  const [error, setError]         = useState<string | null>(null)
  const [cargando, setCargando]   = useState(true)

  useEffect(() => {
    if (!id) return
    const nId = Number(id)
    Promise.all([obtenerMembresia(nId), pagosPorMembresia(nId)])
      .then(([mem, pgs]) => { setMembresia(mem); setPagos(pgs) })
      .catch(() => setError('No se pudo cargar la membresía'))
      .finally(() => setCargando(false))
  }, [id])

  const handleCancelar = async () => {
    if (!membresia?.id || !confirm('¿Cancelar esta membresía?')) return
    try {
      const actualizada = await cambiarEstado(membresia.id, 'CANCELADA')
      setMembresia(actualizada)
    } catch {
      alert('No se pudo cancelar')
    }
  }

  // Suma total de pagos mostrados
  const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0)

  if (cargando) return <p>Cargando...</p>
  if (error || !membresia) return <p style={{ color: 'red' }}>{error ?? 'No encontrada'}</p>

  return (
    <div>
      <button onClick={() => navigate('/membresias')}>← Volver</button>
      <h2>Membresía #{membresia.id}</h2>

      <p><strong>Socio:</strong> {membresia.socioNombreCompleto}</p>
      <p><strong>Tipo:</strong> {membresia.tipoMembresia}</p>
      <p>
        <strong>Estado: </strong>
        <span style={{
          background: BADGE_COLOR[membresia.estadoMembresia!] ?? 'gray',
          color: 'white', padding: '2px 8px', borderRadius: '12px'
        }}>
          {membresia.estadoMembresia}
        </span>
      </p>
      <p><strong>Período:</strong> {membresia.fechaInicio} → {membresia.fechaVencimiento}</p>
      <p><strong>Precio:</strong> ${membresia.precio}</p>

      <div>
        {/* Registrar nuevo pago para esta membresía */}
        <Link to={`/pagos/nuevo?membresiaId=${membresia.id}`}>
          <button>+ Registrar Pago</button>
        </Link>
        {(membresia.estadoMembresia === 'ACTIVA' || membresia.estadoMembresia === 'PENDIENTE_PAGO') && (
          <button onClick={handleCancelar}>Cancelar Membresía</button>
        )}
      </div>

      {/* Historial de pagos */}
      <h3>Historial de Pagos</h3>
      {pagos.length === 0 ? (
        <p>Sin pagos registrados.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id}>
                  <td>{p.fechaPago?.slice(0, 16).replace('T', ' ')}</td>
                  <td>${p.monto}</td>
                  <td>{p.metodoPago}</td>
                  <td>{p.estadoPago}</td>
                  <td>{p.observaciones ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>Total pagado: ${totalPagado.toFixed(2)}</strong></p>
        </>
      )}
    </div>
  )
}
