import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, MessageSquareText, Star } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { Pill } from '../../../shared/components/ui'
import { formatFecha } from '../../../shared/utils/fechas'
import { SENSACIONES, type Sesion } from '../../socioapp/services/socioAppService'

/**
 * Lo que contaron los socios al terminar de entrenar (últimos 7 días).
 * "Muy fácil" o "al límite" son señales para ajustar la rutina.
 */
export default function ComentariosSocios() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null)

  useEffect(() => {
    axiosInstance.get<Sesion[]>('/api/v1/sesiones/recientes', { params: { dias: 7 } })
      .then(r => setSesiones(r.data.filter(s => s.sensacion || s.comentario)))
      .catch(() => setSesiones([]))
  }, [])

  const leer = (s: Sesion) => {
    setSesiones(prev => prev?.map(x => (x.id === s.id ? { ...x, leida: true } : x)) ?? null)
    axiosInstance.patch(`/api/v1/sesiones/${s.id}/leida`).catch(() => {})
  }

  if (!sesiones || sesiones.length === 0) return null
  const sinLeer = sesiones.filter(s => !s.leida).length

  return (
    <div className="gt-card" style={{ marginBottom: 16 }}>
      <p className="gt-card-title" style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquareText size={18} aria-hidden /> Lo que contaron los socios
        {sinLeer > 0 && <Pill tono="info">{sinLeer} sin leer</Pill>}
      </p>
      <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 10px' }}>Al terminar de entrenar, cada socio cuenta cómo se sintió.</p>
      {sesiones.slice(0, 10).map(s => {
        const sen = SENSACIONES.find(x => x.valor === s.sensacion)
        const alerta = s.sensacion === 'MUY_FACIL' || s.sensacion === 'MUY_DURO'
        return (
          <div key={s.id} className={`gt-comentario${s.leida ? ' leida' : ''}`} onClick={() => !s.leida && leer(s)}
            {...(!s.leida ? { role: 'button', tabIndex: 0, 'aria-label': `Marcar como leído el comentario de ${s.socioNombre}`,
              onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); leer(s) } } } : {})}>
            <span className="gt-sesion-emoji" aria-hidden>{sen ? <sen.icono size={18} /> : <MessageCircle size={18} />}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to={`/socios/${s.socioId}/perfil`} style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>{s.socioNombre}</Link>
                {sen && <Pill tono={alerta ? 'warn' : 'neutral'}>{sen.texto}</Pill>}
                {s.records > 0 && <Pill tono="ok" icono={Star}>{s.records} {s.records === 1 ? 'récord' : 'récords'}</Pill>}
              </div>
              <span className="gt-text-sm gt-text-muted">{formatFecha(s.fecha)} · {s.rutinaNombre ?? 'Entrenamiento'}{s.dia ? ` día ${s.dia}` : ''}{s.duracionMin ? ` · ${s.duracionMin} min` : ''}</span>
              {s.comentario && <p className="gt-comentario-texto">“{s.comentario}”</p>}
              {alerta && s.rutinaId && (
                <Link to={`/rutinas/${s.rutinaId}?socioId=${s.socioId}`} className="gt-text-sm" style={{ fontWeight: 600 }}>
                  {s.sensacion === 'MUY_FACIL' ? 'Le quedó fácil: subir la exigencia →' : 'Le costó mucho: revisar la rutina →'}
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
