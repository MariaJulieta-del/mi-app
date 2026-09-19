import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard, getSinAsistencias } from '../services/reporteService'
import { listarProximasAVencer } from '../services/membresiaService'
import { crearNotificacion } from '../services/notificacionService'
import { useToast } from '../hooks/useToast'

interface DashboardStats {
  totalSociosActivos: number
  membresiasActivas: number
  membresiasVencidas: number
  membresiasPendientes: number
  totalRecaudadoMes: number
  asistentesHoy: number
  mesReporte: string
}

interface MembresiaProxima {
  id: number
  socioId: number
  socioNombreCompleto: string
  tipoMembresia: string
  fechaVencimiento: string
}

interface SinAsistencia { socioId: number; nombre: string; dni: string; ultimaAsistencia: string }

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function DashboardPage() {
  const toast = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [proximas, setProximas] = useState<MembresiaProxima[]>([])
  const [diasFiltro, setDiasFiltro] = useState(7)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [notificando, setNotificando] = useState<number | null>(null)
  const [notificandoTodos, setNotificandoTodos] = useState(false)
  const [sinAsist, setSinAsist] = useState<SinAsistencia[]>([])

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setCargando(false))
    getSinAsistencias(14).then(setSinAsist).catch(() => {})
  }, [])

  useEffect(() => {
    listarProximasAVencer(diasFiltro).then(setProximas).catch(() => {})
  }, [diasFiltro])

  const diasRestantes = (fecha: string) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const venc = new Date(fecha + 'T00:00:00')
    return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  }

  const notificarSocio = async (m: MembresiaProxima) => {
    try {
      setNotificando(m.id)
      const dias = diasRestantes(m.fechaVencimiento)
      await crearNotificacion({
        socioId: m.socioId,
        mensaje: `Tu membresía (${m.tipoMembresia}) vence ${dias === 0 ? 'hoy' : `en ${dias} día${dias === 1 ? '' : 's'}`} (${m.fechaVencimiento}). ¡Renová para seguir entrenando!`,
        tipo: 'VENCIMIENTO',
      })
      toast.success('Notificación enviada', m.socioNombreCompleto)
    } catch {
      toast.error('Error', 'No se pudo enviar la notificación')
    } finally {
      setNotificando(null)
    }
  }

  const notificarTodos = async () => {
    if (!proximas.length) return
    try {
      setNotificandoTodos(true)
      for (const m of proximas) {
        const dias = diasRestantes(m.fechaVencimiento)
        await crearNotificacion({
          socioId: m.socioId,
          mensaje: `Tu membresía (${m.tipoMembresia}) vence ${dias === 0 ? 'hoy' : `en ${dias} día${dias === 1 ? '' : 's'}`} (${m.fechaVencimiento}). ¡Renová para seguir entrenando!`,
          tipo: 'VENCIMIENTO',
        })
      }
      toast.success('Notificaciones enviadas', `${proximas.length} socio(s) notificados`)
    } catch {
      toast.error('Error', 'No se pudieron enviar las notificaciones')
    } finally {
      setNotificandoTodos(false)
    }
  }

  if (cargando) return <p className="gt-text-muted">Cargando dashboard...</p>
  if (error) return <div className="gt-alert gt-alert-error">{error}</div>
  if (!stats) return null

  const sinMembresia = Math.max(0, stats.totalSociosActivos - stats.membresiasActivas)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>Dashboard</h1>
        <Link to="/reportes" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
          Ver reportes detallados →
        </Link>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="gt-stat-card">
          <div className="gt-stat-number">{stats.totalSociosActivos}</div>
          <div className="gt-stat-label">Socios registrados</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--green-text)', fontWeight: 600 }}>
              {stats.membresiasActivas} con plan activo
            </span>
            {sinMembresia > 0 && (
              <span style={{ color: 'var(--yellow-text)', fontWeight: 600 }}>
                {sinMembresia} sin plan
              </span>
            )}
          </div>
        </div>

        <div className="gt-stat-card">
          <div className="gt-stat-number">{stats.asistentesHoy}</div>
          <div className="gt-stat-label">Asistentes hoy</div>
          {sinAsist.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--yellow-text)', fontWeight: 600 }}>
              {sinAsist.length} sin venir en +14 días
            </div>
          )}
        </div>

        <div className="gt-stat-card">
          <div className="gt-stat-number" style={{ fontSize: 28 }}>
            ${stats.totalRecaudadoMes.toLocaleString('es-AR')}
          </div>
          <div className="gt-stat-label">Recaudado este mes</div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>{stats.mesReporte}</div>
        </div>
      </div>

      {/* ── Estado de membresías (fila compacta) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Activas',          val: stats.membresiasActivas,   color: 'var(--green-text)',  bg: 'var(--green-bg)' },
          { label: 'Pendientes pago',  val: stats.membresiasPendientes, color: 'var(--yellow-text)', bg: 'var(--yellow-bg)' },
          { label: 'Vencidas',         val: stats.membresiasVencidas,  color: 'var(--red)',          bg: 'var(--red-light)' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color }}>{val}</span>
          </div>
        ))}
      </div>

      {/* ── Socios en riesgo de abandono ── */}
      {sinAsist.length > 0 && (
        <div className="gt-card" style={{ marginBottom: 20, borderLeft: '3px solid var(--yellow-text)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 0, color: 'var(--yellow-text)' }}>
              Socios sin asistir en más de 14 días ({sinAsist.length})
            </p>
            <Link to="/reportes" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline' }}>Ver todos en reportes</Link>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sinAsist.slice(0, 8).map(s => (
              <Link key={s.socioId} to={`/socios/${s.socioId}/perfil`}
                style={{
                  textDecoration: 'none',
                  padding: '4px 10px', borderRadius: 16,
                  background: 'var(--yellow-bg)', color: 'var(--yellow-text)',
                  fontSize: 12, fontWeight: 600,
                }}>
                {s.nombre}
              </Link>
            ))}
            {sinAsist.length > 8 && (
              <Link to="/reportes" style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', textDecoration: 'underline' }}>
                +{sinAsist.length - 8} más →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Membresías próximas a vencer ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          Membresías próximas a vencer
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Próximos</span>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDiasFiltro(d)}
              style={{
                padding: '3px 10px', borderRadius: 16, fontSize: 12,
                border: '1.5px solid', cursor: 'pointer',
                borderColor: diasFiltro === d ? 'var(--accent)' : 'var(--border)',
                background: diasFiltro === d ? 'var(--accent-light)' : 'var(--bg-surface)',
                color: diasFiltro === d ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: diasFiltro === d ? 600 : 400,
              }}>
              {d}d
            </button>
          ))}
          {proximas.length > 1 && (
            <button
              className="gt-btn"
              style={{ fontSize: 12, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', border: '1px solid var(--yellow-text)', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
              disabled={notificandoTodos}
              onClick={notificarTodos}>
              <BellIcon />
              {notificandoTodos ? 'Enviando...' : `Notificar todos (${proximas.length})`}
            </button>
          )}
        </div>
      </div>

      {proximas.length === 0 ? (
        <div className="gt-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', marginBottom: 20 }}>
          Sin membresías que venzan en los próximos {diasFiltro} días
        </div>
      ) : (
        <div className="gt-table-wrap" style={{ marginBottom: 20 }}>
          <table className="gt-table">
            <thead>
              <tr>
                <th>Socio</th><th>Plan</th><th>Vence</th>
                <th style={{ width: 90 }}>Días rest.</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proximas.map(m => {
                const dias = diasRestantes(m.fechaVencimiento)
                return (
                  <tr key={m.id} style={dias <= 2 ? { background: 'var(--yellow-bg)' } : {}}>
                    <td>
                      <Link to={`/socios/${m.socioId}/perfil`} className="gt-fw-600"
                        style={{ color: 'var(--blue-text)', textDecoration: 'none' }}>
                        {m.socioNombreCompleto}
                      </Link>
                    </td>
                    <td>{m.tipoMembresia}</td>
                    <td style={{ fontSize: 13 }}>{m.fechaVencimiento}</td>
                    <td>
                      <span className={`gt-badge ${dias === 0 ? 'gt-badge-red' : dias <= 3 ? 'gt-badge-yellow' : 'gt-badge-green'}`}>
                        {dias === 0 ? 'Hoy' : `${dias}d`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="gt-btn gt-btn-secondary"
                          style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                          disabled={notificando === m.id}
                          onClick={() => notificarSocio(m)}>
                          <BellIcon />
                          {notificando === m.id ? '...' : 'Notificar'}
                        </button>
                        <Link to={`/socios/${m.socioId}/perfil`}
                          className="gt-btn gt-btn-secondary"
                          style={{ fontSize: 11, padding: '3px 8px', textDecoration: 'none', display: 'inline-block' }}>
                          Ver perfil
                        </Link>
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
