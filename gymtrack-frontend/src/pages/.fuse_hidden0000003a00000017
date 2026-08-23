import { useState, useEffect } from 'react'
import { getIngresos, getAsistencias } from '../services/reporteService'
interface IngresoMes {
 mes: string
 total: number
}
interface AsistenciaDia {
 fecha: string
 total: number
}
// Fecha ISO sin hora para inputs type=date
function hoy() { return new Date().toISOString().slice(0, 10) }
function hace30() { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) }
// Mini barra de progreso proporcional
function Barra({ valor, max, color }: { valor: number; max: number; color: string }) {
 const pct = max === 0 ? 0 : Math.round((valor / max) * 100)
 return (
 <div style={{ background: '#F3F4F6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
 <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
 </div>
 )
}
export default function ReportesPage() {
 const [ingresos, setIngresos] = useState<IngresoMes[]>([])
 const [asistencias, setAsistencias] = useState<AsistenciaDia[]>([])
 const [meses, setMeses] = useState(6)
 const [desde, setDesde] = useState(hace30)
 const [hasta, setHasta] = useState(hoy)
 const [loadingI, setLoadingI] = useState(false)
 const [loadingA, setLoadingA] = useState(false)
 const [errorI, setErrorI] = useState<string | null>(null)
 const [errorA, setErrorA] = useState<string | null>(null)
 useEffect(() => { cargarIngresos() }, [meses])
 useEffect(() => { cargarAsistencias() }, [])
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
 const maxIngreso = Math.max(...ingresos.map(i => i.total), 1)
 const maxAsist = Math.max(...asistencias.map(a => a.total), 1)
 const totalIngresos = ingresos.reduce((acc, i) => acc + i.total, 0)
 const totalAsistencias = asistencias.reduce((acc, a) => acc + a.total, 0)
 return (
 <>
 <h1 className="gt-page-title">Reportes</h1>
 {/* ─── Ingresos por mes ─────────────────── */}
 <div className="gt-card" style={{ marginBottom: 20 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <p className="gt-card-title" style={{ margin: 0 }}> Ingresos por mes</p>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 <label className="gt-label" style={{ margin: 0 }}>Últimos</label>
 <select className="gt-select" style={{ width: 'auto' }} value={meses} onChange={e => setMeses(Number(e.target.value))}>
 {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} meses</option>)}
 </select>
 </div>
 </div>
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
 </>
 )
}
