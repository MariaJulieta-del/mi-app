import { useState } from 'react'
import { BellRing, KeyRound, Search, UserPlus, Users, X } from 'lucide-react'
import SocioForm from '../components/SocioForm'
import SocioTabla from '../components/SocioTabla'
import BajaSocioModal from '../components/BajaSocioModal'
import { EmptyState, IconButton, PageHeader, Resumen, Segmentado, Skeleton } from '../../../shared/components/ui'
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
    if (registrando) return
    setRegistrando(true)
    try { if (await p.handleAltaCompleta(data)) setAltaAbierta(false) } finally { setRegistrando(false) }
  }
  const filtrarMem = (f: '' | 'VENCIDA' | 'SIN_MEMBRESIA') => {
    // Las vencidas tienen su propia solapa (con el botón para avisarles)
    if (f === 'VENCIDA') { p.setFiltroMem(''); p.setVista(p.vista === 'vencidas' ? 'activos' : 'vencidas'); p.setPagina(1); return }
    p.setVista('activos'); p.setFiltroMem(p.filtroMem === f ? '' : f); p.setPagina(1)
  }

  const d = p.datos
  const c = d?.conteos
  const hayFiltros = !!(p.busqueda.trim() || p.filtroMem)

  return (
    <>
      <PageHeader titulo="Socios" subtitulo={c ? `${c.activos} activos · ${c.inactivos} dados de baja` : 'Cargando…'}
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
        <div className="gt-alert gt-alert-error gt-alert-cerrable" role="alert">
          <span>{p.error}</span>
          <IconButton icono={X} etiqueta="Cerrar aviso" onClick={() => p.setError('')} />
        </div>
      )}

      {c && c.activos + c.inactivos > 0 && (
        <Resumen items={[
          { valor: c.activos, texto: 'socios activos' },
          { valor: c.alDia, texto: 'al día', tono: 'ok' },
          { valor: c.vencidas, texto: 'con la cuota vencida', tono: c.vencidas ? 'danger' : 'ok', onClick: () => filtrarMem('VENCIDA'), activo: p.vista === 'vencidas' },
          { valor: c.sinMembresia, texto: 'sin membresía', tono: c.sinMembresia ? 'warn' : 'ok', onClick: () => filtrarMem('SIN_MEMBRESIA'), activo: p.filtroMem === 'SIN_MEMBRESIA' },
        ]} />
      )}

      <div className="gt-toolbar-fila">
        <div className="gt-busqueda">
          <Search size={16} aria-hidden />
          <input className="gt-input" placeholder="Buscar por nombre, DNI o email…" value={p.busqueda}
            onChange={e => p.setBusqueda(e.target.value)} aria-label="Buscar socio" />
        </div>
        <Segmentado etiqueta="Socios" valor={p.vista} onChange={v => { p.setVista(v); p.setFiltroMem(''); p.setPagina(1) }} opciones={[
          { valor: 'activos', texto: 'Activos', cuenta: c?.activos },
          { valor: 'vencidas', texto: 'Vencidas', cuenta: c?.vencidas },
          { valor: 'inactivos', texto: 'De baja', cuenta: c?.inactivos },
          { valor: 'todos', texto: 'Todos' },
        ]} />
        {hayFiltros && d && (
          <span className="gt-text-sm gt-text-muted" aria-live="polite">{d.total} resultado{d.total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {p.vista === 'vencidas' && c && c.vencidas > 0 && (
        <div className="gt-alert gt-alert-warning gt-vencidas-aviso" role="note">
          <BellRing size={16} aria-hidden />
          <span><strong>{c.vencidas} {c.vencidas === 1 ? 'socio tiene' : 'socios tienen'} la cuota vencida</strong> y no {c.vencidas === 1 ? 'puede' : 'pueden'} entrar hasta renovar. Con <em>Avisar</em> le escribís un mensaje a cada uno.</span>
        </div>
      )}

      {p.cargando ? (
        <div className="gt-card gt-lista-cargando" aria-busy="true">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} alto={44} />)}
        </div>
      ) : !d ? null : c && c.activos + c.inactivos === 0 ? (
        <div className="gt-card">
          <EmptyState icono={Users} titulo="Todavía no hay socios"
            texto="Registrá el primero: se carga el socio, se cobra el plan y queda con la membresía activa."
            accion={<button type="button" className="gt-btn gt-btn-primary" onClick={() => setAltaAbierta(true)}><UserPlus size={16} aria-hidden /> Nuevo socio</button>} />
        </div>
      ) : d.items.length === 0 && p.vista === 'vencidas' && !p.busqueda.trim() ? (
        <div className="gt-card">
          <EmptyState icono={Users} titulo="Nadie tiene la cuota vencida" texto="Todos los socios activos están al día." />
        </div>
      ) : d.items.length === 0 ? (
        <div className="gt-card">
          <EmptyState icono={Search} titulo="Ningún socio coincide"
            accion={<button type="button" className="gt-btn gt-btn-secondary" onClick={() => { p.setBusqueda(''); p.setFiltroMem('') }}>Limpiar filtros</button>} />
        </div>
      ) : (
        <SocioTabla socios={d.items} onEditar={p.setSocioEditar} onEliminar={p.handleEliminar} onReactivar={p.handleReactivar}
          ocupado={p.ocupado} orden={p.orden} desc={p.desc} onOrdenar={p.ordenar} />
      )}

      {d && d.paginas > 1 && (
        <nav className="gt-paginado" aria-label="Páginas de socios">
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm"
            disabled={d.pagina === 1} onClick={() => p.setPagina(d.pagina - 1)}>← Anterior</button>
          <span className="gt-text-sm gt-text-muted">Página {d.pagina} de {d.paginas} · {d.total} socios</span>
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm"
            disabled={d.pagina === d.paginas} onClick={() => p.setPagina(d.pagina + 1)}>Siguiente →</button>
        </nav>
      )}

      {(altaAbierta || p.socioEditar) && (
        <SocioForm
          onGuardar={p.handleEditar}
          onAltaCompleta={registrar}
          socioEditar={p.socioEditar}
          guardando={registrando || p.ocupado === 'editar'}
          onCancelar={() => { setAltaAbierta(false); p.setSocioEditar(null) }}
        />
      )}
      {p.socioBaja && (
        <BajaSocioModal nombre={`${p.socioBaja.nombre} ${p.socioBaja.apellido}`}
          onConfirmar={p.confirmarBaja} onCerrar={() => p.setSocioBaja(null)} />
      )}
      {p.pinAlta && <PinEntregaModal {...p.pinAlta} onCerrar={() => p.setPinAlta(null)} />}
      {p.pinesPendientes && <PinesPendientesModal pines={p.pinesPendientes} onCerrar={() => p.setPinesPendientes(null)} />}
    </>
  )
}
