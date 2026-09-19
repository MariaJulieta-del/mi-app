import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getIngresos, getAsistencias, getProximosAVencer, getSinAsistencias, getDashboard } from '../services/reporteService'
interface IngresoMes { mes: string; total: number }
interface AsistenciaDia { fecha: string; total: number }
interface ProximoVencer { socioId: number; nombre: string; dni: string; tipoMembresia: string; fechaVencimiento: string; diasRestantes: number }
interface SinAsistencia { socioId: number; nombre: string; dni: string; ultimaAsistencia: string }
interface DashboardStats { membresiasActivas: number; membresiasPendientes: number; membresiasVencidas: number; totalRecaudadoMes: number }

// Fecha ISO sin hora para inputs type=date
function hoy() { return new Date().toISOString().slice(0, 10) }
function hace30() { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) }

// Mini barra de progreso proporcional
function Barra({ valor, max, color }: { valor: number; max: number; color: string }) {
 const pct = max === 0 ? 0 : Math.round((valor / max) * 100)
 return (
 <div style={{ background: 'var(--border)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
 <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
 </div>
 )
}

// SVG Bar Chart
function BarChart({ data }: { data: IngresoMes[] }) {
  if (data.length === 0) return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>Sin datos de ingresos</div>
  const max = Math.max(...data.map(d => d.total), 1)
  const W = 560, H = 160, PAD = { left: 64, right: 12, top: 14, bottom: 30 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const barW = Math.min(40, (chartW / data.length) - 8)
  const gap = chartW / data.length
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => ({ p, val: max * p }))
  const fmtMes = (s: string) => {
    const [y, m] = s.split('-')
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${meses[parseInt(m)]} ${y.slice(2)}`
  }
  const fmtMoney = (n: number) =>
    n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n/1000)}k` : `$${n}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
      {yTicks.map(({ p, val }) => {
        const y = PAD.top + chartH - p * chartH
        return (
          <g key={p}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray={p === 0 ? 'none' : '3,3'} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-muted)">{fmtMoney(val)}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = PAD.left + i * gap + gap / 2 - barW / 2
        const barH = (d.total / max) * chartH
        const y = PAD.top + chartH - barH
        const isLast = i === data.length - 1
        return (
          <g key={d.mes}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill={isLast ? 'var(--accent)' : 'var(--border)'} opacity={isLast ? 1 : 0.75} />
            {isLast && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill="var(--accent)" fontWeight="600">{fmtMoney(d.total)}</text>
            )}
            <text x={x + barW / 2} y={PAD.top + chartH + 16} textAnchor="middle" fontSize="9" fill={isLast ? 'var(--text-secondary)' : 'var(--text-muted)'} fontWeight={isLast ? '600' : '400'}>{fmtMes(d.mes)}</text>
          </g>
        )
      })}
    </svg>
  )
}

// SVG Ring chart membresías
function RingChart({ activas, pendientes, vencidas }: { activas: number; pendientes: number; vencidas: number }) {
  const total = activas + pendientes + vencidas || 1
  const r = 44, cx = 56, cy = 56, stroke = 14
  const circumference = 2 * Math.PI * r
  const segments = [
    { val: activas,    color: 'var(--green-text)', label: 'Activas' },
    { val: pendientes, color: 'var(--yellow-text)', label: 'Pendientes' },
    { val: vencidas,   color: 'var(--red)', label: 'Vencidas' },
  ]
  let offset = 0
  const arcs = segments.map(seg => {
    const frac = seg.val / total
    const dash = frac * circumference
    const arc = { ...seg, dash, offset, gap: circumference - dash }
    offset += dash
    return arc
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={circumference / 4 - arc.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--text-muted)">total</text>
      </svg>
      <div style={{ flex: 1 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.val}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({Math.round(s.val/total*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
export default function ReportesPage() {
 const navigate = useNavigate()
 const [ingresos, setIngresos] = useState<IngresoMes[]>([])
 const [asistencias, setAsistencias] = useState<AsistenciaDia[]>([])
 const [meses, setMeses] = useState(6)
 const [desde, setDesde] = useState(hace30)
 const [hasta, setHasta] = useState(hoy)
 const [loadingI, setLoadingI] = useState(false)
 const [loadingA, setLoadingA] = useState(false)
 const [errorI, setErrorI] = useState<string | null>(null)
 const [errorA, setErrorA] = useState<string | null>(null)
 const [proximos, setProximos] = useState<ProximoVencer[]>([])
 const [diasVencer, setDiasVencer] = useState(15)
 const [sinAsist, setSinAsist] = useState<SinAsistencia[]>([])
 const [diasInactivo, setDiasInactivo] = useState(14)
 const [dashStats, setDashStats] = useState<DashboardStats | null>(null)
 useEffect(() => { cargarIngresos() }, [meses])
 useEffect(() => { cargarAsistencias() }, [])
 useEffect(() => { cargarProximos() }, [diasVencer])
 useEffect(() => { cargarSinAsistencias() }, [])
 useEffect(() => { cargarSinAsistencias() }, [diasInactivo])
 useEffect(() => { getDashboard().then(setDashStats).catch(() => {}) }, [])
 const cargarIngresos = async () => {
 setLoadingI(true); setErrorI(null)
 try { setIngresos(await getIngresos(meses)) }
 catch { setErrorI('Error al cargar ingresos') }
 finally { setLoadingI(false) }
 }
 const cargarAsistencias = async () => {
 setLoadingA(true); setErrorA(null)
 try { setAsistencias(await getAsistencias(desde, hasta)) }
 catch { setErrorA('Error al cargar asistencias') }
 finally { setLoadingA(false) }
 }
 const cargarProximos = async () => {
 try { setProximos(await getProximosAVencer(diasVencer)) } catch {}
 }
 const cargarSinAsistencias = async () => {
 try { setSinAsist(await getSinAsistencias(diasInactivo)) } catch {}
 }
 const maxIngreso = Math.max(...ingresos.map(i => i.total), 1)
 const maxAsist = Math.max(...asistencias.map(a => a.total), 1)
 const totalIngresos = ingresos.reduce((acc, i) => acc + i.total, 0)
 const totalAsistencias = asistencias.reduce((acc, a) => acc + a.total, 0)
 return (
 <>
 <h1 className="gt-page-title">Reportes</h1>

 {/* ─── Gráficos: ingresos + membresías ─── */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
   <div className="gt-card" style={{ minWidth: 0 }}>
     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
       <p className="gt-card-title" style={{ margin: 0 }}>Ingresos últimos {meses} meses</p>
       <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
         <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
           ${ingresos.reduce((s, i) => s + i.total, 0).toLocaleString('es-AR')}
         </span>
         <select className="gt-select" style={{ width: 'auto' }} value={meses} onChange={e => setMeses(Number(e.target.value))}>
           {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} meses</option>)}
         </select>
       </div>
     </div>
     <BarChart data={ingresos} />
   </div>
   {dashStats && (
     <div className="gt-card" style={{ minWidth: 240 }}>
       <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 16 }}>Estado de membresías</p>
       <RingChart
         activas={dashStats.membresiasActivas}
         pendientes={dashStats.membresiasPendientes}
         vencidas={dashStats.membresiasVencidas}
       />
     </div>
   )}
 </div>

 {/* ─── Ingresos por mes (tabla detalle) ─ */}
 <div className="gt-card" style={{ marginBottom: 20 }}>
 <p className="gt-card-title" style={{ marginTop: 0 }}>Detalle de ingresos por mes</p>
 {errorI && <div className="gt-alert gt-alert-error">{errorI}</div>}
 {loadingI ? (
 <p className="gt-text-muted">Cargando...</p>
 ) : (
 <>
 <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 22, color: '#1B5E44' }}>
 Total: ${totalIngresos.toLocaleString('es-AR')}
 </div>
 {ingresos.length === 0 ? (
 <div className="gt-empty">Sin datos para el período seleccionado.</div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
 {ingresos.map(i => (
 <div key={i.mes}>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
 <span style={{ fontSize: 13, color: '#374151' }}>{i.mes}</span>
 <span style={{ fontSize: 13, fontWeight: 600 }}>${i.total.toLocaleString('es-AR')}</span>
 </div>
 <Barra valor={i.total} max={maxIngreso} color="#1B5E44" />
 </div>
 ))}
 </div>
 )}
 </>
 )}
 </div>
 {/* ─── Asistencias por día ─────────────── */}
 <div className="gt-card">
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
 <p className="gt-card-title" style={{ margin: 0 }}> Asistencias por día</p>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
 <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
 <label className="gt-label" style={{ margin: 0 }}>Desde</label>
 <input className="gt-input" type="date" style={{ width: 'auto' }} value={desde} onChange={e => setDesde(e.target.value)} />
 </div>
 <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
 <label className="gt-label" style={{ margin: 0 }}>Hasta</label>
 <input className="gt-input" type="date" style={{ width: 'auto' }} value={hasta} onChange={e => setHasta(e.target.value)} />
 </div>
 <button className="gt-btn gt-btn-primary" onClick={cargarAsistencias}>Consultar</button>
 </div>
 </div>
 {errorA && <div className="gt-alert gt-alert-error">{errorA}</div>}
 {loadingA ? (
 <p className="gt-text-muted">Cargando...</p>
 ) : (
 <>
 <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 22, color: '#1B5E44' }}>
 Total: {totalAsistencias.toLocaleString('es-AR')} ingresos
 </div>
 {asistencias.length === 0 ? (
 <div className="gt-empty">Sin registros para el período seleccionado.</div>
 ) : (
 <div className="gt-table-wrap">
 <table className="gt-table">
 <thead>
 <tr><th>Fecha</th><th>Ingresos</th><th style={{ width: '60%' }}>Distribución</th></tr>
 </thead>
 <tbody>
 {asistencias.map(a => (
 <tr key={a.fecha}>
 <td>{new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
 <td className="gt-fw-600">{a.total}</td>
 <td><Barra valor={a.total} max={maxAsist} color="#6366f1" /></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </>
 )}
 </div>

 {/* ─── Próximos a vencer ───────────────── */}
 <div className="gt-card" style={{ marginTop: 20 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <p className="gt-card-title" style={{ margin: 0 }}>Membresías próximas a vencer</p>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <label className="gt-label" style={{ margin: 0 }}>En los próximos</label>
 <select className="gt-select" style={{ width: 'auto' }} value={diasVencer} onChange={e => setDiasVencer(Number(e.target.value))}>
 {[7, 15, 30].map(d => <option key={d} value={d}>{d} días</option>)}
 </select>
 </div>
 </div>
 {proximos.length === 0 ? (
 <div className="gt-empty">No hay membresías próximas a vencer en ese período.</div>
 ) : (
 <div className="gt-table-wrap">
 <table className="gt-table">
 <thead><tr><th>Socio</th><th>DNI</th><th>Plan</th><th>Vence</th><th>Días restantes</th></tr></thead>
 <tbody>
 {proximos.map(p => (
 <tr key={p.socioId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/socios/${p.socioId}/perfil`)}>
 <td className="gt-fw-600">{p.nombre}</td>
 <td>{p.dni}</td>
 <td>{p.tipoMembresia}</td>
 <td>{new Date(p.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}</td>
 <td>
 <span className={`gt-badge ${p.diasRestantes <= 3 ? 'gt-badge-red' : p.diasRestantes <= 7 ? 'gt-badge-yellow' : 'gt-badge-green'}`}>
 {p.diasRestantes} días
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* ─── Sin asistencias ─────────────────── */}
 <div className="gt-card" style={{ marginTop: 20 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <p className="gt-card-title" style={{ margin: 0 }}>Socios sin asistencias recientes</p>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <label className="gt-label" style={{ margin: 0 }}>Sin venir hace más de</label>
 <select className="gt-select" style={{ width: 'auto' }} value={diasInactivo} onChange={e => setDiasInactivo(Number(e.target.value))}>
 {[7, 14, 30].map(d => <option key={d} value={d}>{d} días</option>)}
 </select>
 </div>
 </div>
 {sinAsist.length === 0 ? (
 <div className="gt-empty">Todos los socios tienen asistencias recientes.</div>
 ) : (
 <div className="gt-table-wrap">
 <table className="gt-table">
 <thead><tr><th>Socio</th><th>DNI</th><th>Última asistencia</th></tr></thead>
 <tbody>
 {sinAsist.map(s => (
 <tr key={s.socioId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/socios/${s.socioId}/perfil`)}>
 <td className="gt-fw-600">{s.nombre}</td>
 <td>{s.dni}</td>
 <td style={{ color: s.ultimaAsistencia === 'Nunca' ? '#DC2626' : '#6B7280' }}>
 {s.ultimaAsistencia === 'Nunca' ? 'Nunca asistió' :
 new Date(s.ultimaAsistencia + 'T00:00:00').toLocaleDateString('es-AR')}
 </td>
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
