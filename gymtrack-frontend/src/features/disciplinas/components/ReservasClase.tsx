import { useEffect, useState } from 'react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { Pill } from '../../../shared/components/ui'
import type { ClaseAgenda } from '../../socioapp/services/socioAppService'
import { cuandoClase } from '../../socioapp/utils'

interface Asistente { socioId: number; nombre: string; tipo: string; posicion: number | null }
interface Detalle { cupo: number | null; ocupados: number; vienen: Asistente[]; espera: Asistente[]; avisaronQueNo: Asistente[] }

/** Para el staff: las próximas clases de la disciplina con quién viene, la lista de espera y quién avisó que no */
export default function ReservasClase({ disciplinaId }: { disciplinaId: number }) {
  const [clases, setClases] = useState<ClaseAgenda[] | null>(null)
  const [sel, setSel] = useState<ClaseAgenda | null>(null)
  const [detalle, setDetalle] = useState<Detalle | null>(null)

  useEffect(() => {
    axiosInstance.get<ClaseAgenda[]>('/api/v1/reservas/agenda').then(r => {
      const mias = r.data.filter(c => c.disciplinaId === disciplinaId)
      setClases(mias)
      setSel(mias[0] ?? null)
    }).catch(() => setClases([]))
  }, [disciplinaId])

  useEffect(() => {
    if (!sel) return
    axiosInstance.get<Detalle>('/api/v1/reservas/clase', { params: { disciplinaId, fecha: sel.fecha, hora: sel.horaInicio } })
      .then(r => setDetalle(r.data)).catch(() => setDetalle(null))
  }, [sel, disciplinaId])

  if (!clases) return <p className="gt-text-muted">Cargando…</p>
  if (clases.length === 0) return <p className="gt-text-muted">No hay clases en los próximos 7 días.</p>

  return (
    <div>
      <div className="gt-toolbar-fila" style={{ marginBottom: 10 }}>
        {clases.map(c => {
          const k = `${c.fecha}-${c.horaInicio}`
          const activo = sel && `${sel.fecha}-${sel.horaInicio}` === k
          return (
            <button key={k} type="button" className={`gt-filtro-chip${activo ? ' activo' : ''}`} onClick={() => setSel(c)}>
              {cuandoClase(c.fecha)} {c.horaInicio}
              <span className="gt-text-muted" style={{ fontWeight: 400 }}> · {c.ocupados}{c.cupo ? `/${c.cupo}` : ''}</span>
            </button>
          )
        })}
      </div>
      {detalle && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p className="gt-subtitulo">Vienen ({detalle.vienen.length}{detalle.cupo ? ` de ${detalle.cupo}` : ''})</p>
            {detalle.vienen.length === 0 ? <p className="gt-text-sm gt-text-muted" style={{ margin: 0 }}>Nadie todavía.</p> : detalle.vienen.map(a => (
              <div key={a.socioId} className="gt-hoy-fila">
                <span style={{ flex: 1 }}>{a.nombre}</span>
                <Pill tono={a.tipo === 'FIJO' ? 'neutral' : a.tipo === 'AUSENTE' ? 'danger' : 'ok'}>
                  {a.tipo === 'FIJO' ? 'Fijo' : a.tipo === 'ASISTIO' ? 'Vino' : a.tipo === 'AUSENTE' ? 'No vino' : 'Reservó'}
                </Pill>
              </div>
            ))}
          </div>
          {detalle.espera.length > 0 && (
            <div>
              <p className="gt-subtitulo">En espera ({detalle.espera.length})</p>
              {detalle.espera.map(a => <div key={a.socioId} className="gt-hoy-fila"><span style={{ flex: 1 }}>{a.posicion}. {a.nombre}</span></div>)}
            </div>
          )}
          {detalle.avisaronQueNo.length > 0 && (
            <div>
              <p className="gt-subtitulo">Avisaron que no van</p>
              {detalle.avisaronQueNo.map(a => <div key={a.socioId} className="gt-hoy-fila"><span style={{ flex: 1, color: 'var(--text-muted)' }}>{a.nombre}</span></div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
