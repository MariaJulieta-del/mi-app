import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEnRiesgo, type SocioEnRiesgo } from '../services/reporteService'
import { linkWhatsApp } from '../../../shared/utils/whatsapp'

const MOTIVO: Record<SocioEnRiesgo['motivos'][number], string> = {
  NUNCA_VINO: 'Pagó y nunca vino',
  NO_VIENE: 'Dejó de venir',
  VENCE_SIN_VENIR: 'Vence pronto y no viene',
}

function mensaje(s: SocioEnRiesgo): string {
  const nombre = s.nombre.split(' ')[0]
  if (s.motivos.includes('NUNCA_VINO')) return `¡Hola ${nombre}! Te esperamos en el gimnasio para arrancar. ¿Querés que te armemos la rutina? 💪`
  if (s.motivos.includes('VENCE_SIN_VENIR')) return `¡Hola ${nombre}! Hace unos días que no te vemos y tu membresía vence ${s.diasParaVencer <= 0 ? 'hoy' : `en ${s.diasParaVencer} días`}. ¿Te esperamos esta semana?`
  return `¡Hola ${nombre}! Hace ${s.diasSinVenir} días que no te vemos por el gimnasio. ¿Todo bien? Te esperamos 💪`
}

/** Socios con membresía vigente que conviene contactar antes de que abandonen */
export default function SociosEnRiesgo({ max = 8 }: { max?: number }) {
  const [lista, setLista] = useState<SocioEnRiesgo[] | null>(null)
  const [verTodos, setVerTodos] = useState(false)

  useEffect(() => { getEnRiesgo().then(setLista).catch(() => setLista([])) }, [])

  if (!lista || lista.length === 0) return null
  const visibles = verTodos ? lista : lista.slice(0, max)

  return (
    <div className="gt-card" style={{ marginBottom: 20, borderLeft: '3px solid var(--yellow-text)' }}>
      <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 2 }}>⚠️ Socios en riesgo de abandonar ({lista.length})</p>
      <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 12px' }}>
        Tienen la membresía vigente pero dejaron de venir. Un mensaje a tiempo ayuda a que renueven.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visibles.map(s => {
          const wa = linkWhatsApp(s.telefono, mensaje(s))
          return (
            <div key={s.socioId} className="gt-hoy-fila">
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/socios/${s.socioId}/perfil`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{s.nombre}</Link>
                <div className="gt-text-sm gt-text-muted">
                  {s.motivos.map(m => MOTIVO[m]).join(' · ')}
                  {s.diasSinVenir != null && ` · última visita hace ${s.diasSinVenir} días`}
                  {` · vence en ${s.diasParaVencer} días`}
                </div>
              </div>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn-secondary gt-btn-sm gt-btn-wa">WhatsApp</a>
              ) : (
                <span className="gt-text-muted gt-text-sm" title="Cargá el teléfono en el perfil del socio">Sin teléfono</span>
              )}
            </div>
          )
        })}
      </div>
      {lista.length > max && (
        <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 10 }} onClick={() => setVerTodos(v => !v)}>
          {verTodos ? 'Ver menos' : `Ver los ${lista.length}`}
        </button>
      )}
    </div>
  )
}
