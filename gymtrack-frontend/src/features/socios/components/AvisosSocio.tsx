import { useEffect, useState } from 'react'
import axiosInstance from '../../../shared/services/axiosInstance'

interface Aviso {
  id: number
  titulo: string
  mensaje: string
  tipo: string
  destinatario: string
  disciplinaNombre: string | null
  fechaCreacion: string
}

const CLAVE = 'gt-avisos-vistos'
const leerVisto = () => { try { return localStorage.getItem(CLAVE) ?? '' } catch { return '' } }

function cuando(iso: string): string {
  const f = new Date(iso)
  const dias = Math.floor((Date.now() - f.getTime()) / 86_400_000)
  if (dias <= 0) return `hoy ${f.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return f.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

/**
 * Avisos del gimnasio para el socio: generales, personales y de sus clases.
 * Marca como "Nuevo" lo que no vio desde su última visita.
 */
export default function AvisosSocio() {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null)
  const [vistoHasta] = useState(leerVisto)
  const [verTodos, setVerTodos] = useState(false)

  useEffect(() => {
    axiosInstance.get<Aviso[]>('/api/v1/notificaciones/mias').then(r => setAvisos(r.data)).catch(() => setAvisos([]))
  }, [])

  // Después de mostrarlos, quedan como vistos para la próxima vez
  useEffect(() => {
    if (avisos && avisos.length > 0) {
      try { localStorage.setItem(CLAVE, avisos[0].fechaCreacion) } catch { /* sin almacenamiento */ }
    }
  }, [avisos])

  if (!avisos || avisos.length === 0) return null
  const nuevos = avisos.filter(a => a.fechaCreacion > vistoHasta).length
  const visibles = verTodos ? avisos : avisos.slice(0, 3)

  return (
    <div className="gt-card gt-avisos-socio" style={{ marginBottom: 16 }}>
      <p className="gt-card-title" style={{ margin: '0 0 8px' }}>
        🔔 Avisos del gimnasio {nuevos > 0 && <span className="gt-badge gt-badge-green" style={{ marginLeft: 6 }}>{nuevos} {nuevos === 1 ? 'nuevo' : 'nuevos'}</span>}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visibles.map(a => (
          <div key={a.id} className={`gt-aviso${a.fechaCreacion > vistoHasta ? ' nuevo' : ''}${a.tipo === 'CUOTA' ? ' cuota' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{a.titulo}</strong>
              <span className="gt-text-sm gt-text-muted" style={{ whiteSpace: 'nowrap' }}>{cuando(a.fechaCreacion)}</span>
            </div>
            {a.disciplinaNombre && <div className="gt-text-sm" style={{ color: 'var(--accent)', fontWeight: 600 }}>{a.disciplinaNombre}</div>}
            <p className="gt-text-sm" style={{ margin: '4px 0 0', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{a.mensaje}</p>
          </div>
        ))}
      </div>
      {avisos.length > 3 && (
        <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 8 }} onClick={() => setVerTodos(v => !v)}>
          {verTodos ? 'Ver menos' : `Ver los ${avisos.length} avisos`}
        </button>
      )}
    </div>
  )
}
