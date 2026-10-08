import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useProfesores } from '../hooks/useProfesores'
import { CargandoPagina } from '../../../shared/components/ui'

export default function ProfesoresPage() {
  const p = useProfesores()

  if (p.cargando) return <CargandoPagina resumen={false} filas={3} />
  if (p.error) return <div className="gt-page"><p style={{ color: 'var(--red)' }}>{p.error}</p></div>

  return (
    <div className="gt-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Profesores</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {p.profesores.length} profesor{p.profesores.length !== 1 ? 'es' : ''} registrado{p.profesores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="gt-btn gt-btn-primary" onClick={() => p.setShowForm(v => !v)}>
          {p.showForm ? 'Cancelar' : '+ Nuevo profesor'}
        </button>
      </div>

      {p.showForm && (
        <div className="gt-card" style={{ marginBottom: 20, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Registrar nuevo profesor</h3>
          <form onSubmit={p.handleCrear}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="gt-label">Nombre</label>
                <input className="gt-input" value={p.nombre} onChange={e => p.setNombre(e.target.value)} placeholder="Juan" autoFocus />
              </div>
              <div>
                <label className="gt-label">Apellido</label>
                <input className="gt-input" value={p.apellido} onChange={e => p.setApellido(e.target.value)} placeholder="Pérez" />
              </div>
              <div>
                <label className="gt-label">Teléfono</label>
                <input className="gt-input" value={p.telefono} onChange={e => p.setTelefono(e.target.value)} placeholder="11 1234-5678" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="gt-label">Usuario *</label>
                <input className="gt-input" value={p.username} onChange={e => p.setUsername(e.target.value)} placeholder="ej: jperez" required />
              </div>
              <div>
                <label className="gt-label">Contraseña *</label>
                <input className="gt-input" type="password" value={p.password} onChange={e => p.setPassword(e.target.value)} placeholder="Mín. 8, con letras y números" required />
              </div>
              <div>
                <label className="gt-label">Email</label>
                <input className="gt-input" type="email" value={p.email} onChange={e => p.setEmail(e.target.value)} placeholder="jperez@gym.com" />
              </div>
              <div>
                <label className="gt-label">Especialidad</label>
                <input className="gt-input" value={p.especialidad} onChange={e => p.setEspecialidad(e.target.value)} placeholder="ej: Musculación" />
              </div>
            </div>
            <button className="gt-btn gt-btn-primary" type="submit" disabled={p.guardando}>
              {p.guardando ? 'Guardando...' : 'Crear profesor'}
            </button>
          </form>
        </div>
      )}

      {p.profesores.length === 0 ? (
        <div className="gt-empty"><p>No hay profesores registrados aún.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {p.profesores.map(prof => (
            <div key={prof.id} className="gt-list-card">
              {p.editId === prof.id ? (
                <form onSubmit={p.handleEditar}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div><label className="gt-label">Nombre</label><input className="gt-input" value={p.editNombre} onChange={e => p.setEditNombre(e.target.value)} /></div>
                    <div><label className="gt-label">Apellido</label><input className="gt-input" value={p.editApellido} onChange={e => p.setEditApellido(e.target.value)} /></div>
                    <div><label className="gt-label">Teléfono</label><input className="gt-input" value={p.editTelefono} onChange={e => p.setEditTelefono(e.target.value)} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div><label className="gt-label">Usuario</label><input className="gt-input" value={p.editUsername} onChange={e => p.setEditUsername(e.target.value)} /></div>
                    <div><label className="gt-label">Email</label><input className="gt-input" type="email" value={p.editEmail} onChange={e => p.setEditEmail(e.target.value)} /></div>
                    <div><label className="gt-label">Especialidad</label><input className="gt-input" value={p.editEspecialidad} onChange={e => p.setEditEspecialidad(e.target.value)} /></div>
                    <div><label className="gt-label">Nueva contraseña</label><input className="gt-input" type="password" value={p.editPassword} onChange={e => p.setEditPassword(e.target.value)} placeholder="Vacío = no cambia" /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="gt-btn gt-btn-primary" type="submit" disabled={p.guardandoEdit}>{p.guardandoEdit ? 'Guardando...' : 'Guardar'}</button>
                    <button className="gt-btn gt-btn-secondary" type="button" onClick={() => p.setEditId(null)}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: prof.activo ? '#3B82F6' : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                    {(prof.nombre ?? prof.username)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                      {prof.nombre || prof.apellido ? `${prof.nombre ?? ''} ${prof.apellido ?? ''}`.trim() : prof.username}
                      <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                        background: prof.activo ? 'var(--green-bg)' : 'var(--bg-body)',
                        color: prof.activo ? 'var(--green-text)' : 'var(--text-muted)' }}>
                        {prof.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      @{prof.username}
                      {prof.especialidad && <> · <strong>{prof.especialidad}</strong></>}
                      {prof.email && <> · {prof.email}</>}
                      {prof.telefono && <> · 📞 {prof.telefono}</>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }} onClick={() => p.abrirEditar(prof)}>Editar</button>
                    <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }} onClick={() => p.handleToggle(prof.id)}>
                      {prof.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="gt-btn" style={{ fontSize: 12, background: 'var(--red-light)', color: 'var(--red)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}
                      disabled={p.eliminandoId === prof.id} onClick={() => p.setConfirmarEliminarId(prof.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={p.confirmarEliminarId !== null}
        title="Eliminar profesor"
        danger
        message={`¿Eliminás al profesor "${p.profesores.find(x => x.id === p.confirmarEliminarId)?.username}"? Esta acción no se puede deshacer.`}
        onConfirm={p.handleEliminar}
        onCancel={() => p.setConfirmarEliminarId(null)}
      />
    </div>
  )
}
