import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import type { Rutina, Ejercicio, EjercicioRequestDTO } from '../types/Rutina'
import {
 obtenerRutina,
 obtenerEjercicios,
 agregarEjercicio,
 eliminarEjercicio,
} from '../services/rutinaService'
import { listarMaquinas, type Maquina as MaquinaCatalogo } from '../services/maquinaService'
import { useAuth } from '../context/AuthContext'
const ejVacio: EjercicioRequestDTO = {
 nombreEjercicio: '',
 series: undefined,
 repeticiones: undefined,
 pesoKg: undefined,
 descansoSeg: undefined,
 notas: '',
}
export default function RutinasDetail() {
 const { id } = useParams<{ id: string }>()
 const [searchParams] = useSearchParams()
 const navigate = useNavigate()
 const { user } = useAuth()
 const esAdmin = user?.rol === 'ADMIN' || user?.rol === 'EMPLEADO'
 // SOCIO usa su propio id; ADMIN toma el socioId del query param (null si es rutina genérica)
 const esGeneral = searchParams.get('general') === 'true'
 const socioId: number | null = esGeneral
 ? null
 : esAdmin
  ? (searchParams.get('socioId') ? Number(searchParams.get('socioId')) : null)
  : (user?.socioId ?? null)
 const [rutina, setRutina] = useState<Rutina | null>(null)
 const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
 const [catalogo, setCatalogo] = useState<MaquinaCatalogo[]>([])
 const [error, setError] = useState<string | null>(null)
 const [cargando, setCargando] = useState(true)
 // Estado del formulario de nuevo ejercicio
 const [mostrarForm, setMostrarForm] = useState(false)
 const [nuevoEj, setNuevoEj] = useState<EjercicioRequestDTO>(ejVacio)
 const [guardandoEj, setGuardandoEj] = useState(false)
 useEffect(() => {
 if (!id) return
 Promise.all([
 obtenerRutina(Number(id), socioId),
 obtenerEjercicios(Number(id), socioId),
 listarMaquinas(true),
 ])
 .then(([r, ejs, cat]) => { setRutina(r as Rutina); setEjercicios(ejs as Ejercicio[]); setCatalogo(cat) })
 .catch(() => setError('No se pudo cargar la rutina'))
 .finally(() => setCargando(false))
 }, [id])
 const handleAgregarEj = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!nuevoEj.nombreEjercicio.trim()) return
 try {
 setGuardandoEj(true)
 const ej = await agregarEjercicio(Number(id), socioId, nuevoEj)
 setEjercicios(prev => [...prev, ej])
 setNuevoEj(ejVacio)
 setMostrarForm(false)
 } catch {
 setError('No se pudo agregar el ejercicio')
 } finally {
 setGuardandoEj(false)
 }
 }
 const handleEliminarEj = async (ejId: number) => {
 if (!confirm('¿Eliminar este ejercicio?')) return
 try {
 await eliminarEjercicio(Number(id), ejId, socioId)
 setEjercicios(prev => prev.filter(e => e.id !== ejId))
 } catch {
 setError('No se pudo eliminar el ejercicio')
 }
 }
 if (cargando) return <p className="gt-text-muted">Cargando...</p>
 if (!rutina) return <div className="gt-alert gt-alert-error">{error ?? 'Rutina no encontrada.'}</div>
 const linkEditar = esGeneral
 ? `/rutinas/editar/${rutina.id}?general=true`
 : esAdmin && socioId
  ? `/rutinas/editar/${rutina.id}?socioId=${socioId}`
  : `/rutinas/editar/${rutina.id}`
 return (
 <>
 {/* ── Cabecera ── */}
 <div style={{ marginBottom: 8 }}>
 <button className="gt-btn gt-btn-secondary" style={{ marginBottom: 10 }} onClick={() => navigate('/rutinas')}>
 ← Volver
 </button>
 <div className="gt-section-header" style={{ marginBottom: 0 }}>
 <div>
 <h1 className="gt-page-title" style={{ margin: 0 }}>{rutina.nombre}</h1>
 {esAdmin && rutina.socioId && (
 <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>
 {rutina.socioNombre ?? `Socio #${rutina.socioId}`}
 </p>
 )}
 </div>
 <Link to={linkEditar} className="gt-btn gt-btn-secondary"> Editar</Link>
 </div>
 </div>
 {error && (
 <div className="gt-alert gt-alert-error">
 {error}
 <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}></button>
 </div>
 )}
 {/* ── Info básica ── */}
 <div className="gt-card" style={{ marginBottom: 20 }}>
 {rutina.descripcion ? (
 <p style={{ margin: '0 0 12px', color: '#374151' }}>{rutina.descripcion}</p>
 ) : (
 <p style={{ margin: '0 0 12px', color: '#9CA3AF', fontStyle: 'italic' }}>Sin descripción</p>
 )}
 <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
 Creada el: {rutina.fechaCreacion?.slice(0, 10)}
 </p>
 </div>
 {/* ── Ejercicios ── */}
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
 <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
 Ejercicios{' '}
 <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7280' }}>
 ({ejercicios.length})
 </span>
 </h2>
 <button
 className="gt-btn gt-btn-primary"
 style={{ fontSize: 13 }}
 onClick={() => setMostrarForm(v => !v)}
 >
 {mostrarForm ? 'Cancelar' : '+ Agregar ejercicio'}
 </button>
 </div>
 {/* ── Formulario nuevo ejercicio ── */}
 {mostrarForm && (
 <div className="gt-card" style={{ marginBottom: 16 }}>
 <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14 }}>Nuevo ejercicio</p>
 <form onSubmit={handleAgregarEj}>
 <div className="gt-form-grid">
 <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
 <label className="gt-label">Ejercicio *</label>
 <input
 className="gt-input"
 value={nuevoEj.nombreEjercicio}
 onChange={e => setNuevoEj(p => ({ ...p, nombreEjercicio: e.target.value }))}
 placeholder="Ej: Sentadilla con barra"
 maxLength={100}
 required
 />
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Series</label>
 <input
 className="gt-input"
 type="number"
 min={1}
 value={nuevoEj.series ?? ''}
 onChange={e => setNuevoEj(p => ({ ...p, series: e.target.value ? Number(e.target.value) : undefined }))}
 placeholder="Ej: 4"
 />
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Repeticiones</label>
 <input
 className="gt-input"
 type="number"
 min={1}
 value={nuevoEj.repeticiones ?? ''}
 onChange={e => setNuevoEj(p => ({ ...p, repeticiones: e.target.value ? Number(e.target.value) : undefined }))}
 placeholder="Ej: 10"
 />
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Peso (kg)</label>
 <input
 className="gt-input"
 type="number"
 min={0}
 step={0.5}
 value={nuevoEj.pesoKg ?? ''}
 onChange={e => setNuevoEj(p => ({ ...p, pesoKg: e.target.value ? Number(e.target.value) : undefined }))}
 placeholder="Ej: 60"
 />
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Descanso (seg)</label>
 <input
 className="gt-input"
 type="number"
 min={0}
 step={15}
 value={nuevoEj.descansoSeg ?? ''}
 onChange={e => setNuevoEj(p => ({ ...p, descansoSeg: e.target.value ? Number(e.target.value) : undefined }))}
 placeholder="Ej: 90"
 />
 </div>
 <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
 <label className="gt-label">Notas</label>
 <input
 className="gt-input"
 value={nuevoEj.notas ?? ''}
 onChange={e => setNuevoEj(p => ({ ...p, notas: e.target.value }))}
 placeholder="Ej: Descanso 90s entre series"
 maxLength={200}
 />
 </div>
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 <button type="submit" className="gt-btn gt-btn-primary" disabled={guardandoEj}>
 {guardandoEj ? 'Guardando...' : 'Agregar'}
 </button>
 <button type="button" className="gt-btn gt-btn-secondary" onClick={() => { setMostrarForm(false); setNuevoEj(ejVacio) }}>
 Cancelar
 </button>
 </div>
 </form>
 </div>
 )}
 {/* ── Lista de ejercicios ── */}
 {ejercicios.length === 0 ? (
 <div className="gt-empty">
 <p>Esta rutina todavía no tiene ejercicios.</p>
 <button className="gt-btn gt-btn-primary" style={{ marginTop: 12 }} onClick={() => setMostrarForm(true)}>
 Agregar primer ejercicio
 </button>
 </div>
 ) : (
 <div className="gt-table-wrap">
 <table className="gt-table">
 <thead>
 <tr>
 <th style={{ width: 40 }}>#</th>
 <th style={{ width: 72 }}></th>
 <th>Ejercicio</th>
 <th style={{ width: 70 }}>Series</th>
 <th style={{ width: 70 }}>Reps</th>
 <th style={{ width: 90 }}>Peso (kg)</th>
 <th style={{ width: 90 }}>Descanso</th>
 <th>Notas</th>
 <th style={{ width: 50 }}></th>
 </tr>
 </thead>
 <tbody>
 {ejercicios.map(ej => {
 // Resolver nombres de máquinas requeridas
 const maquinasReq = (ej.maquinaIds ?? [])
  .map(mid => { const c = catalogo.find(x => x.id === mid); return c ? `${c.nroMaquina} ${c.nombre}` : null })
  .filter(Boolean) as string[]
 return (
 <tr key={ej.id}>
 <td style={{ color: '#6B7280', fontSize: 13 }}>{ej.orden}</td>
 <td>
 {ej.imagenUrl ? (
  <img src={ej.imagenUrl} alt={ej.nombreEjercicio}
   style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }} />
 ) : (
  <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#D1D5DB' }}>
   {ej.esMaquina ? '⚙' : '💪'}
  </div>
 )}
 </td>
 <td>
 <span className="gt-fw-600">{ej.nombreEjercicio}</span>
 <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
 {ej.esMaquina && (
 <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>⚙ Máquina</span>
 )}
 {ej.grupoMuscular && (
 <span style={{ fontSize: 11, background: '#EFF6FF', color: '#2E75B6', borderRadius: 4, padding: '1px 6px' }}>{ej.grupoMuscular}</span>
 )}
 </div>
 {ej.descripcionEjercicio && (
 <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280', maxWidth: 260 }}>{ej.descripcionEjercicio}</p>
 )}
 {maquinasReq.length > 0 && (
 <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
  <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>REQUIERE:</span>
  {maquinasReq.map(m => (
  <span key={m} style={{ fontSize: 11, background: '#FEF9C3', color: '#854D0E', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>⚙ {m}</span>
  ))}
 </div>
 )}
 </td>
 <td>{ej.series ?? '—'}</td>
 <td>{ej.repeticiones ?? '—'}</td>
 <td>{ej.pesoKg != null ? `${ej.pesoKg} kg` : '—'}</td>
 <td>{ej.descansoSeg != null ? `${ej.descansoSeg}s` : '—'}</td>
 <td style={{ fontSize: 13, color: '#6B7280' }}>{ej.notas || '—'}</td>
 <td>
 <button
 className="gt-btn gt-btn-danger"
 style={{ fontSize: 11, padding: '3px 8px' }}
 onClick={() => handleEliminarEj(ej.id!)}
 >
 </button>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 )}
 </>
 )
}
