import { useMembresiasForm } from '../hooks/useMembresiasForm'

export default function MembresiasForm() {
  const f = useMembresiasForm()

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Nuevo Plan de Membresía</h1>
      </div>
      <div className="gt-card">
        {f.error && (
          <div className="gt-alert gt-alert-error">
            {f.error}
            <button onClick={() => f.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
          </div>
        )}
        <form onSubmit={f.handleSubmit}>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label">Nombre del plan *</label>
              <input className="gt-input" type="text" value={f.nombre} onChange={e => f.setNombre(e.target.value)} placeholder="Ej: Plan Quincenal" required />
              {f.tipoGenerado && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>Código interno: <strong>{f.tipoGenerado}</strong></p>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Duración (días) *</label>
              <input className="gt-input" type="number" value={f.duracionDias} onChange={e => f.setDuracionDias(Number(e.target.value))} min={1} placeholder="Ej: 15" required />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>El sistema calcula la fecha de vencimiento automáticamente.</p>
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Precio ($) *</label>
              <input className="gt-input" type="number" value={f.precio} onChange={e => f.setPrecio(Number(e.target.value))} min={0} step={0.01} placeholder="Ej: 8000" required />
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Pases por mes</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                {[8, 12, 16, 20].map(n => (
                  <button key={n} type="button" className={`gt-option${f.pasesMensuales === n ? ' selected' : ''}`}
                    style={{ padding: '4px 12px' }} onClick={() => f.setPasesMensuales(n)}>{n}</button>
                ))}
                <button type="button" className={`gt-option${f.pasesMensuales === '' ? ' selected' : ''}`}
                  style={{ padding: '4px 12px' }} onClick={() => f.setPasesMensuales('')}>Libre</button>
              </div>
              <input className="gt-input" type="number" min={1} value={f.pasesMensuales} placeholder="Vacío = pase libre"
                onChange={e => f.setPasesMensuales(e.target.value === '' ? '' : Number(e.target.value))} />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>Cuántos días por mes puede ingresar el socio. Se reinician cada mes.</p>
            </div>
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">¿Qué incluye? (opcional)</label>
              <textarea className="gt-textarea" value={f.incluye} onChange={e => f.setIncluye(e.target.value)} placeholder="Ej: Acceso al gimnasio por 15 días. Clases grupales incluidas." rows={2} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={f.guardando}>{f.guardando ? 'Guardando...' : 'Crear Plan'}</button>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={() => f.navigate('/membresias')}>Cancelar</button>
          </div>
        </form>
      </div>
    </>
  )
}
