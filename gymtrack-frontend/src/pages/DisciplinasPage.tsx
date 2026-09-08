import { useState, useEffect } from 'react'
import { listarDisciplinas, crearDisciplina, actualizarDisciplina, desactivarDisciplina, renovarMesDisciplina } from '../services/disciplinaService'

interface Disciplina {
  id?: number
  nombre: string
  descripcion: string
  instructor: string
  horario: string
  cupoMaximo: number | ''
  activa: boolean
  diasSemana: string[]
  horaInicio: string
  horaFin: string
}

const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const DIAS_CORTO: Record<string, string> = {
  LUNES: 'Lun', MARTES: 'Mar', 'MIÉRCOLES': 'Mié', JUEVES: 'Jue',
  VIERNES: 'Vie', 'SÁBADO': 'Sáb', DOMINGO: 'Dom',
}

const VACIO: Disciplina = {
  nombre: '', descripcion: '', instructor: '', horario: '',
  cupoMaximo: '', activa: true, diasSemana: [], horaInicio: '', horaFin: '',
}

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [form, setForm] = useState<Disciplina>(VACIO)
  const [editando, setEditando] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [renovando, setRenovando] = useState<number | null>(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try { setDisciplinas(await listarDisciplinas(false)) } catch {}
  }

  const toggleDia = (dia: string) => {
    setForm(f => ({
      ...f,
      diasSemana: f.diasSemana.includes(dia)
        ? f.diasSemana.filter(d => d !== dia)
        : [...f.diasSemana, dia],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre) { setError('El nombre es obligatorio'); return }
    try {
      const payload = { ...form, cupoMaximo: form.cupoMaximo === '' ? null : form.cupoMaximo }
      if (editando !== null) {
        await actualizarDisciplina(editando, payload)
        setExito('Disciplina actualizada')
      } else {
        await crearDisciplina(payload)
        setExito('Disciplina creada')
      }
      setForm(VACIO); setEditando(null); setError(null); cargar()
    } catch { setError('Error al guardar la disciplina') }
  }

  const handleEditar = (d: any) => {
    setForm({
      id: d.id,
      nombre: d.nombre ?? '',
      descripcion: d.descripcion ?? '',
      instructor: d.instructor ?? '',
      horario: d.horario ?? '',
      cupoMaximo: d.cupoMaximo ?? '',
      activa: d.activa ?? true,
      diasSemana: d.diasSemana ?? [],
      horaInicio: d.horaInicio ?? '',
      horaFin: d.horaFin ?? '',
    })
    setEditando(d.id); setExito(null); setError(null)
  }

  const handleDesactivar = async (id: number) => {
    try { await desactivarDisciplina(id); setExito('Disciplina desactivada'); cargar() }
    catch { setError('Error al desactivar') }
  }

  const handleRenovarMes = async (id: number, nombre: string) => {
    if (!confirm(`¿Renovar mes de "${nombre}"? Esto liberará todos los cupos actuales (los socios quedarán sin disciplina asignada).`)) return
    try {
      setRenovando(id)
      await renovarMesDisciplina(id)
      setExito(`Cupos de "${nombre}" renovados — socios desvinculados`)
      cargar()
    } catch { setError('Error al renovar el mes') }
    finally { setRenovando(null) }
  }

  return (
    <>
      <h1 className="gt-page-title">Disciplinas</h1>

      {exito && (
        <div className="gt-alert gt-alert-success">
          {exito}
          <button onClick={() => setExito(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {error && (
        <div className="gt-alert gt-alert-error">
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Formulario ── */}
      <div className="gt-card" style={{ marginBottom: 20 }}>
        <p className="gt-card-title">{editando !== null ? 'Editar disciplina' : 'Nueva disciplina'}</p>
        <form onSubmit={handleSubmit}>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label">Nombre *</label>
              <input className="gt-input" value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: CrossFit" />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Instructor</label>
              <input className="gt-input" value={form.instructor}
                onChange={e => setForm({ ...form, instructor: e.target.value })}
                placeholder="Nombre del profesor" />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Cupo máximo</label>
              <input className="gt-input" type="number" value={form.cupoMaximo}
                onChange={e => setForm({ ...form, cupoMaximo: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Ej: 20" />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Hora inicio</label>
              <input className="gt-input" type="time" value={form.horaInicio}
                onChange={e => setForm({ ...form, horaInicio: e.target.value })} />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Hora fin</label>
              <input className="gt-input" type="time" value={form.horaFin}
                onChange={e => setForm({ ...form, horaFin: e.target.value })} />
            </div>

            {/* Días de la semana */}
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Días de la semana</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {DIAS.map(dia => {
                  const sel = form.diasSemana.includes(dia)
                  return (
                    <button key={dia} type="button"
                      onClick={() => toggleDia(dia)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, border: '1.5px solid',
                        borderColor: sel ? '#2E75B6' : '#D1D5DB',
                        background: sel ? '#EFF6FF' : '#fff',
                        color: sel ? '#2E75B6' : '#6B7280',
                        fontWeight: sel ? 600 : 400, fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      {DIAS_CORTO[dia]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Descripción</label>
              <textarea className="gt-textarea" rows={2} value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción de la disciplina" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="gt-btn gt-btn-primary">
              {editando !== null ? 'Actualizar' : 'Crear disciplina'}
            </button>
            {editando !== null && (
              <button type="button" className="gt-btn gt-btn-secondary"
                onClick={() => { setForm(VACIO); setEditando(null) }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Lista ── */}
      {disciplinas.length === 0 ? (
        <div className="gt-empty"><p>No hay disciplinas registradas</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disciplinas.map((d: any) => {
            const dias: string[] = d.diasSemana ?? []
            const inscriptos = d.cupoActual ?? '?'
            const cupo = d.cupoMaximo
            return (
              <div key={d.id} className="gt-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  {/* Info principal */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="gt-fw-600" style={{ fontSize: 16 }}>{d.nombre}</span>
                      <span className={d.activa ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-gray'}>
                        {d.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    {d.instructor && (
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>👤 {d.instructor}</p>
                    )}
                    {(d.horaInicio || d.horaFin) && (
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>
                        🕐 {d.horaInicio || '—'} – {d.horaFin || '—'}
                      </p>
                    )}
                    {cupo != null && (
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6B7280' }}>
                        👥 Cupo: <strong>{cupo}</strong> máx.
                      </p>
                    )}
                    {d.descripcion && (
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151' }}>{d.descripcion}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
                      onClick={() => handleEditar(d)}>
                      Editar
                    </button>
                    {d.activa && (
                      <>
                        <button
                          className="gt-btn"
                          style={{ fontSize: 12, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
                          disabled={renovando === d.id}
                          onClick={() => handleRenovarMes(d.id, d.nombre)}>
                          {renovando === d.id ? 'Renovando...' : '🔄 Renovar mes'}
                        </button>
                        <button className="gt-btn gt-btn-danger" style={{ fontSize: 12 }}
                          onClick={() => handleDesactivar(d.id)}>
                          Desactivar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Cupos y alumnos */}
                {d.cupoMaximo != null && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: (d.cuposDisponibles ?? d.cupoMaximo) === 0 ? '#DC2626' : '#16A34A',
                    }}>
                      {(d.cuposDisponibles ?? d.cupoMaximo) === 0
                        ? '🔴 Sin cupos disponibles'
                        : `🟢 ${d.cuposDisponibles} cupo${d.cuposDisponibles === 1 ? '' : 's'} disponible${d.cuposDisponibles === 1 ? '' : 's'}`}
                    </span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      ({d.totalInscritos ?? 0} / {d.cupoMaximo} inscriptos)
                    </span>
                  </div>
                )}
                {d.sociosInscritos && d.sociosInscritos.length > 0 && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontSize: 12, color: '#6B7280', cursor: 'pointer', userSelect: 'none' }}>
                      Ver alumnos ({d.sociosInscritos.length})
                    </summary>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {d.sociosInscritos.map((nombre: string, i: number) => (
                        <span key={i} style={{
                          fontSize: 12, background: '#EFF6FF', color: '#2E75B6',
                          borderRadius: 12, padding: '2px 8px',
                        }}>{nombre}</span>
                      ))}
                    </div>
                  </details>
                )}

              {/* Calendario semanal */}
                {dias.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {DIAS.map(dia => {
                        const activo = dias.includes(dia)
                        return (
                          <div key={dia} style={{
                            flex: 1, textAlign: 'center', padding: '6px 0',
                            borderRadius: 8,
                            background: activo ? '#2E75B6' : '#F3F4F6',
                            color: activo ? '#fff' : '#9CA3AF',
                            fontWeight: activo ? 700 : 400,
                            fontSize: 11,
                          }}>
                            {DIAS_CORTO[dia]}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
