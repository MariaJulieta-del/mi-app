import { Link } from 'react-router-dom'
import { useAcceso } from '../hooks/useAcceso'
import { PasesMeter } from '../../membresias/components/MembresiaResumen'
import { formatFecha } from '../../../shared/utils/fechas'
import { SEMAFORO } from '../utils/semaforo'
import IconoAcceso from '../components/IconoAcceso'
import { Spinner } from '../../../shared/components/ui'


export default function AccesoPage() {
  const { inputRef, ...a } = useAcceso()

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Control de Acceso</h1>
        <Link to="/qr-ingreso" className="gt-btn gt-btn-primary">Mostrar QR de ingreso</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="gt-card">
          <p className="gt-card-title">Registrar ingreso</p>
          <form onSubmit={a.handleCheckin}>
            <div className="gt-form-group" style={{ marginBottom: 16 }}>
              <label className="gt-label" htmlFor="accesopage-campo-1">DNI o ID del socio</label>
              <input id="accesopage-campo-1" ref={inputRef} className="gt-input" value={a.busqueda} onChange={e => a.setBusqueda(e.target.value)}
                placeholder="Ej: 38.112.445 o 7" autoFocus style={{ fontSize: 18, padding: '10px 12px', letterSpacing: 1 }} />
            </div>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={a.loading}
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '10px 0' }}>
              {a.loading ? <><Spinner /> Verificando…</> : 'Registrar ingreso'}
            </button>
          </form>

          {a.error && <div className="gt-alert gt-alert-error" style={{ marginTop: 16 }}>{a.error}</div>}

          {a.resultado && a.semaforo && (
            <div className="gt-acceso-result" style={{ borderColor: SEMAFORO[a.semaforo].color }}>
              <div className="gt-acceso-head" style={{ background: SEMAFORO[a.semaforo].bg }}>
                <span style={{ display: 'flex', color: SEMAFORO[a.semaforo].color }}><IconoAcceso estado={a.semaforo} size={32} /></span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: SEMAFORO[a.semaforo].color }}>
                    {SEMAFORO[a.semaforo].titulo}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 2 }}>
                    <strong>{a.resultado.socioNombre}</strong>
                    <span className="gt-text-muted" style={{ marginLeft: 8 }}>DNI: {a.resultado.socioDni}</span>
                  </div>
                </div>
              </div>
              <div className="gt-acceso-body">
                {a.resultado.tipoMembresia && (
                  <div className="gt-acceso-row">
                    <span className="gt-text-muted gt-text-sm">Plan</span>
                    <span className="gt-badge gt-badge-blue">{a.resultado.tipoMembresia}</span>
                  </div>
                )}
                {a.resultado.fechaVencimiento && (
                  <div className="gt-acceso-row">
                    <span className="gt-text-muted gt-text-sm">Vence</span>
                    <span className="gt-text-sm" style={{ fontWeight: 700, color: a.dias !== null && a.dias <= 5 ? 'var(--yellow-text)' : 'var(--text-primary)' }}>
                      {formatFecha(a.resultado.fechaVencimiento)}
                      {a.dias !== null && <span style={{ marginLeft: 6, fontWeight: 400, color: a.dias <= 0 ? 'var(--red)' : a.dias <= 5 ? 'var(--yellow-text)' : 'var(--text-muted)' }}>
                        ({a.dias < 0 ? 'vencida' : a.dias === 0 ? 'hoy' : a.dias === 1 ? 'mañana' : `en ${a.dias} días`})
                      </span>}
                    </span>
                  </div>
                )}
                {a.resultado.pasesUsados != null && (
                  <PasesMeter compacto m={{
                    paseLibre: !!a.resultado.paseLibre,
                    pasesMensuales: a.resultado.pasesMensuales ?? null,
                    pasesUsados: a.resultado.pasesUsados,
                    pasesRestantes: a.resultado.pasesRestantes ?? null,
                    cicloFin: '',
                  }} />
                )}
                {a.resultado.observacion && (
                  <div className="gt-text-sm" style={{ color: SEMAFORO[a.semaforo].color, background: SEMAFORO[a.semaforo].bg, borderRadius: 6, padding: '6px 10px' }}>
                    {a.resultado.observacion}
                  </div>
                )}
                {a.semaforo === 'ROJO' && (
                  <Link to={`/socios/${a.resultado.socioId}/perfil`} className="gt-btn gt-btn-secondary gt-btn-sm" style={{ alignSelf: 'flex-start' }}>
                    Ver perfil del socio →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="gt-card">
          <p className="gt-card-title">Asistentes hoy — {new Date().toLocaleDateString('es-AR')}</p>
          <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--accent)', textAlign: 'center', padding: '20px 0 8px' }}>
            {a.historial.filter(h => h.tipo === 'ENTRADA' && h.permitido).length}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>ingresos registrados</p>
          {a.historial.filter(h => !h.permitido).length > 0 && (
            <div style={{ background: 'var(--yellow-bg)', color: 'var(--yellow-text)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontSize: 13 }}>
              {a.historial.filter(h => !h.permitido).length} acceso{a.historial.filter(h => !h.permitido).length !== 1 ? 's' : ''} denegado{a.historial.filter(h => !h.permitido).length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      <div className="gt-card">
        <p className="gt-card-title">Registro del día</p>
        {a.historial.length === 0 ? (
          <div className="gt-empty">No hay registros para hoy todavía.</div>
        ) : (
          <div className="gt-table-wrap">
            <table className="gt-table">
              <thead><tr><th>Hora</th><th>Socio</th><th>DNI</th><th>Tipo</th><th>Acceso</th><th>Observación</th></tr></thead>
              <tbody>
                {a.historial.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{String(h.hora).slice(0, 5)}</td>
                    <td className="gt-fw-600">{h.socioNombre}</td>
                    <td>{h.socioDni}</td>
                    <td><span className={h.tipo === 'ENTRADA' ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-blue'}>{h.tipo}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={h.permitido ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-red'}>{h.permitido ? 'Permitido' : 'Denegado'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>{h.observacion ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
