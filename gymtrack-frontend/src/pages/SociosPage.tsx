import { useState, useEffect } from 'react'
import type { Socio } from '../types/Socio'
import {
 obtenerTodos,
 obtenerConInactivos,
 crearSocio,
 actualizarSocio,
 darDeBaja,
 reactivarSocio,
 eliminarPermanente,
} from '../services/socioService'
import SocioForm from '../components/SocioForm'
import SocioTabla from '../components/SocioTabla'
export default function SociosPage() {
 const [socios, setSocios] = useState<Socio[]>([])
 const [socioEditar, setSocioEditar] = useState<Socio | null>(null)
 const [mensaje, setMensaje] = useState('')
 const [error, setError] = useState('')
 const [verInactivos, setVerInactivos] = useState(false)
 const [busqueda, setBusqueda] = useState('')
 useEffect(() => { cargarSocios() }, [])
 const cargarSocios = async () => {
 try {
 setSocios(await obtenerConInactivos())
 } catch {
 setError('Error al cargar los socios')
 }
 }
 const handleGuardar = async (socio: Socio) => {
 try {
 socioEditar?.id
 ? await actualizarSocio(socioEditar.id, socio)
 : await crearSocio(socio)
 setMensaje(socioEditar?.id ? 'Socio actualizado' : 'Socio registrado')
 setSocioEditar(null)
 setError('')
 cargarSocios()
 } catch {
 setError('Error: el DNI ya existe o hay un problema con los datos')
 setMensaje('')
 }
 }
 const handleEliminar = async (id: number) => {
 try { await darDeBaja(id); setMensaje('Socio dado de baja'); cargarSocios() }
 catch { setError('Error al dar de baja al socio') }
 }
 const handleReactivar = async (id: number) => {
 try { await reactivarSocio(id); setMensaje('Socio reactivado correctamente'); cargarSocios() }
 catch { setError('Error al reactivar el socio') }
 }
 const handleEliminarPermanente = async (id: number) => {
 if (!confirm('ELIMINACIÓN PERMANENTE\n\nEsto borrará al socio y TODOS sus datos:\nmembresías, pagos, rutinas y asistencias.\n\n¿Estás segura? Esta acción no se puede deshacer.')) return
 try {
 await eliminarPermanente(id)
 setMensaje('Socio eliminado permanentemente junto con todos sus datos')
 cargarSocios()
 } catch (err: any) {
 setError(err?.response?.data?.error ?? 'Error al eliminar el socio')
 }
 }
 const sociosFiltrados = socios.filter(s => {
 const esInactivo = s.activo === false || s.estado === 'INACTIVO'
 if (!verInactivos && esInactivo) return false
 if (!busqueda) return true
 const q = busqueda.toLowerCase()
 return (
 s.nombre.toLowerCase().includes(q) ||
 s.apellido.toLowerCase().includes(q) ||
 s.dni.includes(q) ||
 (s.email ?? '').toLowerCase().includes(q)
 )
 })
 const activos = socios.filter(s => s.activo !== false && s.estado !== 'INACTIVO').length
 const inactivos = socios.length - activos
 return (
 <>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
 <h1 className="gt-page-title" style={{ margin: 0 }}>
 Socios
 <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7280', marginLeft: 12 }}>
 {activos} activos · {inactivos} inactivos
 </span>
 </h1>
 <button
 className="gt-btn gt-btn-secondary"
 style={{ fontSize: 13 }}
 onClick={() => setVerInactivos(v => !v)}
 >
 {verInactivos ? 'Ver solo activos' : 'Ver todos (con inactivos)'}
 </button>
 </div>
 {mensaje && (
 <div className="gt-alert gt-alert-success">
 {mensaje}
 <button onClick={() => setMensaje('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}></button>
 </div>
 )}
 {error && (
 <div className="gt-alert gt-alert-error">
 {error}
 <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}></button>
 </div>
 )}
 <SocioForm
 onGuardar={handleGuardar}
 socioEditar={socioEditar}
 onCancelar={() => setSocioEditar(null)}
 />
 <div style={{ margin: '12px 0' }}>
 <input
 className="gt-input"
 style={{ maxWidth: 380 }}
 type="text"
 placeholder="Buscar por nombre, apellido, DNI o email..."
 value={busqueda}
 onChange={e => setBusqueda(e.target.value)}
 />
 {busqueda && (
 <span style={{ marginLeft: 10, fontSize: 13, color: '#6B7280' }}>
 {sociosFiltrados.length} resultado{sociosFiltrados.length !== 1 ? 's' : ''}
 </span>
 )}
 </div>
 <SocioTabla
 socios={sociosFiltrados}
 onEditar={setSocioEditar}
 onEliminar={handleEliminar}
 onReactivar={handleReactivar}
 onEliminarPermanente={handleEliminarPermanente}
 />
 </>
 )
}
