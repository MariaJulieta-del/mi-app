import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, MessageCircle } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { Pill, type Tono } from '../../../shared/components/ui'
import { linkWhatsApp } from '../../../shared/utils/whatsapp'
import { useToast } from '../../../shared/hooks/useToast'
import { TIPOS_RUTINA, resolverTarea, type Tarea } from '../services/retencionService'

const TONO: Record<string, Tono> = {
  AUSENCIA_LLAMAR: 'danger', POCAS_VISITAS: 'warn', NUEVO_SIN_VENIR: 'warn',
  RUTINA_VIEJA: 'info', SIN_RUTINA: 'info', SEGUIMIENTO_14: 'ok',
}
// Primero lo más urgente
const ORDEN = ['AUSENCIA_LLAMAR', 'NUEVO_SIN_VENIR', 'POCAS_VISITAS', 'SEGUIMIENTO_14']
const prioridad = (t: Tarea) => { const i = ORDEN.indexOf(t.tipo); return i < 0 ? ORDEN.length : i }

const VISIBLES = 4

/**
 * Tareas de retención del día: a quién escribirle para que no se vaya (o para que vuelva).
 * Las genera el sistema solo; el mensaje de WhatsApp ya viene escrito.
 */
export default function TareasRetencion({ onCargadas, enAtender }: {
  onCargadas?: (tareas: Tarea[]) => void
  /** Socios que ya figuran en «Para atender» */
  enAtender?: Set<number>
}) {
  const toast = useToast()
  const [tareas, setTareas] = useState<Tarea[] | null>(null)
  const [verTodas, setVerTodas] = useState(false)

  useEffect(() => {
    axiosInstance.get<Tarea[]>('/api/v1/retencion/tareas')
      .then(r => { onCargadas?.(r.data); setTareas([...r.data].sort((a, b) => prioridad(a) - prioridad(b))) })
      .catch(() => setTareas([]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const volver = (t: Tarea) => setTareas(prev => (prev ? [...prev, t].sort((a, b) => prioridad(a) - prioridad(b)) : prev))

  const resolver = async (t: Tarea, estado: 'HECHA' | 'DESCARTADA') => {
    setTareas(prev => prev?.filter(x => x.id !== t.id) ?? null)
    try {
      await resolverTarea(t.id, estado)
      toast.conDeshacer(estado === 'HECHA' ? `${t.socioNombre}: contactado` : `${t.socioNombre}: descartado`, async () => {
        try { await resolverTarea(t.id, 'PENDIENTE'); volver(t) } catch { toast.error('No se pudo deshacer') }
      })
    } catch {
      volver(t)
      toast.error('No se pudo guardar')
    }
  }

  const lista = (tareas ?? []).filter(t => !(TIPOS_RUTINA.includes(t.tipo) && enAtender?.has(t.socioId)))
  if (lista.length === 0) return null
  const visibles = verTodas ? lista : lista.slice(0, VISIBLES)

  return (
    <section className="gt-card" style={{ marginBottom: 16, borderLeft: '4px solid var(--accent)' }} aria-labelledby="tareas-retencion">
      <h2 id="tareas-retencion" className="gt-card-title" style={{ margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <HeartHandshake size={18} aria-hidden /> Para no perder socios <span className="gt-cuenta">{lista.length}</span>
      </h2>
      <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 10px' }}>
        El sistema revisa a todos cada día. Escribiles con un toque: el mensaje ya está armado.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visibles.map(t => {
          const wa = linkWhatsApp(t.telefono, t.mensaje)
          return (
            <div key={t.id} className="gt-tarea">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Link to={`/socios/${t.socioId}/perfil`} className="gt-link-socio">{t.socioNombre}</Link>
                  <Pill tono={TONO[t.tipo] ?? 'neutral'}>{t.titulo}</Pill>
                </div>
                <p className="gt-tarea-msg">{t.mensaje}</p>
              </div>
              <div className="gt-tarea-acciones">
                {wa
                  ? <a href={wa} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn-secondary gt-btn-sm gt-btn-wa" onClick={() => resolver(t, 'HECHA')}>
                      <MessageCircle size={14} aria-hidden /> WhatsApp
                    </a>
                  : <span className="gt-text-sm gt-text-muted">Sin teléfono</span>}
                <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => resolver(t, 'HECHA')}
                  aria-label={`Marcar como hecha la tarea de ${t.socioNombre}`}>Hecho</button>
                <button type="button" className="gt-btn gt-btn-ghost gt-btn-sm" onClick={() => resolver(t, 'DESCARTADA')}
                  aria-label={`Descartar la tarea de ${t.socioNombre}`}>Descartar</button>
              </div>
            </div>
          )
        })}
      </div>
      {lista.length > VISIBLES && (
        <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 8 }} aria-expanded={verTodas}
          onClick={() => setVerTodas(v => !v)}>{verTodas ? 'Ver menos' : `Ver las ${lista.length}`}</button>
      )}
    </section>
  )
}
