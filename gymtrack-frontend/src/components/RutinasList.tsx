import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Rutina } from '../types/Rutina'
import { obtenerRutinas, obtenerTodasRutinas, obtenerRutinasGenerales, eliminarRutina } from '../services/rutinaService'
import { useAuth } from '../context/AuthContext'

type Tab = 'personalizadas' | 'genericas'

export default function RutinasList() {
 const { user } = useAuth()
 const esAdmin = user?.rol === 'ADMIN' || user?.rol === 'EMPLEADO'
 const socioId = user?.socioId ?? null
 const [rutinas, setRutinas] = useState<Rutina[]>([])
 const [rutinasGenerales, setRutinasGenerales] = useState<Rutina[]>([])
 const [tab, setTab] = useState<Tab>('personalizadas')
 const [error, setError] = useState<string | null>(null)
 const [cargando, setCargando] = useState(true)

 useEffect(() => { cargar() }, [])

 const cargar = async () => {
  try {
   if (esAdmin) {
    const [todas, generales] = await Promise.all([
     obtenerTodasRutinas(),
     obtenerRutinasGenerales(),
    ])
    setRutinas(todas)
    setRutinasGenerales(generales)
   } else if (socioId) {
    setRutinas(await obtenerRutinas(socioId))
   }
  } catch {
   setError('Error al cargar las rutinas')
  } finally {
   setCargando(false)
  }
 }

 const handleEliminar = async (r: Rutina) => {
  if (!confirm('¿Eliminar esta rutina?')) return
  const sid = r.socioId ?? null
  try {
   await eliminarRutina(r.id!, sid)
   if (r.socioId === null) {
    setRutinasGenerales(prev => prev.filter(x => x.id !== r.id))
   } else {
    setRutinas(prev => prev.filter(x => x.id !== r.id))
   }
  } catch {
   setError('No se pudo eliminar la rutina')
  }
 }

 const linkVer = (r: Rutina) => {
  if (r.socioId === null) return `/rutinas/${r.id}?general=true`
  return esAdmin ? `/rutinas/${r.id}?socioId=${r.socioId}` : `/rutinas/${r.id}`
 }
 const linkEditar = (r: Rutina) => {
  if (r.socioId === null) return `/rutinas/editar/${r.id}?general=true`
  return esAdmin ? `/rutinas/editar/${r.id}?socioId=${r.socioId}` : `/rutinas/editar/${r.id}`
 }

 const lista = tab === 'genericas' ? rutinasGenerales : rutinas

 const tabStyle = (t: Tab) => ({
  padding: '8px 20px',
  borderRadius: '8px 8px 0 0',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: tab === t ? 700 : 400,
  background: tab === t ? '#1B5E44' : '#F3F4F6',
  color: tab === t ? '#fff' : '#374151',
 })

 return (
  <>
   <div className="gt-section-header">
    <h1 className="gt-page-title" style={{ margin: 0 }}>Rutinas</h1>
    <Link to="/rutinas/nueva" className="gt-btn gt-btn-primary">+ Nueva rutina</Link>
   </div>

   {error && <div className="gt-alert gt-alert-error">{error}</div>}

   {/* Tabs (sólo admin ve las dos pestañas) */}
   {esAdmin && (
    <div style={{ display: 'flex', gap: 4, marginBottom: 0, marginTop: 8 }}>
     <button style={tabStyle('personalizadas')} onClick={() => setTab('personalizadas')}>
      Personalizadas
      <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>({rutinas.length})</span>
     </button>
     <button style={tabStyle('genericas')} onClick={() => setTab('genericas')}>
      Genéricas
      <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.8 }}>({rutinasGenerales.length})</span>
     </button>
    </div>
   )}

   {cargando ? (
    <p className="gt-text-muted">Cargando...</p>
   ) : lista.length === 0 ? (
    <div className="gt-empty">
     {tab === 'genericas'
      ? <p>No hay rutinas genéricas todavía. Creá una sin asignar a un socio.</p>
      : esAdmin
       ? <p>No hay rutinas personalizadas registradas.</p>
       : <p>Todavía no tenés rutinas.</p>
     }
     <Link to="/rutinas/nueva" className="gt-btn gt-btn-primary" style={{ marginTop: 12 }}>
      Crear rutina
     </Link>
    </div>
   ) : (
    <div className="gt-card-list" style={{ marginTop: esAdmin ? 0 : 12 }}>
     {lista.map(r => (
      <div key={r.id} className="gt-list-card">
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
         <p className="gt-list-card-title">{r.nombre}</p>
         {r.descripcion && <p className="gt-list-card-sub">{r.descripcion}</p>}
         <p className="gt-text-muted gt-mt-4">
          Creada: {r.fechaCreacion?.slice(0, 10)}
          {esAdmin && r.socioId && (
           <span style={{ marginLeft: 12, color: '#2E75B6', fontWeight: 600 }}>
            {r.socioNombre ?? `Socio #${r.socioId}`}
           </span>
          )}
          {r.socioId === null && (
           <span style={{ marginLeft: 12, background: '#FEF3C7', color: '#92400E', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>
            GENÉRICA
           </span>
          )}
         </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
         <Link to={linkVer(r)} className="gt-btn gt-btn-secondary">Ver</Link>
         <Link to={linkEditar(r)} className="gt-btn gt-btn-secondary">Editar</Link>
         <button className="gt-btn gt-btn-danger" onClick={() => handleEliminar(r)}>
          Eliminar
         </button>
        </div>
       </div>
      </div>
     ))}
    </div>
   )}
  </>
 )
}
