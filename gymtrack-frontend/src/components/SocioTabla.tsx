import { Link } from 'react-router-dom'
import type { Socio } from '../types/Socio'
interface Props {
 socios: Socio[]
 onEditar: (socio: Socio) => void
 onEliminar: (id: number) => void
 onReactivar: (id: number) => void
 onEliminarPermanente: (id: number) => void
 membresiaMap?: Map<number, string>
}
// Formatea "2026-08-22T15:30:00" → "22/08/2026"
function formatFecha(iso?: string): string {
 if (!iso) return '—'
 const d = new Date(iso)
 return d.toLocaleDateString('es-AR')
}
const SocioTabla = ({ socios, onEditar, onEliminar, onReactivar, onEliminarPermanente, membresiaMap }: Props) => {
 if (socios.length === 0) {
 return <div className="gt-empty">No hay socios registrados aún.</div>
 }
 return (
 <div className="gt-table-wrap">
 <table className="gt-table">
 <thead>
 <tr>
 <th>#ID</th>
 <th>Nombre y Apellido</th>
 <th>DNI</th>
 <th>Email</th>
 <th>Teléfono</th>
 <th>Alta</th>
 <th>Últ. modif.</th>
 <th>Estado</th>
 <th>Acciones</th>
 </tr>
 </thead>
 <tbody>
 {socios.map(s => {
 const inactivo = s.activo === false || s.estado === 'INACTIVO'
 const estadoMem = membresiaMap?.get(s.id!) ?? null
 const memBadge = () => {
   if (!estadoMem || estadoMem === 'SIN_MEMBRESIA') {
     return <span className="gt-badge gt-badge-gray" style={{ fontSize: 11 }}>Sin membresía</span>
   }
   const cfg: Record<string, { cls: string; label: string }> = {
     ACTIVA:         { cls: 'gt-badge gt-badge-green', label: '✓ Al día' },
     PENDIENTE_PAGO: { cls: 'gt-badge gt-badge-yellow', label: '⚠ Pago pendiente' },
     VENCIDA:        { cls: 'gt-badge gt-badge-red',    label: '✕ Vencida' },
     CANCELADA:      { cls: 'gt-badge gt-badge-gray',   label: 'Cancelada' },
   }
   const c = cfg[estadoMem]
   return c ? <span className={c.cls} style={{ fontSize: 11 }}>{c.label}</span> : null
 }
 return (
 <tr key={s.id} style={{ opacity: inactivo ? 0.6 : 1 }}>
 <td style={{ fontWeight: 700, color: '#2E75B6', fontSize: 13 }}>
 #{s.id}
 </td>
 <td className="gt-fw-600">{s.nombre} {s.apellido}</td>
 <td>{s.dni}</td>
 <td>{s.email || '—'}</td>
 <td>{s.telefono || '—'}</td>
 <td style={{ fontSize: 12, color: '#6B7280' }}>{formatFecha(s.fechaCreacion)}</td>
 <td style={{ fontSize: 12, color: '#6B7280' }}>{formatFecha(s.fechaModificacion)}</td>
 <td>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
   <span className={inactivo ? 'gt-badge gt-badge-red' : 'gt-badge gt-badge-green'}>
     {inactivo ? 'INACTIVO' : 'ACTIVO'}
   </span>
   {!inactivo && memBadge()}
 </div>
 </td>
 <td>
 <div style={{ display: 'flex', gap: 6 }}>
 <Link
 to={`/socios/${s.id}/perfil`}
 className="gt-btn gt-btn-secondary"
 style={{ fontSize: 12 }}
 >
 Perfil
 </Link>
 {!inactivo && (
 <button className="gt-btn gt-btn-secondary" onClick={() => onEditar(s)}>
 Editar
 </button>
 )}
 {inactivo ? (
 <>
 <button
 className="gt-btn gt-btn-secondary"
 style={{ color: '#16A34A', borderColor: '#16A34A' }}
 onClick={() => onReactivar(s.id!)}
 >
 Reactivar
 </button>
 <button
 className="gt-btn gt-btn-danger"
 style={{ fontSize: 11 }}
 onClick={() => onEliminarPermanente(s.id!)}
 >
 Eliminar
 </button>
 </>
 ) : (
 <button className="gt-btn gt-btn-danger" onClick={() => onEliminar(s.id!)}>
 Dar de baja
 </button>
 )}
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 )
}
export default SocioTabla
