import { Plus, X } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useProfesores } from '../hooks/useProfesores'
import { CargandoPagina, PageHeader, Pill, Spinner } from '../../../shared/components/ui'
import CampoClave from '../../../shared/components/CampoClave'

/** Campo con su etiqueta asociada (lector de pantalla y clic en la etiqueta) */
function Campo({ id, etiqueta, children }: { id: string; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="gt-form-group">
      <label className="gt-label" htmlFor={id}>{etiqueta}</label>
      {children}
    </div>
  )
}

export default function ProfesoresPage() {
  const p = useProfesores()

  if (p.cargando) return <CargandoPagina resumen={false} filas={3} />
  if (p.error) return <div className="gt-alert gt-alert-error" role="alert">{p.error}</div>

  return (
    <>
      <PageHeader titulo="Profesores"
        subtitulo={`${p.profesores.length} profesor${p.profesores.length !== 1 ? 'es' : ''} registrado${p.profesores.length !== 1 ? 's' : ''}`}
        acciones={<button type="button" className="gt-btn gt-btn-primary" onClick={() => p.setShowForm(v => !v)}>
          {p.showForm ? <><X size={16} aria-hidden /> Cancelar</> : <><Plus size={16} aria-hidden /> Nuevo profesor</>}
        </button>} />

      {p.showForm && (
        <section className="gt-card gt-prof-form">
          <h2 className="gt-card-title">Registrar nuevo profesor</h2>
          <form onSubmit={p.handleCrear}>
            <div className="gt-form-grid">
              <Campo id="prof-nombre" etiqueta="Nombre"><input id="prof-nombre" className="gt-input" value={p.nombre} onChange={e => p.setNombre(e.target.value)} placeholder="Juan" autoFocus /></Campo>
              <Campo id="prof-apellido" etiqueta="Apellido"><input id="prof-apellido" className="gt-input" value={p.apellido} onChange={e => p.setApellido(e.target.value)} placeholder="Pérez" /></Campo>
              <Campo id="prof-tel" etiqueta="Teléfono"><input id="prof-tel" className="gt-input" value={p.telefono} onChange={e => p.setTelefono(e.target.value)} placeholder="11 1234-5678" /></Campo>
              <Campo id="prof-usuario" etiqueta="Usuario *"><input id="prof-usuario" className="gt-input" value={p.username} onChange={e => p.setUsername(e.target.value)} placeholder="ej: jperez" required /></Campo>
              <Campo id="prof-clave" etiqueta="Contraseña *"><CampoClave id="prof-clave" className="gt-input" value={p.password} onChange={e => p.setPassword(e.target.value)} placeholder="Mín. 8, con letras y números" required /></Campo>
              <Campo id="prof-email" etiqueta="Email"><input id="prof-email" className="gt-input" type="email" value={p.email} onChange={e => p.setEmail(e.target.value)} placeholder="jperez@gym.com" /></Campo>
              <Campo id="prof-esp" etiqueta="Especialidad"><input id="prof-esp" className="gt-input" value={p.especialidad} onChange={e => p.setEspecialidad(e.target.value)} placeholder="ej: Musculación" /></Campo>
            </div>
            <button className="gt-btn gt-btn-primary" type="submit" disabled={p.guardando}>
              {p.guardando ? <><Spinner /> Guardando…</> : 'Crear profesor'}
            </button>
          </form>
        </section>
      )}

      {p.profesores.length === 0 ? (
        <div className="gt-empty"><p>No hay profesores registrados aún.</p></div>
      ) : (
        <div className="gt-prof-lista">
          {p.profesores.map(prof => {
            const nombre = prof.nombre || prof.apellido ? `${prof.nombre ?? ''} ${prof.apellido ?? ''}`.trim() : prof.username
            return (
              <div key={prof.id} className="gt-list-card">
                {p.editId === prof.id ? (
                  <form onSubmit={p.handleEditar}>
                    <div className="gt-form-grid">
                      <Campo id={`ed-nombre-${prof.id}`} etiqueta="Nombre"><input id={`ed-nombre-${prof.id}`} className="gt-input" value={p.editNombre} onChange={e => p.setEditNombre(e.target.value)} /></Campo>
                      <Campo id={`ed-apellido-${prof.id}`} etiqueta="Apellido"><input id={`ed-apellido-${prof.id}`} className="gt-input" value={p.editApellido} onChange={e => p.setEditApellido(e.target.value)} /></Campo>
                      <Campo id={`ed-tel-${prof.id}`} etiqueta="Teléfono"><input id={`ed-tel-${prof.id}`} className="gt-input" value={p.editTelefono} onChange={e => p.setEditTelefono(e.target.value)} /></Campo>
                      <Campo id={`ed-usuario-${prof.id}`} etiqueta="Usuario"><input id={`ed-usuario-${prof.id}`} className="gt-input" value={p.editUsername} onChange={e => p.setEditUsername(e.target.value)} /></Campo>
                      <Campo id={`ed-email-${prof.id}`} etiqueta="Email"><input id={`ed-email-${prof.id}`} className="gt-input" type="email" value={p.editEmail} onChange={e => p.setEditEmail(e.target.value)} /></Campo>
                      <Campo id={`ed-esp-${prof.id}`} etiqueta="Especialidad"><input id={`ed-esp-${prof.id}`} className="gt-input" value={p.editEspecialidad} onChange={e => p.setEditEspecialidad(e.target.value)} /></Campo>
                      <Campo id={`ed-clave-${prof.id}`} etiqueta="Nueva contraseña"><CampoClave id={`ed-clave-${prof.id}`} className="gt-input" value={p.editPassword} onChange={e => p.setEditPassword(e.target.value)} placeholder="Vacío = no cambia" /></Campo>
                    </div>
                    <div className="gt-prof-acciones">
                      <button className="gt-btn gt-btn-primary" type="submit" disabled={p.guardandoEdit}>{p.guardandoEdit ? <><Spinner /> Guardando…</> : 'Guardar'}</button>
                      <button className="gt-btn gt-btn-secondary" type="button" onClick={() => p.setEditId(null)}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <div className="gt-prof-fila">
                    <span className={`gt-prof-avatar${prof.activo ? '' : ' inactivo'}`} aria-hidden>{(prof.nombre ?? prof.username)[0].toUpperCase()}</span>
                    <div className="gt-prof-datos">
                      <p className="gt-prof-nombre">
                        {nombre} <Pill tono={prof.activo ? 'ok' : 'neutral'}>{prof.activo ? 'Activo' : 'Inactivo'}</Pill>
                      </p>
                      <p className="gt-prof-meta">
                        @{prof.username}
                        {prof.especialidad && <> · <strong>{prof.especialidad}</strong></>}
                        {prof.email && <> · {prof.email}</>}
                        {prof.telefono && <> · {prof.telefono}</>}
                      </p>
                    </div>
                    <div className="gt-prof-acciones">
                      <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => p.abrirEditar(prof)}>Editar</button>
                      <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => p.handleToggle(prof.id)}>
                        {prof.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button type="button" className="gt-btn gt-btn-danger-outline gt-btn-sm"
                        disabled={p.eliminandoId === prof.id} onClick={() => p.setConfirmarEliminarId(prof.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
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
    </>
  )
}
