import { useState } from 'react'
import { KeyRound, Search, UserPlus, Users } from 'lucide-react'
import SocioForm from '../components/SocioForm'
import SocioTabla from '../components/SocioTabla'
import BajaSocioModal from '../components/BajaSocioModal'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { EmptyState, PageHeader, Resumen, Segmentado, Skeleton } from '../../../shared/components/ui'
import { PinEntregaModal, PinesPendientesModal } from '../components/PinModales'
import { useAuth } from '../../../shared/context/AuthContext'
import { useSociosPage } from '../hooks/useSociosPage'
import type { AltaSocioRequestDTO } from '../services/socioService'

export default function SociosPage() {
  const p = useSociosPage()
  const { user } = useAuth()
  const esAdmin = user?.rol === 'ADMIN'
  const [altaAbierta, setAltaAbierta] = useState(false)
  const [registrando, setRegistrando] = useState(false)

  const registrar = async (data: AltaSocioRequestDTO) => {
    setRegistrando(true)
    try { if (await p.handleAltaCompleta(data)) setAltaAbierta(false) } finally { setRegistrando(false) }
  }
  const filtrarMem = (f: '' | 'VENCIDA' | 'SIN_MEMBRESIA') => {
    p.setVista('activos'); p.setFiltroMem(p.filtroMem === f ? '' : f); p.setPagina(1)
  }

  return (
    <>
      <PageHeader titulo="Socios" subtitulo={`${p.activos} activos · ${p.inactivos} dados de baja`}
        acciones={<>
          {esAdmin && (
            <button type="button" className="gt-btn gt-btn-secondary" disabled={p.generandoPines}
              onClick={p.handleGenerarPinesPendientes} title="Genera el PIN de acceso de los socios activos que todavía no tienen">
              <KeyRound size={16} aria-hidden /> {p.generandoPines ? 'Generando…' : 'PIN pendientes'}
            </button>
          )}
          <button type="button" className="gt-btn gt-btn-primary" onClick={() => setAltaAbierta(true)}>
            <UserPlus size={16} aria-hidden /> Nuevo socio
          </button>
        </>} />

      {p.error && (
        <div className="gt-alert gt-alert-error" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {p.error}
          <button type="button" onClick={() => p.setError('')} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {!p.cargando && p.socios.length > 0 && (
        <Resumen items={[
          { valor: p.activos, texto: 'socios activos' },
          { valor: p.porMembresia.ACTIVA, texto: 'al día', tono: 'ok' },
          { valor: p.porMembresia.VENCIDA, texto: 'con la cuota vencida', tono: p.porMembresia.VENCIDA ? 'danger' : 'ok', onClick: () => filtrarMem('VENCIDA'), activo: p.filtroMem === 'VENCIDA' },
          { valor: p.porMembresia.SIN_MEMBRESIA, texto: 'sin membresía', tono: p.porMembresia.SIN_MEMBRESIA ? 'warn' : 'ok', onClick: () => filtrarMem('SIN_MEMBRESIA'), activo: p.filtroMem === 'SIN_MEMBRESIA' },
        ]} />
      )}

      <div className="gt-toolbar-fila">
        <div className="gt-busqueda">
          <Search size={16} aria-hidden />
          <input className="gt-input" placeholder="Buscar por nombre, DNI o email…" value={p.busqueda}
            onChange={e => { p.setBusqueda(e.target.value); p.setPagina(1) }} aria-label="Buscar socio" />
        </div>
        <Segmentado etiqueta="Socios" valor={p.vista} onChange={v => { p.setVista(v); p.setFiltroMem(''); p.setPagina(1) }} opciones={[
          { valor: 'activos', texto: 'Activos', cuenta: p.activos },
          { valor: 'inactivos', texto: 'De baja', cuenta: p.inactivos },
          { valor: 'todos', texto: 'Todos' },
        ]} />
        {(p.busqueda || p.filtroMem) && (
          <span className="gt-text-sm gt-text-muted">{p.sociosFiltrados.length} resultado{p.sociosFiltrados.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {p.cargando ? (
        <div className="gt-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} alto={44} />)}
        </div>
      ) : p.socios.length === 0 ? (
        <div className="gt-card">
          <EmptyState icono={Users} titulo="Todavía no hay socios"
            texto="Registrá el primero: se carga el socio, se cobra el plan y queda con la membresía activa."
            accion={<button type="button" className="gt-btn gt-btn-primary" onClick={() => setAltaAbierta(true)}><UserPlus size={16} aria-hidden /> Nuevo socio</button>} />
        </div>
      ) : p.sociosFiltrados.length === 0 ? (
        <div className="gt-card">
          <EmptyState icono={Search} titulo="Ningún socio coincide"
            accion={<button type="button" className="gt-btn gt-btn-secondary" onClick={() => { p.setBusqueda(''); p.setFiltroMem('') }}>Limpiar filtros</button>} />
        </div>
      ) : (
        <SocioTabla
          socios={p.sociosPagina}
          onEditar={p.setSocioEditar}
          onEliminar={p.handleEliminar}
          onReactivar={p.handleReactivar}
          onEliminarPermanente={id => p.setConfirmarEliminarId(id)}
          membresiaMap={p.membresiaMap}
          bajaPorSocio={p.bajaPorSocio}
        />
      )}

      {p.totalPaginas > 1 && (
        <div className="gt-paginado">
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm"
            disabled={p.paginaActual === 1} onClick={() => p.setPagina(prev => prev - 1)}>← Anterior</button>
          <span className="gt-text-sm gt-text-muted">Página {p.paginaActual} de {p.totalPaginas} · {p.sociosFiltrados.length} socios</span>
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm"
            disabled={p.paginaActual === p.totalPaginas} onClick={() => p.setPagina(prev => prev + 1)}>Siguiente →</button>
        </div>
      )}

      {(altaAbierta || p.socioEditar) && (
        <SocioForm
          onGuardar={p.handleEditar}
          onAltaCompleta={registrar}
          socioEditar={p.socioEditar}
          guardando={registrando}
          onCancelar={() => { setAltaAbierta(false); p.setSocioEditar(null) }}
        />
      )}
      {p.socioBaja && (
        <BajaSocioModal nombre={`${p.socioBaja.nombre} ${p.socioBaja.apellido}`}
          onConfirmar={p.confirmarBaja} onCerrar={() => p.setSocioBaja(null)} />
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
