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
import { listarMembresias } from '../../membresias/services/membresiaService'
import SocioForm from '../components/SocioForm'
import SocioTabla from '../components/SocioTabla'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useToast } from '../../../shared/hooks/useToast'
export default function SociosPage() {
 const toast = useToast()
 const [socios, setSocios] = useState<Socio[]>([])
 const [membresiaMap, setMembresiaMap] = useState<Map<number, string>>(new Map())
 const [socioEditar, setSocioEditar] = useState<Socio | null>(null)
 const [mensaje, setMensaje] = useState('')
 const [error, setError] = useState('')
 const [verInactivos, setVerInactivos] = useState(false)
 const [busqueda, setBusqueda] = useState('')
 const [confirmarEliminarId, setConfirmarEliminarId] = useState<number | null>(null)
 const [pagina, setPagina] = useState(1)
 const POR_PAGINA = 20
 useEffect(() => { cargarSocios() }, [])
 const cargarSocios = async () => {
 try {
 const [sociosData, membresiasData] = await Promise.all([
   obtenerConInactivos(),
   listarMembresias(),
 ])
 setSocios(sociosData)
 const prioridad: Record<string, number> = { ACTIVA: 4, PENDIENTE_PAGO: 3, VENCIDA: 2, CANCELADA: 1 }
 const mapa = new Map<number, string>()
 for (const m of membresiasData) {
   const sid = m.socioId
   const actual = mapa.get(sid)
   const estadoActual = (m.estadoMembresia as string) ?? ''
   if (!actual || (prioridad[estadoActual] ?? 0) > (prioridad[actual] ?? 0)) {
     mapa.set(sid, estadoActual)
   }
 }
 setMembresiaMap(mapa)
 } catch {
 setError('Error al cargar los socios')
 }
 }
 const handleGuardar = async (socio: Socio) => {
 const esEdicion = !!socioEditar?.id
 try {
 esEdicion
 ? await actualizarSocio(socioEditar!.id!, socio)
 : await crearSocio(socio)
 toast.success(esEdicion ? 'Socio actualizado' : 'Socio registrado con éxito',
   `${socio.nombre} ${socio.apellido}`)
 setSocioEditar(null)
 setError('')
 setMensaje('')
 cargarSocios()
 } catch {
 const msg = 'El DNI ya existe o hay un problema con los datos'
 setError(msg)
 toast.error('Error al guardar', msg)
 setMensaje('')
 }
 }
 const handleEliminar = async (id: number) => {
 try { await darDeBaja(id); toast.success('Socio dado de baja'); cargarSocios() }
 catch { toast.error('Error', 'No se pudo dar de baja al socio') }
 }
 const handleReactivar = async (id: number) => {
 try { await reactivarSocio(id); toast.success('Socio reactivado correctamente'); cargarSocios() }
 catch { toast.error('Error', 'No se pudo reactivar el socio') }
 }
 const handleEliminarPermanente = (id: number) => { setConfirmarEliminarId(id) }
 const confirmarEliminar = async () => {
   if (confirmarEliminarId === null) return
   const id = confirmarEliminarId
   setConfirmarEliminarId(null)
   try {
     await eliminarPermanente(id)
     toast.success('Socio eliminado', 'El socio y todos sus datos fueron eliminados permanentemente')
     cargarSocios()
   } catch (err: any) {
     toast.error('Error al eliminar', err?.response?.data?.error ?? 'No se pudo eliminar el socio')
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
 const totalPaginas = Math.max(1, Math.ceil(sociosFiltrados.length / POR_PAGINA))
 const paginaActual = Math.min(pagina, totalPaginas)
 const sociosPagina = sociosFiltrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
 return (
 <>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
 <h1 className="gt-page-title" style={{ margin: 0 }}>
 Socios
 <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7280', marginLeft: 12 }}>
 {activos} activos · {inactivos} inactivos
 </span>
 </h1>
 <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13 }} onClick={() => setVerInactivos(v => !v)}>
 {verInactivos ? 'Ver solo activos' : 'Ver todos (con inactivos)'}
 </button>
 </div>
 {mensaje && <div className="gt-alert gt-alert-success">{mensaje}<button onClick={() => setMensaje('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}></button></div>}
 {error && <div className="gt-alert gt-alert-error">{error}<button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}></button></div>}
 <SocioForm onGuardar={handleGuardar} socioEditar={socioEditar} onCancelar={() => setSocioEditar(null)} />
 <div style={{ margin: '12px 0' }}>
 <input className="gt-input" style={{ maxWidth: 380 }} type="text" placeholder="Buscar por nombre, apellido, DNI o email..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1) }} />
 {busqueda && <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)' }}>{sociosFiltrados.length} resultado{sociosFiltrados.length !== 1 ? 's' : ''}</span>}
 </div>
 <SocioTabla socios={sociosPagina} onEditar={setSocioEditar} onEliminar={handleEliminar} onReactivar={handleReactivar} onEliminarPermanente={handleEliminarPermanente} membresiaMap={membresiaMap} />
 {totalPaginas > 1 && (
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
 <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13, padding: '4px 12px' }} disabled={paginaActual === 1} onClick={() => setPagina(p => p - 1)}>← Anterior</button>
 <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Página {paginaActual} de {totalPaginas}<span style={{ marginLeft: 8, color: 'var(--text-xmuted)' }}>({sociosFiltrados.length} socios)</span></span>
 <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13, padding: '4px 12px' }} disabled={paginaActual === totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente →</button>
 </div>
 )}
 <ConfirmModal open={confirmarEliminarId !== null} title="Eliminar socio permanentemente" message={`Esta acción borrará al socio y TODOS sus datos: membresías, pagos, rutinas y asistencias. No se puede deshacer.`} confirmLabel="Eliminar permanentemente" cancelLabel="Cancelar" danger onConfirm={confirmarEliminar} onCancel={() => setConfirmarEliminarId(null)} />
 </>
 )
}
