import { useState } from 'react'
import { mensajeError } from '../../../shared/utils/errores'
import { avisarDisciplina, type DisciplinaApi } from '../services/disciplinaService'
import { Spinner } from '../../../shared/components/ui'

/** Mensajes rápidos: el profe los toca y ajusta el texto */
function plantillas(nombre: string) {
  return [
    { titulo: `Hoy no hay ${nombre}`, mensaje: `Hola! Hoy se suspende la clase de ${nombre}. Disculpen las molestias, nos vemos en la próxima.` },
    { titulo: `Cambio de horario en ${nombre}`, mensaje: `Hola! Esta semana la clase de ${nombre} cambia de horario: ` },
    { titulo: `Recordatorio: ${nombre}`, mensaje: `Hola! Les recuerdo que mañana tenemos ${nombre}. No se olviden de traer agua y toalla.` },
  ]
}

/** Enviar un aviso a todos los alumnos de la disciplina */
export default function AvisoClase({ disciplina }: { disciplina: DisciplinaApi }) {
  const [titulo, setTitulo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const alumnos = (disciplina.inscriptos ?? []).filter(i => i.activo).length

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setEnviado(null)
    if (!titulo.trim() || !mensaje.trim()) { setError('Completá el título y el mensaje'); return }
    setEnviando(true)
    try {
      const r = await avisarDisciplina(disciplina.id, titulo.trim(), mensaje.trim())
      setEnviado(`Aviso enviado a ${r.alumnos} ${r.alumnos === 1 ? 'alumno' : 'alumnos'}. Lo ven al entrar a la app${r.conEmail ? ` y les llegó por email a ${r.conEmail}` : ''}.`)
      setTitulo(''); setMensaje('')
    } catch (err: unknown) {
      setError(mensajeError(err, 'No se pudo enviar el aviso'))
    } finally {
      setEnviando(false)
    }
  }

  if (alumnos === 0) return <div className="gt-empty" style={{ padding: '16px 0' }}>Esta disciplina todavía no tiene alumnos para avisar.</div>

  return (
    <form onSubmit={enviar} noValidate>
      <p className="gt-text-sm" style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
        Le llega a los <strong>{alumnos} {alumnos === 1 ? 'alumno' : 'alumnos'}</strong> de {disciplina.nombre}: lo ven al entrar a la app (y por email, si está activado).
      </p>
      {enviado && <div className="gt-alert gt-alert-success">{enviado}</div>}
      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {plantillas(disciplina.nombre).map(p => (
          <button key={p.titulo} type="button" className="gt-disc-leyenda-item" onClick={() => { setTitulo(p.titulo); setMensaje(p.mensaje) }}>
            {p.titulo}
          </button>
        ))}
      </div>
      <div className="gt-form-group">
        <label className="gt-label" htmlFor="aviso-titulo">Título</label>
        <input id="aviso-titulo" className="gt-input" value={titulo} maxLength={80} onChange={e => setTitulo(e.target.value)} placeholder={`Ej: Hoy no hay ${disciplina.nombre}`} />
      </div>
      <div className="gt-form-group">
        <label className="gt-label" htmlFor="aviso-mensaje">Mensaje</label>
        <textarea id="aviso-mensaje" className="gt-textarea" rows={4} maxLength={600} value={mensaje} onChange={e => setMensaje(e.target.value)} />
      </div>
      <button type="submit" className="gt-btn gt-btn-primary" disabled={enviando}>{enviando ? <><Spinner /> Enviando…</> : `Enviar a ${alumnos} ${alumnos === 1 ? 'alumno' : 'alumnos'}`}</button>
    </form>
  )
}
