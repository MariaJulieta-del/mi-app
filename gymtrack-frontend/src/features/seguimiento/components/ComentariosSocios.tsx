import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, MessageSquareText, Star } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { Pill } from '../../../shared/components/ui'
import { fechaCorta } from '../../../shared/utils/fechas'
import { SENSACIONES, type Sesion } from '../../socioapp/services/socioAppService'

/**
 * Lo que contaron los socios al terminar de entrenar (últimos 7 días).
 * "Muy fácil" o "al límite" son señales para ajustar la rutina.
 */
export default function ComentariosSocios() {
  const [sesiones, setSesiones] = useState<Sesion[] | null>(null)
  const [verTodos, setVerTodos] = useState(false)

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
  // Primero los sin leer y los que piden ajustar la rutina
  const peso = (s: Sesion) => (s.leida ? 2 : 0) + (s.sensacion === 'MUY_FACIL' || s.sensacion === 'MUY_DURO' ? 0 : 1)
  const ordenadas = [...sesiones].slice(0, 10).sort((a, b) => peso(a) - peso(b))
  const visibles = verTodos ? ordenadas : ordenadas.slice(0, 4)

  return (
    <section className="gt-card" style={{ marginBottom: 16 }} aria-labelledby="comentarios-socios">
      <h2 id="comentarios-socios" className="gt-card-title" style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquareText size={18} aria-hidden /> Lo que contaron los socios
        {sinLeer > 0 && <Pill tono="info">{sinLeer} sin leer</Pill>}
      </h2>
      <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 10px' }}>Al terminar de entrenar, cada socio cuenta cómo se sintió.</p>
      {visibles.map(s => {
        const sen = SENSACIONES.find(x => x.valor === s.sensacion)
        const alerta = s.sensacion === 'MUY_FACIL' || s.sensacion === 'MUY_DURO'
        return (
          <div key={s.id} className={`gt-comentario${s.leida ? ' leida' : ''}`}>
            <span className="gt-sesion-emoji" aria-hidden>{sen ? <sen.icono size={18} /> : <MessageCircle size={18} />}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to={`/socios/${s.socioId}/perfil`} className="gt-link-socio">{s.socioNombre}</Link>
                {sen && <Pill tono={alerta ? 'warn' : 'neutral'}>{sen.texto}</Pill>}
                {s.records > 0 && <Pill tono="ok" icono={Star}>{s.records} {s.records === 1 ? 'récord' : 'récords'}</Pill>}
              </div>
              <span className="gt-text-sm gt-text-muted">{fechaCorta(s.fecha)} · {s.rutinaNombre ?? 'Entrenamiento'}{s.dia ? ` día ${s.dia}` : ''}{s.duracionMin ? ` · ${s.duracionMin} min` : ''}</span>
              {s.comentario && <p className="gt-comentario-texto">“{s.comentario}”</p>}
              {alerta && s.rutinaId && (
                <Link to={`/rutinas/${s.rutinaId}?socioId=${s.socioId}`} className="gt-text-sm gt-link-accion" style={{ fontWeight: 600 }}>
                  {s.sensacion === 'MUY_FACIL' ? 'Le quedó fácil: subir la exigencia →' : 'Le costó mucho: revisar la rutina →'}
                </Link>
              )}
            </div>
            {!s.leida && (
              <button type="button" className="gt-btn gt-btn-ghost gt-btn-sm gt-comentario-leer" onClick={() => leer(s)}
                aria-label={`Marcar como leído el comentario de ${s.socioNombre}`}>Leído</button>
            )}
          </div>
        )
      })}
      {ordenadas.length > 4 && (
        <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 4 }} aria-expanded={verTodos}
          onClick={() => setVerTodos(v => !v)}>{verTodos ? 'Ver menos' : `Ver los ${ordenadas.length}`}</button>
      )}
    </section>
  )
}
