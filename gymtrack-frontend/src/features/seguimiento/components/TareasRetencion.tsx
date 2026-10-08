import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, HeartHandshake, MessageCircle, X } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { IconButton, Pill, type Tono } from '../../../shared/components/ui'
import { linkWhatsApp } from '../../../shared/utils/whatsapp'
import { useToast } from '../../../shared/hooks/useToast'

interface Tarea {
  id: number; socioId: number; socioNombre: string; telefono: string | null
  tipo: string; titulo: string; mensaje: string; creada: string
}

const TONO: Record<string, Tono> = {
  AUSENCIA_LLAMAR: 'danger', POCAS_VISITAS: 'warn', NUEVO_SIN_VENIR: 'warn',
  RUTINA_VIEJA: 'info', SIN_RUTINA: 'info', SEGUIMIENTO_14: 'ok',
}

/**
 * Tareas de retención del día: a quién escribirle para que no se vaya (o para que vuelva).
 * Las genera el sistema solo; el mensaje de WhatsApp ya viene escrito.
 */
export default function TareasRetencion() {
  const toast = useToast()
  const [tareas, setTareas] = useState<Tarea[] | null>(null)
  const [verTodas, setVerTodas] = useState(false)

  useEffect(() => {
    axiosInstance.get<Tarea[]>('/api/v1/retencion/tareas').then(r => setTareas(r.data)).catch(() => setTareas([]))
  }, [])

  const resolver = async (t: Tarea, estado: 'HECHA' | 'DESCARTADA') => {
    setTareas(prev => prev?.filter(x => x.id !== t.id) ?? null)
    try {
      await axiosInstance.patch(`/api/v1/retencion/tareas/${t.id}`, { estado })
      if (estado === 'HECHA') toast.success('Listo', `${t.socioNombre} quedó contactado`)
    } catch {
      setTareas(prev => (prev ? [t, ...prev] : prev))
      toast.error('No se pudo guardar')
    }
  }

  if (!tareas || tareas.length === 0) return null
  const visibles = verTodas ? tareas : tareas.slice(0, 6)

  return (
    <div className="gt-card" style={{ marginBottom: 16, borderLeft: '4px solid var(--accent)' }}>
      <div className="gt-socio-bloque-cab" style={{ marginBottom: 2 }}>
        <p className="gt-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <HeartHandshake size={18} aria-hidden /> Para no perder socios ({tareas.length})
        </p>
      </div>
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
                  <Link to={`/socios/${t.socioId}/perfil`} style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>{t.socioNombre}</Link>
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
                <IconButton icono={Check} etiqueta="Marcar como hecha" onClick={() => resolver(t, 'HECHA')} />
                <IconButton icono={X} etiqueta="Descartar" onClick={() => resolver(t, 'DESCARTADA')} />
              </div>
            </div>
          )
        })}
      </div>
      {tareas.length > visibles.length && (
        <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 8 }} onClick={() => setVerTodas(true)}>Ver las {tareas.length}</button>
      )}
    </div>
  )
}
