import type { DisciplinaApi } from '../services/disciplinaService'
import { colorDisciplina, resumenHorarios } from '../utils/disciplinaUtils'
import CupoMeter from './CupoMeter'

/** Tarjeta de la vista lista */
export default function DisciplinaCard({ d, onAlumnos, onEditar, onCambiarActiva }: {
  d: DisciplinaApi
  onAlumnos: () => void
  onEditar: () => void
  onCambiarActiva: () => void
}) {
  const horarios = resumenHorarios(d.horarios)
  const sinVigencia = (d.inscriptos ?? []).filter(i => !i.activo || !i.membresiaVigente).length
  return (
    <div className={`gt-disc-card${d.activa ? '' : ' inactiva'}`} style={{ ['--c' as string]: colorDisciplina(d.color) }}>
      <div className="gt-disc-card-cuerpo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 className="gt-disc-nombre">{d.nombre}</h3>
          {d.esMia && <span className="gt-badge gt-badge-green">Tu clase</span>}
          {!d.activa && <span className="gt-badge gt-badge-gray">Inactiva</span>}
        </div>
        <p className="gt-text-sm gt-text-muted" style={{ margin: '2px 0 8px' }}>
          {d.instructor ? `Con ${d.instructor}` : 'Sin instructor asignado'}
        </p>
        {horarios.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {horarios.map(h => <span key={h} className="gt-text-sm" style={{ color: 'var(--text-secondary)' }}>{h}</span>)}
          </div>
        ) : <span className="gt-text-sm gt-text-muted">Sin horarios cargados</span>}
        {d.descripcion && <p className="gt-text-sm gt-text-muted gt-disc-desc">{d.descripcion}</p>}
      </div>

      <div className="gt-disc-card-lado">
        <CupoMeter total={d.totalInscritos} cupo={d.cupoMaximo} compacto />
        {sinVigencia > 0 && <span className="gt-text-sm" style={{ color: 'var(--yellow-text)' }}>⚠ {sinVigencia} sin membresía vigente</span>}
      </div>

      <div className="gt-rutina-card-actions">
        <button type="button" onClick={onAlumnos}>Alumnos ({d.inscriptos?.length ?? d.totalInscritos})</button>
        <button type="button" onClick={onEditar}>Editar</button>
        <button type="button" className={d.activa ? 'peligro' : ''} onClick={onCambiarActiva}>{d.activa ? 'Desactivar' : 'Reactivar'}</button>
      </div>
    </div>
  )
}
