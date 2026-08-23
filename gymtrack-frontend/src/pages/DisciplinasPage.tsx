import { useState, useEffect } from 'react'
import { listarDisciplinas, crearDisciplina, actualizarDisciplina, desactivarDisciplina } from '../services/disciplinaService'
interface Disciplina {
 id?: number
 nombre: string
 descripcion: string
 instructor: string
 horario: string
 cupoMaximo: number | ''
 activa: boolean
}
const VACIO: Disciplina = { nombre: '', descripcion: '', instructor: '', horario: '', cupoMaximo: '', activa: true }
export default function DisciplinasPage() {
 const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
 const [form, setForm] = useState<Disciplina>(VACIO)
 const [editando, setEditando] = useState<number | null>(null)
 const [error, setError] = useState<string | null>(null)
 const [exito, setExito] = useState<string | null>(null)
 useEffect(() => { cargar() }, [])
 const cargar = async () => {
 try { setDisciplinas(await listarDisciplinas(false)) } catch {}
 }
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 if (!form.nombre) { setError('El nombre es obligatorio'); return }
 try {
 if (editando !== null) {
 await actualizarDisciplina(editando, form)
 setExito('Disciplina actualizada')
 } else {
 await crearDisciplina(form)
 setExito('Disciplina creada')
 }
 setForm(VACIO); setEditando(null); setError(null); cargar()
 } catch { setError('Error al guardar la disciplina') }
 }
 const handleEditar = (d: any) => {
 setForm(d); setEditando(d.id); setExito(null); setError(null)
 }
 const handleDesactivar = async (id: number) => {
 try { await desactivarDisciplina(id); setExito('Disciplina desactivada'); cargar() }
 catch { setError('Error al desactivar') }
 }
 return (
 <>
 <h1 className="gt-page-title">Disciplinas</h1>
 {exito && <div className="gt-alert gt-alert-success">{exito}<button onClick={() => setExito(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}></button></div>}
 {error && <div className="gt-alert gt-alert-error">{error}<button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}></button></div>}
 {/* Formulario */}
 <div className="gt-card" style={{ marginBottom: 20 }}>
 <p className="gt-card-title">{editando !== null ? 'Editar disciplina' : 'Nueva disciplina'}</p>
 <form onSubmit={handleSubmit}>
 <div className="gt-form-grid">
 <div className="gt-form-group">
 <label className="gt-label">Nombre *</label>
 <input className="gt-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: CrossFit" />
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Instructor</label>
 <input className="gt-input" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} placeholder="Nombre del profesor" />
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Horario</label>
 <input className="gt-input" value={form.horario} onChange={e => setForm({ ...form, horario: e.target.value })} placeholder="Ej: Lunes y Miércoles 18:00" />
 </div>
 <div className="gt-form-group">
 <label className="gt-label">Cupo máximo</label>
 <input className="gt-input" type="number" value={form.cupoMaximo} onChange={e => setForm({ ...form, cupoMaximo: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Ej: 20" />
 </div>
 <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
 <label className="gt-label">Descripción</label>
 <textarea className="gt-textarea" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción de la disciplina" />
 </div>
 </div>
 <div style={{ display: 'flex', gap: 8 }}>
 <button type="submit" className="gt-btn gt-btn-primary">{editando !== null ? 'Actualizar' : 'Crear disciplina'}</button>
 {editando !== null && <button type="button" className="gt-btn gt-btn-secondary" onClick={() => { setForm(VACIO); setEditando(null) }}>Cancelar</button>}
 </div>
 </form>
 </div>
 {/* Lista */}
 <div className="gt-table-wrap">
 <table className="gt-table">
 <thead><tr><th>Nombre</th><th>Instructor</th><th>Horario</th><th>Cupo</th><th>Estado</th><th>Acciones</th></tr></thead>
 <tbody>
 {disciplinas.length === 0 ? (
 <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF', padding: 32 }}>No hay disciplinas registradas</td></tr>
 ) : disciplinas.map((d: any) => (
 <tr key={d.id}>
 <td className="gt-fw-600">{d.nombre}</td>
 <td>{d.instructor || '—'}</td>
 <td>{d.horario || '—'}</td>
 <td>{d.cupoMaximo ?? '—'}</td>
 <td><span className={d.activa ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-gray'}>{d.activa ? 'Activa' : 'Inactiva'}</span></td>
 <td>
 <div style={{ display: 'flex', gap: 6 }}>
 <button className="gt-btn gt-btn-secondary" onClick={() => handleEditar(d)}>Editar</button>
 {d.activa && <button className="gt-btn gt-btn-danger" onClick={() => handleDesactivar(d.id)}>Desactivar</button>}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </>
 )
}
