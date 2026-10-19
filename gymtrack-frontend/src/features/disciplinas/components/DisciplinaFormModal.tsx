import { useState } from 'react'
import Modal from '../../../shared/components/Modal'
import { mensajeError } from '../../../shared/utils/errores'
import type { DisciplinaApi, DisciplinaRequest, Instructor } from '../services/disciplinaService'
import { COLORES, DIAS, DIAS_CORTO, aFranjas, colorDisciplina, deFranjas, minutos, resumenHorarios, type Franja } from '../utils/disciplinaUtils'
import { Spinner } from '../../../shared/components/ui'


/** Alta y edición de una disciplina, con sus horarios por día */
export default function DisciplinaFormModal({ inicial, instructores, colorSugerido, onGuardar, onCerrar }: {
  inicial: DisciplinaApi | null
  instructores: Instructor[]
  colorSugerido: number
  onGuardar: (datos: DisciplinaRequest) => Promise<void>
  onCerrar: () => void
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [color, setColor] = useState<number>(inicial?.color ?? colorSugerido)
  const [instructorSel, setInstructorSel] = useState<string>(inicial?.profesorId ? String(inicial.profesorId) : '')
  const [cupo, setCupo] = useState<string>(inicial?.cupoMaximo != null ? String(inicial.cupoMaximo) : '')
  const [franjas, setFranjas] = useState<Franja[]>(() => {
    const f = aFranjas(inicial?.horarios ?? [])
    return f.length ? f : [{ dias: [], horaInicio: '18:00', horaFin: '19:00' }]
  })
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const actualizarFranja = (i: number, cambios: Partial<Franja>) =>
    setFranjas(fs => fs.map((f, j) => (j === i ? { ...f, ...cambios } : f)))
  const toggleDia = (i: number, dia: string) =>
    setFranjas(fs => fs.map((f, j) => (j === i ? { ...f, dias: f.dias.includes(dia) ? f.dias.filter(d => d !== dia) : [...f.dias, dia] } : f)))

  const franjasValidas = franjas.filter(f => f.dias.length > 0)
  const vistaPrevia = resumenHorarios(deFranjas(franjasValidas))

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombre.trim()) { setError('Poné el nombre de la disciplina'); return }
    const mala = franjasValidas.find(f => !f.horaInicio || !f.horaFin || minutos(f.horaFin) <= minutos(f.horaInicio))
    if (mala) { setError('En cada horario, la hora de fin tiene que ser posterior a la de inicio'); return }
    const cupoNum = cupo.trim() === '' ? null : Number(cupo)
    if (cupoNum != null && (!Number.isInteger(cupoNum) || cupoNum < 1)) { setError('El cupo tiene que ser un número entero mayor a 0, o vacío para sin límite'); return }
    setGuardando(true)
    try {
      await onGuardar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        profesorId: instructorSel ? Number(instructorSel) : null,
        cupoMaximo: cupoNum,
        color,
        activa: inicial?.activa ?? true,
        horarios: deFranjas(franjasValidas),
      })
    } catch (err: unknown) {
      setError(mensajeError(err, 'No se pudo guardar la disciplina'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={inicial ? `Editar ${inicial.nombre}` : 'Nueva disciplina'} onCerrar={onCerrar} ancho={620}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cancelar</button>
        <button type="submit" form="form-disciplina" className="gt-btn gt-btn-primary" disabled={guardando}>
          {guardando ? <><Spinner /> Guardando…</> : inicial ? 'Guardar cambios' : 'Crear disciplina'}
        </button>
      </>}>
      <form id="form-disciplina" onSubmit={guardar} noValidate>
        {error && <div className="gt-alert gt-alert-error">{error}</div>}

        <div className="gt-form-grid">
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="disc-nombre">Nombre *</label>
            <input id="disc-nombre" className="gt-input" value={nombre} maxLength={60} autoFocus
              onChange={e => setNombre(e.target.value)} placeholder="Ej: Funcional, Yoga, Spinning" />
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="disc-cupo">Cupo</label>
            <input id="disc-cupo" className="gt-input" type="number" min={1} inputMode="numeric" value={cupo}
              onChange={e => setCupo(e.target.value)} placeholder="Sin límite" />
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="disc-instructor">Instructor</label>
            <select id="disc-instructor" className="gt-select" value={instructorSel} onChange={e => setInstructorSel(e.target.value)}>
              <option value="">Sin asignar</option>
              {instructores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <span className="gt-hint">
              {instructores.length === 0 ? 'Todavía no hay profesores. Se cargan en Profesores.' : 'Solo profesores registrados (se cargan en Profesores).'}
            </span>
          </div>
        </div>

        <div className="gt-form-group">
          <span className="gt-label">Color en el calendario</span>
          <div className="gt-colores" role="radiogroup" aria-label="Color">
            {COLORES.map(c => (
              <button key={c.n} type="button" role="radio" aria-checked={color === c.n} aria-label={c.nombre} title={c.nombre}
                className={`gt-color${color === c.n ? ' sel' : ''}`} style={{ background: colorDisciplina(c.n) }}
                onClick={() => setColor(c.n)} />
            ))}
          </div>
        </div>

        <div className="gt-form-group">
          <span className="gt-label">Días y horarios</span>
          <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 8px' }}>
            Marcá los días que comparten horario. Si un día cambia la hora, agregá otro horario.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {franjas.map((f, i) => (
              <div key={i} className="gt-franja">
                <div className="gt-franja-dias">
                  {DIAS.map(dia => (
                    <button key={dia} type="button" aria-pressed={f.dias.includes(dia)}
                      className={`gt-day-tab${f.dias.includes(dia) ? ' activo' : ''}`} style={{ padding: '5px 10px' }}
                      onClick={() => toggleDia(i, dia)}>
                      {DIAS_CORTO[dia]}
                    </button>
                  ))}
                </div>
                <div className="gt-franja-horas">
                  <label className="gt-text-sm gt-text-muted">de
                    <input type="time" className="gt-input" value={f.horaInicio} onChange={e => actualizarFranja(i, { horaInicio: e.target.value })} />
                  </label>
                  <label className="gt-text-sm gt-text-muted">a
                    <input type="time" className="gt-input" value={f.horaFin} onChange={e => actualizarFranja(i, { horaFin: e.target.value })} />
                  </label>
                  {franjas.length > 1 && (
                    <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => setFranjas(fs => fs.filter((_, j) => j !== i))}
                      aria-label="Quitar este horario">Quitar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 10, alignSelf: 'flex-start' }}
            onClick={() => setFranjas(fs => [...fs, { dias: [], horaInicio: fs[fs.length - 1]?.horaFin ?? '18:00', horaFin: '' }])}>
            + Agregar otro horario
          </button>
          {vistaPrevia.length > 0 && (
            <p className="gt-text-sm" style={{ margin: '10px 0 0', color: 'var(--text-secondary)' }}>
              Queda: <strong>{vistaPrevia.join(' · ')}</strong>
            </p>
          )}
        </div>

        <div className="gt-form-group" style={{ marginBottom: 0 }}>
          <label className="gt-label" htmlFor="disc-desc">Descripción</label>
          <textarea id="disc-desc" className="gt-textarea" rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)}
            placeholder="Para qué sirve, nivel, qué traer…" />
        </div>
      </form>
    </Modal>
  )
}
