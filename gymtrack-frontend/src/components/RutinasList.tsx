import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Rutina } from '../types/Rutina'
import { obtenerRutinas, eliminarRutina } from '../services/rutinaService'

const SOCIO_ID = 1

export default function RutinasList() {
  const [rutinas, setRutinas]   = useState<Rutina[]>([])
  const [error, setError]       = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try { setRutinas(await obtenerRutinas(SOCIO_ID)) }
    catch { setError('Error al cargar las rutinas') }
    finally { setCargando(false) }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta rutina?')) return
    try { await eliminarRutina(id, SOCIO_ID); setRutinas(p => p.filter(r => r.id !== id)) }
    catch { setError('No se pudo eliminar la rutina') }
  }

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Rutinas</h1>
        <Link to="/rutinas/nueva" className="gt-btn gt-btn-primary">+ Nueva rutina</Link>
      </div>

      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      {cargando ? (
        <p className="gt-text-muted">Cargando...</p>
      ) : rutinas.length === 0 ? (
        <div className="gt-empty">
          <p>Todavía no tenés rutinas.</p>
          <Link to="/rutinas/nueva" className="gt-btn gt-btn-primary" style={{ marginTop: 12 }}>Crear primera rutina</Link>
        </div>
      ) : (
        <div className="gt-card-list">
          {rutinas.map(r => (
            <div key={r.id} className="gt-list-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="gt-list-card-title">{r.nombre}</p>
                  {r.descripcion && <p className="gt-list-card-sub">{r.descripcion}</p>}
                  <p className="gt-text-muted gt-mt-4">Creada: {r.fechaCreacion?.slice(0, 10)}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/rutinas/${r.id}`} className="gt-btn gt-btn-secondary">Ver</Link>
                  <Link to={`/rutinas/editar/${r.id}`} className="gt-btn gt-btn-secondary">Editar</Link>
                  <button className="gt-btn gt-btn-danger" onClick={() => handleEliminar(r.id!)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
