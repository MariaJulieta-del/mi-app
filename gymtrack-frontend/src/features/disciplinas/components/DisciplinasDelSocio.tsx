import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { mensajeError } from '../../../shared/utils/errores'
import {
  disciplinasDelSocio, listarDisciplinas, inscribirSocio, desinscribirSocio, type DisciplinaApi,
} from '../services/disciplinaService'
import { colorDisciplina, resumenHorarios, textoCupo } from '../utils/disciplinaUtils'

/**
 * Disciplinas de un socio.
 *  - Staff: ver, inscribir en otra (con cupo y membresía vigente) y quitar.
 *  - Socio: "Mis clases", solo lectura, con sus horarios.
 */
export default function DisciplinasDelSocio({ socioId, editable }: { socioId: number; editable: boolean }) {
  const [mias, setMias] = useState<DisciplinaApi[]>([])
  const [todas, setTodas] = useState<DisciplinaApi[]>([])
  const [elegida, setElegida] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    disciplinasDelSocio(socioId).then(setMias).catch(() => {}).finally(() => setCargado(true))
    if (editable) listarDisciplinas(true).then(setTodas).catch(() => {})
  }, [socioId, editable])

  const recargar = async () => {
    const [m, t] = await Promise.all([disciplinasDelSocio(socioId), editable ? listarDisciplinas(true) : Promise.resolve(todas)])
    setMias(m); setTodas(t)
  }

  const inscribir = async () => {
    if (!elegida) return
    setTrabajando(true); setError(null)
    try { await inscribirSocio(Number(elegida), socioId); setElegida(''); await recargar() }
    catch (err: unknown) { setError(mensajeError(err, 'No se pudo inscribir')) }
    finally { setTrabajando(false) }
  }

  const quitar = async (d: DisciplinaApi) => {
    setTrabajando(true); setError(null)
    try { await desinscribirSocio(d.id, socioId); await recargar() }
    catch (err: unknown) { setError(mensajeError(err, 'No se pudo quitar')) }
    finally { setTrabajando(false) }
  }

  if (!cargado) return null
  if (!editable && mias.length === 0) return null

  const disponibles = todas.filter(t => !mias.some(m => m.id === t.id))

  return (
    <div className="gt-card" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <p className="gt-card-title" style={{ margin: 0 }}>{editable ? 'Disciplinas' : 'Mis clases'}</p>
        {editable && <Link to="/disciplinas" className="gt-text-sm">Ver calendario</Link>}
      </div>

      {error && <div className="gt-alert gt-alert-error" style={{ marginTop: 10 }}>{error}</div>}

      {mias.length === 0 ? (
        <p className="gt-text-muted gt-text-sm" style={{ margin: '8px 0 0' }}>No está inscripto en ninguna disciplina.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {mias.map(d => (
            <div key={d.id} className="gt-disc-fila" style={{ ['--c' as string]: colorDisciplina(d.color) }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: 'var(--text-primary)' }}>{d.nombre}</strong>
                {!d.activa && <span className="gt-badge gt-badge-gray" style={{ marginLeft: 6 }}>Inactiva</span>}
                <div className="gt-text-sm gt-text-muted">
                  {resumenHorarios(d.horarios).join(' · ') || 'Sin horarios cargados'}
                  {d.instructor && ` · ${d.instructor}`}
                </div>
              </div>
              {editable && (
                <button type="button" className="gt-icono-btn" disabled={trabajando} onClick={() => quitar(d)}
                  aria-label={`Quitar de ${d.nombre}`} title="Quitar de la disciplina">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {editable && disponibles.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <select className="gt-select" style={{ flex: 1, minWidth: 200 }} value={elegida} onChange={e => setElegida(e.target.value)} aria-label="Disciplina a inscribir">
            <option value="">Inscribir en…</option>
            {disponibles.map(d => {
              const completa = d.cupoMaximo != null && d.totalInscritos >= d.cupoMaximo
              return (
                <option key={d.id} value={d.id} disabled={completa}>
                  {d.nombre} — {completa ? 'completa' : textoCupo(d.totalInscritos, d.cupoMaximo)}
                </option>
              )
            })}
          </select>
          <button type="button" className="gt-btn gt-btn-primary" disabled={!elegida || trabajando} onClick={inscribir}>
            {trabajando ? 'Guardando…' : 'Inscribir'}
          </button>
        </div>
      )}
    </div>
  )
}
