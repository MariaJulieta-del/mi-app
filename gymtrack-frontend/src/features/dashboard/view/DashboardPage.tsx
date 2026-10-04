import { Link } from 'react-router-dom'
import SociosEnRiesgo from '../../reportes/components/SociosEnRiesgo'
import { useDashboard } from '../hooks/useDashboard'

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function DashboardPage() {
  const d = useDashboard()

  if (d.cargando) return <p className="gt-text-muted">Cargando dashboard...</p>
  if (d.error) return <div className="gt-alert gt-alert-error">{d.error}</div>
  if (!d.stats) return null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>Dashboard</h1>
        <Link to="/reportes" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Ver reportes detallados →</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="gt-stat-card">
          <div className="gt-stat-number">{d.stats.totalSociosActivos}</div>
          <div className="gt-stat-label">Socios registrados</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--green-text)', fontWeight: 600 }}>{d.stats.membresiasActivas} con plan activo</span>
            {d.sinMembresia > 0 && <span style={{ color: 'var(--yellow-text)', fontWeight: 600 }}>{d.sinMembresia} sin plan</span>}
          </div>
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number">{d.stats.asistentesHoy}</div>
          <div className="gt-stat-label">Asistentes hoy</div>
          {d.sinAsist.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--yellow-text)', fontWeight: 600 }}>{d.sinAsist.length} sin venir en +2 meses</div>}
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number" style={{ fontSize: 28 }}>${d.stats.totalRecaudadoMes.toLocaleString('es-AR')}</div>
          <div className="gt-stat-label">Recaudado este mes</div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{d.stats.mesReporte}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Activas',         val: d.stats.membresiasActivas,   color: 'var(--green-text)',  bg: 'var(--green-bg)' },
          { label: `Vencen en ${d.diasFiltro} días`, val: d.proximas.length, color: 'var(--yellow-text)', bg: 'var(--yellow-bg)' },
          { label: 'Vencidas',        val: d.stats.membresiasVencidas,  color: 'var(--red)',          bg: 'var(--red-light)' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color }}>{val}</span>
          </div>
        ))}
      </div>

      {d.maqPendientes.length > 0 && (
        <div className="gt-card" style={{ marginBottom: 20, borderLeft: '3px solid var(--red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 0, color: 'var(--red)' }}>
              🔧 Máquinas con mantenimiento pendiente ({d.maqPendientes.length})
            </p>
            <Link to="/maquinas" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline' }}>Ver en Máquinas →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {d.maqPendientes.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--red-light)', borderRadius: 7, padding: '8px 12px' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--red)' }}>
                    {m.maquinaNroMaquina ? `#${m.maquinaNroMaquina} ` : ''}{m.maquinaNombre ?? `Máquina #${m.maquinaId}`}
                  </span>
                  {m.descripcion && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>— {m.descripcion}</span>}
                </div>
                {m.fechaMantenimiento && (
                  <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    desde {new Date(m.fechaMantenimiento + 'T00:00:00').toLocaleDateString('es-AR')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <SociosEnRiesgo />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Membresías próximas a vencer</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Próximos</span>
          {[7, 14, 30].map(x => (
            <button key={x} onClick={() => d.setDiasFiltro(x)}
              style={{ padding: '3px 10px', borderRadius: 16, fontSize: 12, border: '1.5px solid', cursor: 'pointer',
                borderColor: d.diasFiltro === x ? 'var(--accent)' : 'var(--border)',
                background: d.diasFiltro === x ? 'var(--accent-light)' : 'var(--bg-surface)',
                color: d.diasFiltro === x ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: d.diasFiltro === x ? 600 : 400 }}>
              {x}d
            </button>
          ))}
          {d.proximas.length > 1 && (
            <button className="gt-btn" style={{ fontSize: 12, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', border: '1px solid var(--yellow-text)', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
              disabled={d.notificandoTodos} onClick={d.notificarTodos}>
              <BellIcon />
              {d.notificandoTodos ? 'Enviando...' : `Notificar todos (${d.proximas.length})`}
            </button>
          )}
        </div>
      </div>

      {d.proximas.length === 0 ? (
        <div className="gt-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', marginBottom: 20 }}>
          Sin membresías que venzan en los próximos {d.diasFiltro} días
        </div>
      ) : (
        <div className="gt-table-wrap" style={{ marginBottom: 20 }}>
          <table className="gt-table">
            <thead><tr><th>Socio</th><th>Plan</th><th>Vence</th><th style={{ width: 90 }}>Días rest.</th><th style={{ width: 160 }}>Acciones</th></tr></thead>
            <tbody>
              {d.proximas.map(m => {
                const dias = d.diasRestantes(m.fechaVencimiento)
                return (
                  <tr key={m.id} style={dias <= 2 ? { background: 'var(--yellow-bg)' } : {}}>
                    <td>
                      <Link to={`/socios/${m.socioId}/perfil`} className="gt-fw-600" style={{ color: 'var(--blue-text)', textDecoration: 'none' }}>{m.socioNombreCompleto}</Link>
                    </td>
                    <td>{m.tipoMembresia}</td>
                    <td style={{ fontSize: 13 }}>{m.fechaVencimiento}</td>
                    <td>
                      <span className={`gt-badge ${dias === 0 ? 'gt-badge-red' : dias <= 3 ? 'gt-badge-yellow' : 'gt-badge-green'}`}>{dias === 0 ? 'Hoy' : `${dias}d`}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="gt-btn gt-btn-secondary" style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                          disabled={d.notificando === m.id} onClick={() => d.notificarSocio(m)}>
                          <BellIcon />
                          {d.notificando === m.id ? '...' : 'Notificar'}
                        </button>
                        <Link to={`/socios/${m.socioId}/perfil`} className="gt-btn gt-btn-secondary"
                          style={{ fontSize: 11, padding: '3px 8px', textDecoration: 'none', display: 'inline-block' }}>Ver perfil</Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--text-xmuted)', marginTop: 4 }}>
        Un socio está <em>registrado</em> cuando existe en el sistema. Para estar <em>con plan activo</em> debe tener una membresía vigente y paga.
      </p>
    </>
  )
}
