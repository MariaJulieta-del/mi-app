import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../services/reporteService'
import { listarProximasAVencer } from '../services/membresiaService'
import { crearNotificacion } from '../services/notificacionService'

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [proximas, setProximas] = useState<MembresiaProxima[]>([])
  const [diasFiltro, setDiasFiltro] = useState(7)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [notifOk, setNotifOk] = useState<string | null>(null)
  const [notifError, setNotifError] = useState<string | null>(null)
  const [notificando, setNotificando] = useState<number | null>(null)
  const [notificandoTodos, setNotificandoTodos] = useState(false)

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(() => setError('Error al cargar el dashboard'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    listarProximasAVencer(diasFiltro)
      .then(setProximas)
      .catch(() => {})
  }, [diasFiltro])

  const diasRestantes = (fecha: string) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
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
      setNotifOk(`Notificación enviada a ${m.socioNombreCompleto}`)
      setTimeout(() => setNotifOk(null), 3000)
    } catch {
      setNotifError('Error al enviar la notificación')
      setTimeout(() => setNotifError(null), 3000)
    } finally {
      setNotificando(null)
    }
  }

  const notificarTodos = async () => {
    if (!proximas.length) return
    if (!confirm(`¿Enviar notificación a los ${proximas.length} socio(s) con membresía próxima a vencer?`)) return
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
      setNotifOk(`Notificaciones enviadas a ${proximas.length} socio(s)`)
      setTimeout(() => setNotifOk(null), 4000)
    } catch {
      setNotifError('Error al enviar notificaciones')
      setTimeout(() => setNotifError(null), 3000)
    } finally {
      setNotificandoTodos(false)
    }
  }

  if (cargando) return <p className="gt-text-muted">Cargando dashboard...</p>
  if (error) return <div className="gt-alert gt-alert-error">{error}</div>
  if (!stats) return null

  const sinMembresia = stats.totalSociosActivos - stats.membresiasActivas

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>Dashboard</h1>
        <span className="gt-text-muted" style={{ fontSize: 13 }}>{stats.mesReporte}</span>
      </div>

      {/* ── Fila 1: métricas clave ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="gt-stat-card">
          <div className="gt-stat-number">{stats.totalSociosActivos}</div>
          <div className="gt-stat-label">Socios registrados</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 12, color: '#6B7280' }}>
            <span style={{ color: '#16A34A', fontWeight: 600 }}>
              ✓ {stats.membresiasActivas} con plan activo
            </span>
            {sinMembresia > 0 && (
              <span style={{ color: '#D97706', fontWeight: 600 }}>
                {sinMembresia} sin plan
              </span>
            )}
          </div>
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number">{stats.asistentesHoy}</div>
          <div className="gt-stat-label">Asistentes hoy</div>
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number" style={{ fontSize: 28 }}>
            ${stats.totalRecaudadoMes.toLocaleString('es-AR')}
          </div>
          <div className="gt-stat-label">Recaudado este mes</div>
        </div>
      </div>

      {/* ── Fila 2: estado de membresías ── */}
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>
        Estado de membresías
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="gt-stat-card">
          <div className="gt-stat-number" style={{ color: '#16A34A' }}>{stats.membresiasActivas}</div>
          <div className="gt-stat-label">Activas</div>
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number" style={{ color: '#D97706' }}>{stats.membresiasPendientes}</div>
          <div className="gt-stat-label">Pendientes de pago</div>
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number" style={{ color: '#DC2626' }}>{stats.membresiasVencidas}</div>
          <div className="gt-stat-label">Vencidas</div>
        </div>
      </div>

      {/* ── Membresías próximas a vencer ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#374151' }}>
          🔔 Membresías próximas a vencer
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Próximos</span>
          {[7, 14, 30].map(d => (
            <button key={d}
              onClick={() => setDiasFiltro(d)}
              style={{
                padding: '3px 10px', borderRadius: 16, fontSize: 12,
                border: '1.5px solid', cursor: 'pointer',
                borderColor: diasFiltro === d ? '#2E75B6' : '#D1D5DB',
                background: diasFiltro === d ? '#EFF6FF' : '#fff',
                color: diasFiltro === d ? '#2E75B6' : '#6B7280',
                fontWeight: diasFiltro === d ? 600 : 400,
              }}>
              {d}d
            </button>
          ))}
          {proximas.length > 1 && (
            <button
              className="gt-btn"
              style={{ fontSize: 12, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '4px 12px' }}
              disabled={notificandoTodos}
              onClick={notificarTodos}>
              {notificandoTodos ? 'Enviando...' : `Notificar todos (${proximas.length})`}
            </button>
          )}
        </div>
      </div>

      {notifOk && (
        <div className="gt-alert gt-alert-success" style={{ marginBottom: 8 }}>
          {notifOk}
        </div>
      )}
      {notifError && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 8 }}>
          {notifError}
        </div>
      )}

      {proximas.length === 0 ? (
        <div className="gt-card" style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px 0', marginBottom: 20 }}>
          ✅ No hay membresías que venzan en los próximos {diasFiltro} días
        </div>
      ) : (
        <div className="gt-table-wrap" style={{ marginBottom: 20 }}>
          <table className="gt-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Plan</th>
                <th>Vence</th>
                <th style={{ width: 90 }}>Días rest.</th>
                <th style={{ width: 140 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proximas.map(m => {
                const dias = diasRestantes(m.fechaVencimiento)
                const urgente = dias <= 2
                return (
                  <tr key={m.id} style={urgente ? { background: '#FFF7ED' } : {}}>
                    <td>
                      <Link to={`/socios/${m.socioId}/perfil`} className="gt-fw-600" style={{ color: '#2E75B6', textDecoration: 'none' }}>
                        {m.socioNombreCompleto}
                      </Link>
                    </td>
                    <td>{m.tipoMembresia}</td>
                    <td style={{ fontSize: 13 }}>{m.fechaVencimiento}</td>
                    <td>
                      <span style={{
                        fontWeight: 700, fontSize: 13,
                        color: dias === 0 ? '#DC2626' : dias <= 2 ? '#D97706' : '#374151',
                      }}>
                        {dias === 0 ? 'Hoy' : `${dias}d`}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="gt-btn gt-btn-secondary"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          disabled={notificando === m.id}
                          onClick={() => notificarSocio(m)}>
                          {notificando === m.id ? '...' : '🔔 Notificar'}
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

      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
        Un socio está <em>registrado</em> cuando existe en el sistema. Para estar <em>con plan activo</em> debe tener una membresía vigente y paga.
      </p>
    </>
  )
}
