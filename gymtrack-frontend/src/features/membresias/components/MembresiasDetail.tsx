import { Link } from 'react-router-dom'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { formatFecha } from '../../../shared/utils/fechas'
import { useMembresiasDetail } from '../hooks/useMembresiasDetail'
import MembresiaResumen from './MembresiaResumen'
import { CargandoPagina } from '../../../shared/components/ui'

export default function MembresiasDetail() {
  const d = useMembresiasDetail()

  if (d.cargando) return <CargandoPagina filas={3} />
  if (d.error || !d.membresia) return <div className="gt-alert gt-alert-error">{d.error ?? 'Membresía no encontrada'}</div>

  const m = d.membresia
  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>{m.socioNombreCompleto}</h1>
        <button className="gt-btn gt-btn-secondary" onClick={() => d.navigate(-1)}>← Volver</button>
      </div>

      <MembresiaResumen m={m} acciones={
        <>
          {d.puedeCobrar && (
            <Link to={`/pagos/nuevo?socioId=${m.socioId}`} className="gt-btn gt-btn-primary">
              {m.estadoMembresia === 'ACTIVA' ? 'Renovar / cambiar plan' : 'Cobrar y reactivar'}
            </Link>
          )}
          <Link to={`/socios/${m.socioId}/perfil`} className="gt-btn gt-btn-secondary">Ver perfil del socio</Link>
          {d.esAdmin && m.estadoMembresia === 'ACTIVA' && (
            <button className="gt-btn gt-btn-danger" onClick={() => d.setConfirmarCancelar(true)}>Cancelar membresía</button>
          )}
        </>
      } />

      {d.esAdmin && <div className="gt-card">
        <p className="gt-card-title">Historial de pagos</p>
        {d.pagos.length === 0 ? <p className="gt-text-muted">Sin pagos registrados.</p> : (
          <div tabIndex={0} role="region" aria-label="Pagos de la membresía" className="gt-table-wrap">
            <table className="gt-table gt-tabla-tarjetas">
              <thead><tr><th>Fecha</th><th>Plan</th><th>Monto</th><th>Método</th><th>Observaciones</th></tr></thead>
              <tbody>
                {d.pagos.map(p => (
                  <tr key={p.id}>
                    <td className="gt-td-titulo">{formatFecha(p.fechaPago)}</td>
                    <td data-label="Plan">{p.tipoMembresia ?? '—'}</td>
                    <td data-label="Monto" style={{ fontWeight: 600 }}>${Number(p.monto).toLocaleString('es-AR')}</td>
                    <td data-label="Método">{p.metodoPago}</td>
                    <td data-label="Observaciones">{p.observaciones ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d.pagos.length > 0 && (
          <p style={{ margin: '12px 0 0', fontWeight: 700 }}>Total pagado: ${d.totalPagado.toLocaleString('es-AR')}</p>
        )}
      </div>}

      <ConfirmModal
        open={d.confirmarCancelar}
        title="Cancelar membresía"
        message={`${m.socioNombreCompleto} no va a poder ingresar hasta que le cobres un plan nuevo. ¿Continuar?`}
        confirmLabel="Cancelar membresía"
        cancelLabel="Volver"
        danger
        onConfirm={d.handleCancelar}
        onCancel={() => d.setConfirmarCancelar(false)}
      />
    </>
  )
}
