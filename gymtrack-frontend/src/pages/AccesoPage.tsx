import { useState, useEffect } from 'react'
import { registrarCheckin, listarHoy } from '../services/asistenciaService'
interface Asistencia {
 id: number
 socioNombre: string
 socioDni: string
 hora: string
 tipo: string
 permitido: boolean
 observacion?: string
 conDeuda?: boolean
}
export default function AccesoPage() {
 const [busqueda, setBusqueda] = useState('')
 const tipo = 'ENTRADA'
 const [resultado, setResultado] = useState<any>(null)
 const [error, setError] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const [historial, setHistorial] = useState<Asistencia[]>([])
 useEffect(() => { cargarHoy() }, [])
 const cargarHoy = async () => {
 try { setHistorial(await listarHoy()) } catch {}
 }
 const handleCheckin = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!busqueda.trim()) { setError('Ingresá el DNI o ID del socio'); return }
 setError(null)
 setResultado(null)
 setLoading(true)
 // Si tiene <= 5 dígitos, lo tratamos como ID. Si es más largo (DNI argentino = 7-8 dígitos), como DNI.
 const trimmed = busqueda.trim()
 const isId = /^\d{1,5}$/.test(trimmed)
 const payload = isId
 ? { socioId: parseInt(trimmed), tipo }
 : { dni: trimmed, tipo }
 try {
 const data = await registrarCheckin(payload)
 setResultado(data)
 setBusqueda('')
 cargarHoy()
 } catch (err: any) {
 setError(err.response?.data?.message || 'Error al registrar el acceso')
 } finally {
 setLoading(false)
 }
 }
 return (
 <>
 <div className="gt-section-header">
 <h1 className="gt-page-title" style={{ margin: 0 }}> Control de Acceso</h1>
 </div>
 {/* Panel de checkin */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
 {/* Formulario */}
 <div className="gt-card">
 <p className="gt-card-title">Registrar ingreso</p>
 <form onSubmit={handleCheckin}>
 <div className="gt-form-group" style={{ marginBottom: 16 }}>
 <label className="gt-label">DNI o ID del socio</label>
 <input
 className="gt-input"
 value={busqueda}
 onChange={e => setBusqueda(e.target.value)}
 placeholder="Ej: 38.112.445 o 7"
 autoFocus
 />
 </div>
 <button type="submit" className="gt-btn gt-btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
 {loading ? 'Verificando...' : 'Registrar ingreso'}
 </button>
 </form>
 {/* Resultado */}
 {resultado && (
 <div className={`gt-alert ${resultado.permitido ? 'gt-alert-success' : 'gt-alert-error'}`} style={{ marginTop: 16 }}>
 <strong>{resultado.permitido ? 'Acceso permitido' : 'Acceso denegado'}</strong>
 <br />
 <span>{resultado.socioNombre} — DNI: {resultado.socioDni}</span>
 {resultado.observacion && <><br /><span style={{ fontSize: 12 }}>{resultado.observacion}</span></>}
 </div>
 )}
 {error && <div className="gt-alert gt-alert-error" style={{ marginTop: 16 }}>{error}</div>}
 </div>
 {/* Resumen del día */}
 <div className="gt-card">
 <p className="gt-card-title">Asistentes hoy — {new Date().toLocaleDateString('es-AR')}</p>
 <div style={{ fontSize: 40, fontWeight: 700, color: '#1B5E44', textAlign: 'center', padding: '16px 0' }}>
 {historial.filter(a => a.tipo === 'ENTRADA' && a.permitido).length}
 </div>
 <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 13, margin: 0 }}>ingresos registrados</p>
 </div>
 </div>
 {/* Historial del día */}
 <div className="gt-card">
 <p className="gt-card-title">Registro del día</p>
 {historial.length === 0 ? (
 <div className="gt-empty">No hay registros para hoy todavía.</div>
 ) : (
 <div className="gt-table-wrap">
 <table className="gt-table">
 <thead>
 <tr>
 <th>Hora</th>
 <th>Socio</th>
 <th>DNI</th>
 <th>Tipo</th>
 <th>Acceso</th>
 </tr>
 </thead>
 <tbody>
 {historial.map(a => (
 <tr key={a.id}>
 <td>{String(a.hora).slice(0, 5)}</td>
 <td className="gt-fw-600">{a.socioNombre}</td>
 <td>{a.socioDni}</td>
 <td>
 <span className={a.tipo === 'ENTRADA' ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-blue'}>
 {a.tipo}
 </span>
 </td>
 <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
 <span className={a.permitido ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-red'}>
 {a.permitido ? 'Permitido' : 'Denegado'}
 </span>
 {a.conDeuda && (
 <span className="gt-badge gt-badge-yellow" title="Ingresó con deuda pendiente">
 CON DEUDA
 </span>
 )}
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
