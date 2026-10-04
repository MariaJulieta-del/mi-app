import { useState } from 'react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useMaquinas } from '../hooks/useMaquinas'
import { useMantenimientos } from '../hooks/useMantenimientos'
import { MACHINES_CATALOG } from '../assets/maquinasCatalog'
import CatalogoMaquinasTab from '../components/tabs/CatalogoMaquinasTab'
import MisMaquinasTab from '../components/tabs/MisMaquinasTab'
import MantenimientoTab from '../components/tabs/MantenimientoTab'

type Tab = 'catalogo' | 'mis' | 'mantenimiento'

export default function MaquinasPage() {
  const [tab, setTab] = useState<Tab>('catalogo')
  const maq = useMaquinas()
  const mant = useMantenimientos()

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: '8px 8px 0 0', fontSize: 14, fontWeight: tab === t ? 700 : 500,
    border: '1.5px solid', borderBottom: 'none', cursor: 'pointer', transition: 'all 0.1s',
    background: tab === t ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
    color: tab === t ? '#D97706' : 'var(--text-muted)',
    borderColor: tab === t ? '#D97706' : 'var(--border)',
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Máquinas</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Equipamiento del gimnasio con seguimiento de mantenimiento
          </p>
        </div>
        {tab === 'mis' && (
          <button className="gt-btn gt-btn-primary" onClick={maq.abrirNuevo}>+ Nueva máquina</button>
        )}
        {tab === 'mantenimiento' && (
          <button className="gt-btn gt-btn-primary" onClick={mant.abrirNuevoMant}>+ Registrar mantenimiento</button>
        )}
      </div>

      {/* Mensajes globales */}
      {maq.msg && (
        <div className="gt-alert gt-alert-success" style={{ marginBottom: 12 }}>
          {maq.msg}
          <button onClick={() => maq.setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {maq.error && tab === 'mis' && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
          {maq.error}
          <button onClick={() => maq.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {mant.mantMsg && (
        <div className="gt-alert gt-alert-success" style={{ marginBottom: 12 }}>
          {mant.mantMsg}
          <button onClick={() => mant.setMantMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: -1, position: 'relative', zIndex: 1 }}>
        <button style={tabStyle('catalogo')} onClick={() => setTab('catalogo')}>
          📚 Catálogo ({MACHINES_CATALOG.length})
        </button>
        <button style={tabStyle('mis')} onClick={() => setTab('mis')}>
          ⭐ Mis máquinas ({maq.maquinas.filter(m => m.activa).length})
        </button>
        <button style={tabStyle('mantenimiento')} onClick={() => setTab('mantenimiento')}>
          🔧 Mantenimiento ({mant.mantenimientos.filter(m => m.tipo === 'PENDIENTE').length} pendientes)
        </button>
      </div>

      {tab === 'catalogo' && (
        <CatalogoMaquinasTab
          maquinas={maq.maquinas}
          ejercicios={maq.ejercicios}
          guardandoCat={maq.guardandoCat}
          catError={maq.catError}
          setCatError={maq.setCatError}
          onGuardar={maq.guardarDeCatalogo}
        />
      )}

      {tab === 'mis' && (
        <MisMaquinasTab
          maquinas={maq.maquinas}
          ejercicios={maq.ejercicios}
          filtradas={maq.filtradas}
          busqueda={maq.busqueda}
          setBusqueda={maq.setBusqueda}
          filtroGrupo={maq.filtroGrupo}
          setFiltroGrupo={maq.setFiltroGrupo}
          verInactivas={maq.verInactivas}
          setVerInactivas={maq.setVerInactivas}
          showForm={maq.showForm}
          form={maq.form}
          setForm={maq.setForm}
          editandoId={maq.editandoId}
          guardando={maq.guardando}
          error={maq.error}
          setError={maq.setError}
          expandedId={maq.expandedId}
          statsCache={maq.statsCache}
          loadingStats={maq.loadingStats}
          abrirNuevo={maq.abrirNuevo}
          abrirEditar={maq.abrirEditar}
          cancelar={maq.cancelar}
          guardar={maq.guardar}
          toggleActiva={maq.toggleActiva}
          toggleExpand={maq.toggleExpand}
          toggleGrupoForm={maq.toggleGrupoForm}
          ejerciciosCompatibles={maq.ejerciciosCompatibles}
          onIrCatalogo={() => setTab('catalogo')}
          reportarId={maq.reportarId}
          reportarTipo={maq.reportarTipo}
          reportarDesc={maq.reportarDesc}
          setReportarDesc={maq.setReportarDesc}
          reportarCosto={maq.reportarCosto}
          setReportarCosto={maq.setReportarCosto}
          reportarGuardando={maq.reportarGuardando}
          reportarError={maq.reportarError}
          abrirMenuReportar={maq.abrirMenuReportar}
          abrirReportar={maq.abrirReportar}
          cerrarReportar={maq.cerrarReportar}
          submitReportar={maq.submitReportar}
        />
      )}

      {tab === 'mantenimiento' && (
        <MantenimientoTab
          maquinas={maq.maquinas}
          mantenimientos={mant.mantenimientos}
          mantFiltrados={mant.mantFiltrados}
          mantForm={mant.mantForm}
          setMantForm={mant.setMantForm}
          mantEditId={mant.mantEditId}
          mantShowForm={mant.mantShowForm}
          mantGuardando={mant.mantGuardando}
          mantError={mant.mantError}
          setMantError={mant.setMantError}
          mantFiltroMaquina={mant.mantFiltroMaquina}
          setMantFiltroMaquina={mant.setMantFiltroMaquina}
          mantFiltroTipo={mant.mantFiltroTipo}
          setMantFiltroTipo={mant.setMantFiltroTipo}
          abrirNuevoMant={mant.abrirNuevoMant}
          abrirEditarMant={mant.abrirEditarMant}
          cancelarMant={mant.cancelarMant}
          guardarMant={mant.guardarMant}
          onEliminar={id => mant.setConfirmarEliminarMantId(id)}
          cargarMantenimientos={mant.cargarMantenimientos}
        />
      )}

      <ConfirmModal
        open={mant.confirmarEliminarMantId !== null}
        title="Eliminar mantenimiento"
        message="¿Estás seguro que querés eliminar este registro de mantenimiento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => {
          const id = mant.confirmarEliminarMantId!
          mant.setConfirmarEliminarMantId(null)
          mant.eliminarMant(id)
        }}
        onCancel={() => mant.setConfirmarEliminarMantId(null)}
      />
    </div>
  )
}
