import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useDisciplinas } from '../hooks/useDisciplinas'
import HorarioSemanal from '../components/HorarioSemanal'
import DisciplinaCard from '../components/DisciplinaCard'
import DisciplinaFormModal from '../components/DisciplinaFormModal'
import AlumnosModal from '../components/AlumnosModal'
import { colorDisciplina } from '../utils/disciplinaUtils'

/**
 * Disciplinas (clases grupales): calendario semanal o lista, alumnos por clase,
 * cupos y horarios por día.
 */
export default function DisciplinasPage() {
  const d = useDisciplinas()
  const formAbierto = d.formulario !== null
  const editando = d.formulario !== 'nueva' ? d.formulario : null

  return (
    <>
      <div className="gt-section-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Disciplinas</h1>
          <p className="gt-text-muted" style={{ margin: '2px 0 0' }}>Clases grupales, horarios y cupos</p>
        </div>
        <button type="button" className="gt-btn gt-btn-primary" onClick={() => d.setFormulario('nueva')}>+ Nueva disciplina</button>
      </div>

      {d.error && <div className="gt-alert gt-alert-error">{d.error}</div>}

      {/* Resumen */}
      {!d.cargando && d.disciplinas.length > 0 && (
        <div className="gt-disc-resumen">
          <div><strong>{d.resumen.activas}</strong><span>disciplinas activas</span></div>
          <div><strong>{d.resumen.clasesSemana}</strong><span>clases por semana</span></div>
          <div><strong>{d.resumen.inscriptos}</strong><span>inscripciones</span></div>
          <div><strong>{d.resumen.completas}</strong><span>{d.resumen.completas === 1 ? 'completa' : 'completas'}</span></div>
        </div>
      )}

      {/* Barra de herramientas */}
      {d.disciplinas.length > 0 && (
        <div className="gt-disc-barra">
          <div className="gt-segmentado" role="tablist" aria-label="Vista">
            <button type="button" role="tab" aria-selected={d.vista === 'semana'} className={d.vista === 'semana' ? 'activo' : ''} onClick={() => d.setVista('semana')}>📅 Semana</button>
            <button type="button" role="tab" aria-selected={d.vista === 'lista'} className={d.vista === 'lista' ? 'activo' : ''} onClick={() => d.setVista('lista')}>☰ Lista</button>
          </div>
          <input className="gt-input" style={{ flex: 1, minWidth: 160, maxWidth: 280 }} placeholder="Buscar disciplina o instructor…"
            value={d.busqueda} onChange={e => d.setBusqueda(e.target.value)} aria-label="Buscar" />
          {d.nombresInstructores.length > 1 && (
            <select className="gt-select" style={{ width: 'auto' }} value={d.filtroInstructor} onChange={e => d.setFiltroInstructor(e.target.value)} aria-label="Instructor">
              <option value="">Todos los instructores</option>
              {d.nombresInstructores.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <label className="gt-text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={d.verInactivas} onChange={e => d.setVerInactivas(e.target.checked)} /> Ver inactivas
          </label>
        </div>
      )}

      {/* Leyenda: el color siempre acompaña al nombre */}
      {d.vista === 'semana' && d.visibles.length > 0 && (
        <div className="gt-disc-leyenda" aria-label="Referencias de colores">
          {d.visibles.filter(x => x.activa).map(x => (
            <button key={x.id} type="button" className="gt-disc-leyenda-item" onClick={() => d.setAlumnosDe(x)}>
              <span className="gt-disc-punto" style={{ background: colorDisciplina(x.color) }} aria-hidden />{x.nombre}
            </button>
          ))}
        </div>
      )}

      {d.cargando ? <p className="gt-text-muted">Cargando…</p>
        : d.disciplinas.length === 0 ? (
          <div className="gt-card gt-empty" style={{ padding: '40px 20px' }}>
            <p style={{ fontSize: 34, margin: 0 }}>🧘</p>
            <p style={{ margin: '8px 0 14px' }}>Todavía no hay disciplinas. Creá la primera (Funcional, Yoga, Spinning…) con sus días, horarios y cupo.</p>
            <button type="button" className="gt-btn gt-btn-primary" onClick={() => d.setFormulario('nueva')}>+ Crear disciplina</button>
          </div>
        ) : d.visibles.length === 0 ? (
          <div className="gt-empty">Ninguna disciplina coincide con los filtros.</div>
        ) : d.vista === 'semana' ? (
          <div className="gt-card gt-card-semana">
            <HorarioSemanal disciplinas={d.visibles.filter(x => x.activa)} onAbrir={x => d.setAlumnosDe(x)} />
          </div>
        ) : (
          <div className="gt-disc-grid">
            {d.visibles.map(x => (
              <DisciplinaCard key={x.id} d={x}
                onAlumnos={() => d.setAlumnosDe(x)}
                onEditar={() => d.setFormulario(x)}
                onCambiarActiva={() => d.setConfirmarActiva(x)} />
            ))}
          </div>
        )}

      {formAbierto && (
        <DisciplinaFormModal inicial={editando} instructores={d.instructores} colorSugerido={d.colorSugerido}
          onGuardar={d.guardar} onCerrar={() => d.setFormulario(null)} />
      )}
      {d.alumnosDe && (
        <AlumnosModal disciplina={d.alumnosDe} onCambio={d.reemplazar}
          onEditar={() => { const x = d.alumnosDe; d.setAlumnosDe(null); d.setFormulario(x) }}
          onCerrar={() => d.setAlumnosDe(null)} />
      )}
      <ConfirmModal
        open={d.confirmarActiva !== null}
        title={d.confirmarActiva?.activa ? 'Desactivar disciplina' : 'Reactivar disciplina'}
        message={d.confirmarActiva?.activa
          ? `“${d.confirmarActiva?.nombre}” deja de aparecer en el calendario y no admite inscripciones nuevas. Los inscriptos se conservan y se puede reactivar cuando quieras.`
          : `“${d.confirmarActiva?.nombre}” vuelve a aparecer en el calendario.`}
        confirmLabel={d.confirmarActiva?.activa ? 'Desactivar' : 'Reactivar'}
        cancelLabel="Cancelar"
        danger={!!d.confirmarActiva?.activa}
        onConfirm={d.cambiarActiva}
        onCancel={() => d.setConfirmarActiva(null)}
      />
    </>
  )
}
