import { Link } from 'react-router-dom'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useRutinasList, type Tab } from '../hooks/useRutinasList'
import RutinaCard from './RutinaCard'
import { TREN_CONFIG, DIFICULTAD_CONFIG, OBJETIVO_CONFIG, linkRutina, linkEditarRutina } from '../utils/rutinaUtils'

const TABS: { id: Tab; label: string; ayuda: string }[] = [
  { id: 'plantillas', label: '📋 Plantillas', ayuda: 'Rutinas modelo reutilizables. Se copian al socio cuando las asignás.' },
  { id: 'asignadas',  label: '👤 Asignadas a socios', ayuda: 'Rutinas personales de cada socio (copias de plantillas o creadas a medida).' },
]

export default function RutinasList() {
  const r = useRutinasList()

  return (
    <>
      <div className="gt-section-header">
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Rutinas</h1>
          <p className="gt-text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            {r.esStaff ? 'Plantillas reutilizables y rutinas personalizadas de cada socio' : 'Tus rutinas asignadas'}
          </p>
        </div>
        {r.esStaff && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/rutinas/nueva?general=true" className="gt-btn gt-btn-secondary">+ Nueva plantilla</Link>
            <Link to="/rutinas/asignar" className="gt-btn gt-btn-primary">Asignar rutina a un socio</Link>
          </div>
        )}
      </div>

      {r.error && (
        <div className="gt-alert gt-alert-error">
          {r.error}
          <button onClick={() => r.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {r.esStaff && (
        <>
          <div className="gt-tabs" style={{ marginBottom: 8 }}>
            {TABS.map(t => (
              <button key={t.id} className={`gt-tab${r.tab === t.id ? ' active' : ''}`} onClick={() => r.cambiarTab(t.id)}>
                {t.label}
                <span className="gt-badge gt-badge-gray" style={{ marginLeft: 6 }}>
                  {t.id === 'plantillas' ? r.plantillas.length : r.asignadas.length}
                </span>
              </button>
            ))}
          </div>
          <p className="gt-hint" style={{ margin: '0 0 14px' }}>{TABS.find(t => t.id === r.tab)!.ayuda}</p>
        </>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input className="gt-input" style={{ maxWidth: 280 }} type="text"
          placeholder={r.tab === 'asignadas' && r.esStaff ? 'Buscar por rutina o socio…' : 'Buscar por nombre…'}
          value={r.busqueda} onChange={e => r.setBusqueda(e.target.value)} />
        {Object.entries(TREN_CONFIG).map(([id, cfg]) => (
          <button key={id} type="button" className={`gt-option${r.filtroTren === id ? ' selected' : ''}`} style={{ padding: '4px 10px' }}
            onClick={() => r.setFiltroTren(r.filtroTren === id ? '' : id)}>{cfg.emoji} {cfg.label}</button>
        ))}
        {Object.entries(OBJETIVO_CONFIG).map(([id, cfg]) => (
          <button key={id} type="button" className={`gt-option${r.filtroObjetivo === id ? ' selected' : ''}`} style={{ padding: '4px 10px' }}
            onClick={() => r.setFiltroObjetivo(r.filtroObjetivo === id ? '' : id)}>{cfg.emoji} {cfg.label}</button>
        ))}
        {Object.entries(DIFICULTAD_CONFIG).map(([id, cfg]) => (
          <button key={id} type="button" className={`gt-option${r.filtroDificultad === id ? ' selected' : ''}`} style={{ padding: '4px 10px' }}
            onClick={() => r.setFiltroDificultad(r.filtroDificultad === id ? '' : id)}>{cfg.label}</button>
        ))}
        {r.hayFiltros && <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }} onClick={r.resetFiltros}>Limpiar filtros</button>}
      </div>

      {r.cargando ? (
        <p className="gt-text-muted" style={{ textAlign: 'center', padding: 40 }}>Cargando rutinas...</p>
      ) : r.lista.length === 0 ? (
        <div className="gt-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🏋️</p>
          <p className="gt-text-muted" style={{ margin: 0 }}>
            {r.hayFiltros ? 'No hay rutinas que coincidan con los filtros.'
              : r.tab === 'plantillas' ? 'Todavía no hay plantillas. Creá una y reutilizala con todos tus socios.'
              : 'Todavía no hay rutinas asignadas.'}
          </p>
          {r.esStaff && !r.hayFiltros && (
            <Link to={r.tab === 'plantillas' ? '/rutinas/nueva?general=true' : '/rutinas/asignar'} className="gt-btn gt-btn-primary" style={{ marginTop: 16 }}>
              {r.tab === 'plantillas' ? 'Crear primera plantilla' : 'Asignar una rutina'}
            </Link>
          )}
        </div>
      ) : (
        <div className="gt-rutina-grid">
          {r.lista.map(rutina => (
            <RutinaCard key={rutina.id} rutina={rutina} mostrarSocio={r.esStaff}
              acciones={
                <>
                  <Link to={linkRutina(rutina, r.esStaff)}>Abrir</Link>
                  {r.esStaff && r.tab === 'plantillas' && (
                    <Link to={`/rutinas/asignar?plantillaId=${rutina.id}`}>Asignar</Link>
                  )}
                  {r.esStaff && r.tab === 'asignadas' && (
                    <button type="button" onClick={() => r.guardarComoPlantilla(rutina)} disabled={r.guardandoPlantillaId === rutina.id}
                      title="Crear una plantilla reutilizable a partir de esta rutina">
                      {r.guardandoPlantillaId === rutina.id ? '…' : '→ Plantilla'}
                    </button>
                  )}
                  {r.esStaff && <Link to={linkEditarRutina(rutina, r.esStaff)}>Editar</Link>}
                  {r.esStaff && (
                    <button type="button" className="peligro" onClick={() => r.setConfirmarEliminar(rutina)} aria-label={`Eliminar ${rutina.nombre}`}>🗑</button>
                  )}
                </>
              } />
          ))}
        </div>
      )}

      <ConfirmModal
        open={r.confirmarEliminar !== null}
        title={r.tab === 'plantillas' ? 'Eliminar plantilla' : 'Eliminar rutina'}
        message={r.confirmarEliminar
          ? r.tab === 'plantillas'
            ? `¿Eliminar la plantilla "${r.confirmarEliminar.nombre}"? Las rutinas que ya asignaste a socios no se borran.`
            : `¿Eliminar "${r.confirmarEliminar.nombre}" de ${r.confirmarEliminar.socioNombre ?? 'este socio'}? Se pierden sus ejercicios y el progreso.`
          : ''}
        confirmLabel="Eliminar" danger
        onConfirm={r.confirmarEliminarRutina}
        onCancel={() => r.setConfirmarEliminar(null)}
      />
    </>
  )
}
