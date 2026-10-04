import { Link } from 'react-router-dom'
import { useMembresiasList, colorPara } from '../hooks/useMembresiasList'
import { textoPases } from '../types/Tarifa'

export default function MembresiasList() {
  const m = useMembresiasList()

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Planes de membresía</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/pagos/nuevo" className="gt-btn gt-btn-secondary">Cobrar plan</Link>
          {m.isAdmin && <Link to="/membresias/nueva" className="gt-btn gt-btn-primary">+ Nuevo plan</Link>}
        </div>
      </div>

      <div className="gt-hint-box">
        <span>💡</span>
        <span>
          Cada socio tiene <strong>una sola membresía</strong>. Al cobrarle un plan se activa (o se renueva si sigue vigente).
          Los <strong>pases mensuales</strong> son la cantidad de días que puede venir por mes; se reinician cada mes desde que empezó.
        </span>
      </div>

      {m.error && <div className="gt-alert gt-alert-error">{m.error}</div>}
      {m.msg && <div className="gt-alert gt-alert-success" style={{ marginBottom: 16 }}>{m.msg}</div>}

      {m.cargando ? (
        <p className="gt-text-muted">Cargando planes...</p>
      ) : m.planes.length === 0 ? (
        <div className="gt-empty">No hay planes configurados.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {m.planes.map(p => {
            const editando = m.editandoTipo === p.tipo
            return (
              <div key={p.tipo} className="gt-card" style={{ borderLeft: `5px solid ${colorPara(p.tipo)}`, padding: 20, marginBottom: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: colorPara(p.tipo) }}>{p.nombre ?? p.tipo}</p>
                <p className="gt-text-muted gt-text-sm" style={{ margin: '2px 0 12px' }}>{p.duracionDias} días</p>

                {editando ? (
                  <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Precio ($)</label>
                      <input type="number" className="gt-input" value={m.nuevoPrecio} min={1} autoFocus
                        onChange={e => m.setNuevoPrecio(Number(e.target.value))} />
                    </div>
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Pases por mes</label>
                      <input type="number" className="gt-input" value={m.nuevosPases} min={1} placeholder="Vacío = pase libre"
                        onChange={e => m.setNuevosPases(e.target.value === '' ? '' : Number(e.target.value))}
                        onKeyDown={e => { if (e.key === 'Enter') m.guardarPlan(p.tipo); if (e.key === 'Escape') m.setEditandoTipo(null) }} />
                      <p className="gt-hint">Dejalo vacío para pase libre (sin límite).</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="gt-btn gt-btn-primary" onClick={() => m.guardarPlan(p.tipo)} disabled={m.guardando}>Guardar</button>
                      <button className="gt-btn gt-btn-secondary" onClick={() => m.setEditandoTipo(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>${Number(p.precio).toLocaleString('es-AR')}</p>
                      <span className={p.pasesMensuales ? 'gt-badge gt-badge-blue' : 'gt-badge gt-badge-green'}>🎟️ {textoPases(p.pasesMensuales)}</span>
                    </div>
                    {m.isAdmin && (
                      <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12, padding: '3px 10px' }}
                        onClick={() => m.iniciarEdicion(p)}>Editar</button>
                    )}
                  </div>
                )}

                {p.incluye && <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 12px', lineHeight: 1.5 }}>{p.incluye}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: `${colorPara(p.tipo)}20`, borderRadius: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: colorPara(p.tipo) }}>{p.sociosActivos}</span>
                  <span className="gt-text-muted gt-text-sm">{p.sociosActivos === 1 ? 'socio activo' : 'socios activos'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
