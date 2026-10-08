import { Link } from 'react-router-dom'
import { ClipboardList, LayoutTemplate, Plus, Search, Trash2, UserRound } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useRutinasList } from '../hooks/useRutinasList'
import RutinaCard from './RutinaCard'
import { TREN_CONFIG, DIFICULTAD_CONFIG, OBJETIVO_CONFIG, linkRutina, linkEditarRutina } from '../utils/rutinaUtils'
import { EmptyState, PageHeader, Segmentado, SkeletonTarjetas } from '../../../shared/components/ui'

export default function RutinasList() {
  const r = useRutinasList()

  return (
    <>
      <PageHeader titulo="Rutinas"
        subtitulo={r.esStaff ? 'Plantillas para reutilizar y rutinas personalizadas de cada socio' : 'Tus rutinas asignadas'}
        acciones={r.esStaff && (
          <>
            <Link to="/rutinas/nueva?general=true" className="gt-btn gt-btn-secondary"><LayoutTemplate size={16} aria-hidden /> Nueva plantilla</Link>
            <Link to="/rutinas/asignar" className="gt-btn gt-btn-primary"><Plus size={16} aria-hidden /> Asignar a un socio</Link>
          </>
        )} />

      {r.error && (
        <div className="gt-alert gt-alert-error">
          {r.error}
          <button onClick={() => r.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} aria-label="Cerrar">✕</button>
        </div>
      )}

      {r.esStaff && (
        <div style={{ marginBottom: 12, overflowX: 'auto' }}>
          <Segmentado etiqueta="Tipo de rutina" valor={r.tab} onChange={r.cambiarTab} opciones={[
            { valor: 'plantillas', texto: 'Plantillas', icono: LayoutTemplate, cuenta: r.plantillas.length },
            { valor: 'asignadas', texto: 'De socios', icono: UserRound, cuenta: r.asignadas.length },
          ]} />
        </div>
      )}

      {/* Filtros */}
      <div className="gt-toolbar-fila">
        <div className="gt-busqueda">
          <Search size={16} aria-hidden />
          <input className="gt-input" type="text" value={r.busqueda} onChange={e => r.setBusqueda(e.target.value)} aria-label="Buscar rutina"
            placeholder={r.tab === 'asignadas' && r.esStaff ? 'Buscar por rutina o socio…' : 'Buscar por nombre…'} />
        </div>
        <select className="gt-select" value={r.filtroObjetivo} onChange={e => r.setFiltroObjetivo(e.target.value)} aria-label="Objetivo">
          <option value="">Cualquier objetivo</option>
          {Object.entries(OBJETIVO_CONFIG).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
        </select>
        <select className="gt-select" value={r.filtroTren} onChange={e => r.setFiltroTren(e.target.value)} aria-label="Zona">
          <option value="">Cualquier zona</option>
          {Object.entries(TREN_CONFIG).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
        </select>
        <select className="gt-select" value={r.filtroDificultad} onChange={e => r.setFiltroDificultad(e.target.value)} aria-label="Nivel">
          <option value="">Cualquier nivel</option>
          {Object.entries(DIFICULTAD_CONFIG).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
        </select>
        {r.hayFiltros && <button type="button" className="gt-btn-link" onClick={r.resetFiltros}>Limpiar</button>}
        <span className="gt-text-sm gt-text-muted" style={{ marginLeft: 'auto' }}>{r.lista.length} {r.lista.length === 1 ? 'rutina' : 'rutinas'}</span>
      </div>

      {r.cargando ? (
        <SkeletonTarjetas cantidad={6} alto={170} />
      ) : r.lista.length === 0 ? (
        <div className="gt-card">
          <EmptyState icono={ClipboardList}
            titulo={r.hayFiltros ? 'Ninguna rutina coincide' : r.tab === 'plantillas' ? 'Todavía no hay plantillas' : 'Todavía no hay rutinas asignadas'}
            texto={r.hayFiltros ? 'Probá con otros filtros.' : r.tab === 'plantillas' ? 'Armá una vez y asignala a todos los socios que quieras.' : undefined}
            accion={r.esStaff && !r.hayFiltros && (
              <Link to={r.tab === 'plantillas' ? '/rutinas/nueva?general=true' : '/rutinas/asignar'} className="gt-btn gt-btn-primary">
                {r.tab === 'plantillas' ? 'Crear la primera plantilla' : 'Asignar una rutina'}
              </Link>
            )} />
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
                      {r.guardandoPlantillaId === rutina.id ? '…' : 'Hacer plantilla'}
                    </button>
                  )}
                  {r.esStaff && <Link to={linkEditarRutina(rutina, r.esStaff)}>Editar</Link>}
                  {r.esStaff && (
                    <button type="button" className="peligro" onClick={() => r.setConfirmarEliminar(rutina)} aria-label={`Eliminar ${rutina.nombre}`} title="Eliminar" style={{ flex: '0 0 44px' }}><Trash2 size={15} aria-hidden /></button>
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
