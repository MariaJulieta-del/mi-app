import { useFichaMedica } from '../hooks/useFichaMedica'

export default function FichaMedicaPage() {
  const f = useFichaMedica()

  if (f.cargando) return <p className="gt-text-muted">Cargando...</p>

  return (
    <>
      <button className="gt-btn gt-btn-secondary" style={{ marginBottom: 16 }} onClick={() => f.navigate(-1)}>← Volver</button>
      <h1 className="gt-page-title">Observaciones</h1>
      <p style={{ color: '#6B7280', marginTop: -8, marginBottom: 16, fontSize: 13 }}>
        Anotaciones sobre el socio: lesiones, antecedentes, restricciones, objetivos, lo que sea útil.
      </p>
      {f.exito && (
        <div className="gt-alert" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A', marginBottom: 12 }}>
          Observaciones guardadas.
          <button onClick={() => f.setExito(false)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {f.error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
          {f.error}
          <button onClick={() => f.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <div className="gt-card">
        <form onSubmit={f.handleSubmit}>
          <div className="gt-form-group">
            <label className="gt-label">Observaciones / Antecedentes</label>
            <textarea className="gt-textarea" rows={8} value={f.observaciones}
              onChange={e => f.setObservaciones(e.target.value)}
              placeholder="Ej: Lesión en rodilla derecha (2023), evitar sentadillas con peso. Objetivo: ganar masa muscular. Entrena lunes, miércoles y viernes..." />
          </div>
          <button type="submit" className="gt-btn gt-btn-primary" disabled={f.guardando}>
            {f.guardando ? 'Guardando...' : 'Guardar observaciones'}
          </button>
        </form>
      </div>
    </>
  )
}
