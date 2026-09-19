import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerFicha, guardarFicha } from '../services/fichaService'

export default function FichaMedicaPage() {
 const { socioId } = useParams<{ socioId: string }>()
 const navigate = useNavigate()
 const id = Number(socioId)
 const [observaciones, setObservaciones] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [exito, setExito] = useState(false)
 const [guardando, setGuardando] = useState(false)
 const [cargando, setCargando] = useState(true)

 useEffect(() => {
  if (!id) return
  obtenerFicha(id)
   .then(data => {
    if (data) {
     const partes = [
      data.observacionesMedicas,
      data.lesiones ? `Antecedentes/Lesiones: ${data.lesiones}` : '',
      data.historialGimnasio ? `Historial: ${data.historialGimnasio}` : '',
     ].filter(Boolean)
     setObservaciones(partes.join('\n\n'))
    }
   })
   .catch(() => {})
   .finally(() => setCargando(false))
 }, [id])

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setGuardando(true); setError(null); setExito(false)
  try {
   await guardarFicha(id, {
    lesiones: '',
    nivelAptitud: 'BUENO',
    historialGimnasio: '',
    disponibilidad: '',
    observacionesMedicas: observaciones,
   })
   setExito(true)
  } catch {
   setError('Error al guardar las observaciones')
  } finally {
   setGuardando(false) }
 }

 if (cargando) return <p className="gt-text-muted">Cargando...</p>

 return (
  <>
   <button className="gt-btn gt-btn-secondary" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Volver</button>
   <h1 className="gt-page-title">Observaciones</h1>
   <p style={{ color: '#6B7280', marginTop: -8, marginBottom: 16, fontSize: 13 }}>
    Anotaciones sobre el socio: lesiones, antecedentes, restricciones, objetivos, lo que sea útil.
   </p>
   {exito && <div className="gt-alert" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A', marginBottom: 12 }}>Observaciones guardadas.<button onClick={() => setExito(false)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}
   {error && <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>{error}<button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button></div>}
   <div className="gt-card">
    <form onSubmit={handleSubmit}>
     <div className="gt-form-group">
      <label className="gt-label">Observaciones / Antecedentes</label>
      <textarea className="gt-textarea" rows={8} value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Ej: Lesión en rodilla derecha (2023), evitar sentadillas con peso. Objetivo: ganar masa muscular. Entrena lunes, miércoles y viernes..." />
     </div>
     <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar observaciones'}</button>
    </form>
   </div>
  </>
 )
}
