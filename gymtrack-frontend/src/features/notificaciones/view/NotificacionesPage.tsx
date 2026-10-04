import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useNotificaciones, TIPOS } from '../hooks/useNotificaciones'

function TipoBadge({ tipo }: { tipo: string }) {
  const cfg = TIPOS.find(t => t.val === tipo) ?? { bg: 'var(--bg-surface-2)', color: 'var(--text-muted)', label: tipo }
  return <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
}

export default function NotificacionesPage() {
  const { inputRef, ...n } = useNotificaciones()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>Notificaciones</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{n.activas.length} activa{n.activas.length !== 1 ? 's' : ''}</span>
          {n.archivadas.length > 0 && (
            <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }} onClick={() => n.setVerArchivadas(v => !v)}>
              {n.verArchivadas ? `Ver activas (${n.activas.length})` : `Ver archivadas (${n.archivadas.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="gt-card" style={{ marginBottom: 20 }}>
        <p className="gt-card-title" style={{ marginTop: 0 }}>Nueva notificación</p>
        <form onSubmit={n.handleSubmit} noValidate>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label">Título <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="gt-input" value={n.form.titulo} onChange={e => n.setForm({ ...n.form, titulo: e.target.value })} placeholder="Ej: Clase cancelada" />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Tipo</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {TIPOS.slice(0, 4).map(t => (
                  <button key={t.val} type="button" onClick={() => n.setForm({ ...n.form, tipo: t.val })}
                    style={{ padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                      border: `1.5px solid ${n.form.tipo === t.val ? t.color : 'var(--border)'}`,
                      background: n.form.tipo === t.val ? t.bg : 'var(--bg-surface)',
                      color: n.form.tipo === t.val ? t.color : 'var(--text-secondary)',
                      fontWeight: n.form.tipo === t.val ? 700 : 400 }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Destinatario</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[{ val: 'TODOS', label: 'Todos los socios' }, { val: 'SOCIO', label: 'Socio específico' }].map(opt => (
                  <button key={opt.val} type="button" onClick={() => n.setDestinatario(opt.val)}
                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      border: `1.5px solid ${n.form.destinatario === opt.val ? 'var(--accent)' : 'var(--border)'}`,
                      background: n.form.destinatario === opt.val ? 'var(--accent-light)' : 'var(--bg-surface)',
                      color: n.form.destinatario === opt.val ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: n.form.destinatario === opt.val ? 700 : 400 }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {n.form.destinatario === 'SOCIO' && (
              <div className="gt-form-group">
                <label className="gt-label">Socio <span style={{ color: 'var(--red)' }}>*</span></label>
                {n.socioSel ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>#{n.socioSel.id}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.socioSel.nombre} {n.socioSel.apellido}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>DNI {n.socioSel.dni}</span>
                    <button type="button" onClick={() => { n.setMostrarBuscador(true) }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>cambiar</button>
                  </div>
                ) : (
                  <div>
                    <button type="button" className="gt-btn gt-btn-secondary" onClick={() => n.setMostrarBuscador(v => !v)}>
                      {n.mostrarBuscador ? 'Cerrar buscador' : 'Buscar socio'}
                    </button>
                    {n.mostrarBuscador && (
                      <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <input ref={inputRef} className="gt-input" placeholder="Nombre, apellido o DNI..."
                          value={n.busquedaSocio} onChange={e => n.setBusquedaSocio(e.target.value)} style={{ marginBottom: 6 }} />
                        {n.sociosFiltrados.length > 0 && (
                          <div style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-surface)' }}>
                            {n.sociosFiltrados.map(s => (
                              <div key={s.id} onClick={() => n.seleccionarSocio(s)}
                                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 10, color: 'var(--text-secondary)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}>
                                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>#{s.id}</span>
                                <span>{s.nombre} {s.apellido}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>DNI {s.dni}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {n.busquedaSocio.length > 0 && n.sociosFiltrados.length === 0 && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Sin resultados</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Mensaje <span style={{ color: 'var(--red)' }}>*</span></label>
              <textarea className="gt-textarea" rows={3} value={n.form.mensaje} onChange={e => n.setForm({ ...n.form, mensaje: e.target.value })} placeholder="Contenido de la notificación..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={n.creando}>{n.creando ? 'Enviando...' : 'Enviar notificación'}</button>
            {n.form.destinatario === 'TODOS' && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Se enviará a todos los socios activos</span>}
          </div>
        </form>
      </div>

      <div className="gt-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 0 }}>{n.verArchivadas ? 'Archivadas' : 'Activas'} ({n.listaVer.length})</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => n.setFiltroTipo('')}
              style={{ padding: '3px 10px', borderRadius: 14, fontSize: 12, cursor: 'pointer',
                border: `1.5px solid ${!n.filtroTipo ? 'var(--accent)' : 'var(--border)'}`,
                background: !n.filtroTipo ? 'var(--accent-light)' : 'var(--bg-surface)',
                color: !n.filtroTipo ? 'var(--accent)' : 'var(--text-muted)' }}>
              Todos
            </button>
            {TIPOS.map(t => (
              <button key={t.val} onClick={() => n.setFiltroTipo(n.filtroTipo === t.val ? '' : t.val)}
                style={{ padding: '3px 10px', borderRadius: 14, fontSize: 12, cursor: 'pointer',
                  border: `1.5px solid ${n.filtroTipo === t.val ? t.color : 'var(--border)'}`,
                  background: n.filtroTipo === t.val ? t.bg : 'var(--bg-surface)',
                  color: n.filtroTipo === t.val ? t.color : 'var(--text-muted)' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {n.listaVer.length === 0 ? (
          <div className="gt-empty">
            {n.filtroTipo ? 'No hay notificaciones de ese tipo.' : n.verArchivadas ? 'No hay notificaciones archivadas.' : 'No hay notificaciones activas.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {n.listaVer.map(notif => (
              <div key={notif.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-surface)', opacity: notif.activa ? 1 : 0.7 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <TipoBadge tipo={notif.tipo} />
                    <span style={{ fontSize: 11, background: 'var(--bg-surface-2)', color: 'var(--text-muted)', borderRadius: 6, padding: '2px 8px', border: '1px solid var(--border)' }}>
                      {notif.destinatario === 'TODOS' ? 'Todos' : notif.socioNombre ? notif.socioNombre : `Socio #${notif.socioId}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-xmuted)' }}>{new Date(notif.fechaCreacion).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: 14, color: 'var(--text-primary)' }}>{notif.titulo}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{notif.mensaje}</p>
                </div>
                {notif.activa && (
                  <button className="gt-btn gt-btn-secondary" style={{ marginLeft: 16, flexShrink: 0, fontSize: 12 }} onClick={() => n.setConfirmarArchivarId(notif.id)}>
                    Archivar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={n.confirmarArchivarId !== null}
        title="Archivar notificación"
        message="¿Archivar esta notificación? Se moverá al historial y dejará de estar activa."
        confirmLabel="Archivar"
        onConfirm={n.handleArchivar}
        onCancel={() => n.setConfirmarArchivarId(null)}
      />
    </>
  )
}
