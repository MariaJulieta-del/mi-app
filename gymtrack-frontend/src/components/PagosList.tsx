import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Pago } from '../types/Pago'
import { listarPagos } from '../services/pagoService'

export default function PagosList() {
  const [pagos, setPagos]       = useState<Pago[]>([])
  const [error, setError]       = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarPagos()
      .then(setPagos)
      .catch(() => setError('Error al cargar los pagos'))
      .finally(() => setCargando(false))
  }, [])

  const totalCompletado = pagos
    .filter(p => p.estadoPago === 'COMPLETADO')
    .reduce((sum, p) => sum + p.monto, 0)

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Pagos</h1>
        <Link to="/pagos/nuevo" className="gt-btn gt-btn-primary">+ Registrar pago</Link>
      </div>

      {/* Tarjeta resumen */}
      {pagos.length > 0 && (
        <div className="gt-stats-row">
          <div className="gt-stat-card">
            <div className="gt-stat-number">${totalCompletado.toLocaleString('es-AR')}</div>
            <div className="gt-stat-label">Total recaudado (completados)</div>
          </div>
          <div className="gt-stat-card">
            <div className="gt-stat-number">{pagos.length}</div>
            <div className="gt-stat-label">Pagos registrados</div>
          </div>
        </div>
      )}

      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      {cargando ? (
        <p className="gt-text-muted">Cargando...</p>
      ) : pagos.length === 0 ? (
        <div className="gt-empty">No hay pagos registrados.</div>
      ) : (
        <div className="gt-table-wrap">
          <table className="gt-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Membresía</th>
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
                  <td className="gt-fw-600">{p.socioNombre}</td>
                  <td>
                    <Link to={`/membresias/${p.membresiaId}`} style={{ color: '#1B5E44' }}>
                      #{p.membresiaId}
                    </Link>
                  </td>
                  <td>{p.fechaPago?.slice(0, 10)}</td>
                  <td>${p.monto}</td>
                  <td>{p.metodoPago}</td>
                  <td>
                    <span className={p.estadoPago === 'COMPLETADO'
                      ? 'gt-badge gt-badge-green'
                      : 'gt-badge gt-badge-gray'}>
                      {p.estadoPago}
                    </span>
                  </td>
                  <td className="gt-text-muted">{p.observaciones ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
