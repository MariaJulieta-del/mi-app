import { useEffect, useState } from 'react'
import { getDashboard } from '../services/reporteService'
interface DashboardStats {
 totalSociosActivos: number
 membresiasActivas: number
 membresiasVencidas: number
 membresiasPendientes: number
 totalRecaudadoMes: number
 asistentesHoy: number
 mesReporte: string
}
export default function DashboardPage() {
 const [stats, setStats] = useState<DashboardStats | null>(null)
 const [error, setError] = useState<string | null>(null)
 const [cargando, setCargando] = useState(true)
 useEffect(() => {
 getDashboard()
 .then(setStats)
 .catch(() => setError('Error al cargar el dashboard'))
 .finally(() => setCargando(false))
 }, [])
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
 {/* Socios registrados */}
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
 {/* Asistentes hoy */}
 <div className="gt-stat-card">
 <div className="gt-stat-number">{stats.asistentesHoy}</div>
 <div className="gt-stat-label">Asistentes hoy</div>
 </div>
 {/* Recaudación */}
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
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 8 }}>
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
 {/* Nota aclaratoria */}
 <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
 Un socio está <em>registrado</em> cuando existe en el sistema. Para estar <em>con plan activo</em> debe tener una membresía vigente y paga.
 </p>
 </>
 )
}
