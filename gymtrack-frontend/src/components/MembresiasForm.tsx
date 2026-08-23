import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TarifaCreateDTO } from '../types/Tarifa'
import { crearTarifa } from '../services/tarifaService'
export default function MembresiasForm() {
 const navigate = useNavigate()
 const [nombre, setNombre] = useState('')
 const [duracionDias, setDuracionDias] = useState<number | ''>(30)
 const [precio, setPrecio] = useState<number | ''>(0)
 const [incluye, setIncluye] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [guardando, setGuardando] = useState(false)
 // El "tipo" se genera automáticamente desde el nombre (MAYÚSCULAS_SIN_ESPACIOS)
 const tipoGenerado = nombre.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
 if (!duracionDias || duracionDias <= 0) { setError('La duración debe ser mayor a 0 días'); return }
 if (!precio || precio <= 0) { setError('El precio debe ser mayor a cero'); return }
 const dto: TarifaCreateDTO = {
 tipo: tipoGenerado,
 nombre: nombre.trim(),
 precio: Number(precio),
 duracionDias: Number(duracionDias),
 incluye: incluye.trim() || undefined,
 }
 try {
 setGuardando(true)
 await crearTarifa(dto)
 navigate('/membresias')
 } catch {
 setError('Error al crear el plan. Es posible que ya exista uno con ese nombre.')
 } finally {
 setGuardando(false)
 }
 }
 return (
 <>
 <div className="gt-section-header">
 <h1 className="gt-page-title" style={{ margin: 0 }}>Nuevo Plan de Membresía</h1>
 </div>
 <div className="gt-card">
 {error && (
 <div className="gt-alert gt-alert-error">
 {error}
 <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}></button>
 </div>
 )}
 <form onSubmit={handleSubmit}>
 <div className="gt-form-grid">
 <div className="gt-form-group">
 <label className="gt-label">Nombre del plan *</label>
 <input
 className="gt-input"
 type="text"
 value={nombre}
 onChange={e => setNombre(e.target.value)}
 placeholder="Ej: Plan Quincenal"
 required
 />
 {tipoGenerado && (
 <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>
 Código interno: <strong>{tipoGenerado}</strong>
 </p>
 )}
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Duración (días) *</label>
 <input
 className="gt-input"
 type="number"
 value={duracionDias}
 onChange={e => setDuracionDias(Number(e.target.value))}
 min={1}
 placeholder="Ej: 15"
 required
 />
 <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>
 El sistema calcula la fecha de vencimiento automáticamente.
 </p>
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Precio ($) *</label>
 <input
 className="gt-input"
 type="number"
 value={precio}
 onChange={e => setPrecio(Number(e.target.value))}
 min={0}
 step={0.01}
 placeholder="Ej: 8000"
 required
 />
 </div>
 <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
 <label className="gt-label">¿Qué incluye? (opcional)</label>
 <textarea
 className="gt-textarea"
 value={incluye}
 onChange={e => setIncluye(e.target.value)}
 placeholder="Ej: Acceso al gimnasio por 15 días. Clases grupales incluidas."
 rows={2}
 />
 </div>
 </div>
 <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
 <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
 {guardando ? 'Guardando...' : 'Crear Plan'}
 </button>
 <button type="button" className="gt-btn gt-btn-secondary" onClick={() => navigate('/membresias')}>
 Cancelar
 </button>
 </div>
 </form>
 </div>
 </>
 )
}
