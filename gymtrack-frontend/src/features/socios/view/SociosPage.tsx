import SocioForm from '../components/SocioForm'
import SocioTabla from '../components/SocioTabla'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { PinEntregaModal, PinesPendientesModal } from '../components/PinModales'
import { useAuth } from '../../../shared/context/AuthContext'
import { useSociosPage } from '../hooks/useSociosPage'

export default function SociosPage() {
  const p = useSociosPage()
  const { user } = useAuth()
  const esAdmin = user?.rol === 'ADMIN'

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>
          Socios
          <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7280', marginLeft: 12 }}>
            {p.activos} activos · {p.inactivos} inactivos
          </span>
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {esAdmin && (
            <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13 }} disabled={p.generandoPines}
              onClick={p.handleGenerarPinesPendientes} title="Genera el PIN de acceso de los socios activos que todavía no tienen">
              🔑 {p.generandoPines ? 'Generando…' : 'PIN pendientes'}
            </button>
          )}
          <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13 }} onClick={() => p.setVerInactivos(v => !v)}>
            {p.verInactivos ? 'Ver solo activos' : 'Ver todos (con inactivos)'}
          </button>
        </div>
      </div>

      {p.error && (
        <div className="gt-alert gt-alert-error">
          {p.error}
          <button onClick={() => p.setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      <SocioForm
        onGuardar={p.handleEditar}
        onAltaCompleta={p.handleAltaCompleta}
        socioEditar={p.socioEditar}
        onCancelar={() => p.setSocioEditar(null)}
      />

      <div style={{ margin: '12px 0' }}>
        <input className="gt-input" style={{ maxWidth: 380 }} type="text"
          placeholder="Buscar por nombre, apellido, DNI o email..."
          value={p.busqueda} onChange={e => { p.setBusqueda(e.target.value); p.setPagina(1) }} />
        {p.busqueda && (
          <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)' }}>
            {p.sociosFiltrados.length} resultado{p.sociosFiltrados.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <SocioTabla
        socios={p.sociosPagina}
        onEditar={p.setSocioEditar}
        onEliminar={p.handleEliminar}
        onReactivar={p.handleReactivar}
        onEliminarPermanente={id => p.setConfirmarEliminarId(id)}
        membresiaMap={p.membresiaMap}
      />

      {p.totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13, padding: '4px 12px' }}
            disabled={p.paginaActual === 1} onClick={() => p.setPagina(prev => prev - 1)}>← Anterior</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Página {p.paginaActual} de {p.totalPaginas}
            <span style={{ marginLeft: 8, color: 'var(--text-xmuted)' }}>({p.sociosFiltrados.length} socios)</span>
          </span>
          <button className="gt-btn gt-btn-secondary" style={{ fontSize: 13, padding: '4px 12px' }}
            disabled={p.paginaActual === p.totalPaginas} onClick={() => p.setPagina(prev => prev + 1)}>Siguiente →</button>
        </div>
      )}

      {p.pinAlta && <PinEntregaModal {...p.pinAlta} onCerrar={() => p.setPinAlta(null)} />}
      {p.pinesPendientes && <PinesPendientesModal pines={p.pinesPendientes} onCerrar={() => p.setPinesPendientes(null)} />}

      <ConfirmModal
        open={p.confirmarEliminarId !== null}
        title="Eliminar socio permanentemente"
        message="Esta acción borrará al socio y TODOS sus datos: membresías, pagos, rutinas y asistencias. No se puede deshacer."
        confirmLabel="Eliminar permanentemente"
        cancelLabel="Cancelar"
        danger
        onConfirm={p.confirmarEliminar}
        onCancel={() => p.setConfirmarEliminarId(null)}
      />
    </>
  )
}
