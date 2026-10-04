import { useDisciplinas } from '../hooks/useDisciplinas'

export default function DisciplinasPage() {
  const { formRef, ...d } = useDisciplinas()

  return (
    <>
      <h1 className="gt-page-title">Disciplinas</h1>

      {d.exito && (
        <div className="gt-alert gt-alert-success">
          {d.exito}
          <button onClick={() => d.setExito(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {d.error && (
        <div className="gt-alert gt-alert-error">
          {d.error}
          <button onClick={() => d.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Formulario */}
      <div ref={formRef} className="gt-card" style={{ marginBottom: 20 }}>
        <p className="gt-card-title">{d.editando !== null ? 'Editar disciplina' : 'Nueva disciplina'}</p>
        <form onSubmit={d.handleSubmit}>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label">Nombre *</label>
              <input className="gt-input" value={d.form.nombre} onChange={e => d.setForm({ ...d.form, nombre: e.target.value })} placeholder="Ej: CrossFit" />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Instructor</label>
              <input className="gt-input" value={d.form.instructor} onChange={e => d.setForm({ ...d.form, instructor: e.target.value })} placeholder="Nombre del profesor" />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Cupo máximo</label>
              <input className="gt-input" type="number" value={d.form.cupoMaximo}
                onChange={e => d.setForm({ ...d.form, cupoMaximo: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="Ej: 20" />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Hora inicio</label>
              <input className="gt-input" type="time" value={d.form.horaInicio} onChange={e => d.setForm({ ...d.form, horaInicio: e.target.value })} />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Hora fin</label>
              <input className="gt-input" type="time" value={d.form.horaFin} onChange={e => d.setForm({ ...d.form, horaFin: e.target.value })} />
            </div>
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Días de la semana</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {d.DIAS.map(dia => {
                  const sel = d.form.diasSemana.includes(dia)
                  return (
                    <button key={dia} type="button" onClick={() => d.toggleDia(dia)}
                      style={{ padding: '4px 12px', borderRadius: 20, border: '1.5px solid',
                        borderColor: sel ? 'var(--blue-text)' : 'var(--border)',
                        background: sel ? 'var(--blue-bg)' : 'var(--bg-surface-2)',
                        color: sel ? 'var(--blue-text)' : 'var(--text-muted)',
                        fontWeight: sel ? 600 : 400, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {d.DIAS_CORTO[dia]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Descripción</label>
              <textarea className="gt-textarea" rows={2} value={d.form.descripcion}
                onChange={e => d.setForm({ ...d.form, descripcion: e.target.value })}
                placeholder="Descripción de la disciplina" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="gt-btn gt-btn-primary">
              {d.editando !== null ? 'Actualizar' : 'Crear disciplina'}
            </button>
            {d.editando !== null && (
              <button type="button" className="gt-btn gt-btn-secondary" onClick={d.cancelarEdicion}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      {/* Lista */}
      {d.disciplinas.length === 0 ? (
        <div className="gt-empty"><p>No hay disciplinas registradas</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {d.disciplinas.map(disc => {
            const dias: string[] = disc.diasSemana ?? []
            return (
              <div key={disc.id} className="gt-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="gt-fw-600" style={{ fontSize: 16, color: 'var(--text-primary)' }}>{disc.nombre}</span>
                      <span className={disc.activa ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-gray'}>{disc.activa ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    {disc.instructor && <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-muted)' }}>👤 {disc.instructor}</p>}
                    {(disc.horaInicio || disc.horaFin) && <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-muted)' }}>🕐 {disc.horaInicio || '—'} – {disc.horaFin || '—'}</p>}
                    {disc.cupoMaximo != null && <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-muted)' }}>👥 Cupo: <strong>{disc.cupoMaximo}</strong> máx.</p>}
                    {disc.descripcion && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{disc.descripcion}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }} onClick={() => d.handleEditar(disc)}>Editar</button>
                    {disc.activa && (
                      <>
                        <button className="gt-btn" style={{ fontSize: 12, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', border: '1px solid var(--border)' }}
                          disabled={d.renovando === disc.id} onClick={() => d.handleRenovarMes(disc.id, disc.nombre)}>
                          {d.renovando === disc.id ? 'Renovando...' : '🔄 Renovar mes'}
                        </button>
                        <button className="gt-btn gt-btn-danger" style={{ fontSize: 12 }} onClick={() => d.handleDesactivar(disc.id)}>Desactivar</button>
                      </>
                    )}
                  </div>
                </div>
                {disc.cupoMaximo != null && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: (disc.cuposDisponibles ?? disc.cupoMaximo) === 0 ? 'var(--red)' : 'var(--green-text)' }}>
                      {(disc.cuposDisponibles ?? disc.cupoMaximo) === 0 ? '🔴 Sin cupos disponibles' : `🟢 ${disc.cuposDisponibles} cupo${disc.cuposDisponibles === 1 ? '' : 's'} disponible${disc.cuposDisponibles === 1 ? '' : 's'}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({disc.totalInscritos ?? 0} / {disc.cupoMaximo} inscriptos)</span>
                  </div>
                )}
                {disc.sociosInscritos && disc.sociosInscritos.length > 0 && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>Ver alumnos ({disc.sociosInscritos.length})</summary>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {disc.sociosInscritos.map((nombre: string, i: number) => (
                        <span key={i} style={{ fontSize: 12, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 12, padding: '2px 8px' }}>{nombre}</span>
                      ))}
                    </div>
                  </details>
                )}
                {dias.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {d.DIAS.map(dia => {
                        const activo = dias.includes(dia)
                        return (
                          <div key={dia} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 8,
                            background: activo ? 'var(--blue-text)' : 'var(--bg-surface-3)',
                            color: activo ? '#fff' : 'var(--text-muted)', fontWeight: activo ? 700 : 400, fontSize: 11 }}>
                            {d.DIAS_CORTO[dia]}
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
