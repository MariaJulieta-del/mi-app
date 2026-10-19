import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Clock, LayoutTemplate, MessageSquarePlus, X } from 'lucide-react'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import { formatFecha } from '../../../shared/utils/fechas'
import { OBJETIVO_CONFIG } from '../../rutinas/utils/rutinaUtils'
import { cancelarPedido, miPedido, pedidoAbierto, pedirRutina, type PedidoRutina } from '../../rutinas/services/pedidosService'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { Spinner } from '../../../shared/components/ui'

const MAX = 500

/**
 * En "Mi rutina": elegir una plantilla del gimnasio o pedirle al profe una rutina a medida.
 * Si ya hay un pedido, muestra en qué está.
 */
export default function PedidoRutinaSocio() {
  const toast = useToast()
  const [pedido, setPedido] = useState<PedidoRutina | null | undefined>(undefined)
  const [abierto, setAbierto] = useState(false)
  const [objetivo, setObjetivo] = useState('')
  const [dias, setDias] = useState<number | ''>('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)

  useEffect(() => { miPedido().then(setPedido).catch(() => setPedido(null)) }, [])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    try {
      const p = await pedirRutina({ objetivo: objetivo || null, diasSemana: dias === '' ? null : dias, mensaje: mensaje.trim() || null })
      setPedido(p); setAbierto(false)
      toast.success('Pedido enviado', 'Tu profe lo va a ver en el gimnasio y te avisamos cuando esté lista.')
    } catch (err) {
      toast.error('No se pudo enviar', mensajeError(err, 'Probá de nuevo'))
    } finally { setEnviando(false) }
  }

  const cancelar = async () => {
    setConfirmarCancelar(false)
    try { await cancelarPedido(); setPedido(await miPedido()); toast.success('Pedido cancelado') }
    catch (err) { toast.error('No se pudo cancelar', mensajeError(err, 'Probá de nuevo')) }
  }

  if (pedido === undefined) return null
  const enCurso = pedidoAbierto(pedido)

  return (
    <section className="gt-card gt-socio-bloque gt-socio-pedido" id="otra-rutina">
      <div className="gt-socio-bloque-cab"><h3>¿Querés otra rutina?</h3></div>

      {enCurso && pedido ? (
        <div className="gt-socio-pedido-estado">
          <Clock size={18} aria-hidden />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{pedido.estado === 'EN_CURSO' ? 'Tu profe está armando tu rutina' : 'Pediste una rutina personalizada'}</strong>
            <span>El {formatFecha(pedido.creada)}{pedido.objetivo && OBJETIVO_CONFIG[pedido.objetivo] ? ` · ${OBJETIVO_CONFIG[pedido.objetivo].label}` : ''}{pedido.diasSemana ? ` · ${pedido.diasSemana} días por semana` : ''}</span>
            <span>Te avisamos acá cuando esté lista.</span>
          </div>
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => setConfirmarCancelar(true)}><X size={14} aria-hidden /> Cancelar</button>
        </div>
      ) : (
        <>
          {pedido && pedido.estado === 'HECHA' && (
            <p className="gt-socio-pedido-fin ok"><CircleCheck size={16} aria-hidden /> Tu profe te armó {pedido.rutinaNombre ? `"${pedido.rutinaNombre}"` : 'la rutina'} que pediste el {formatFecha(pedido.creada)}.</p>
          )}
          {pedido && pedido.estado === 'DESCARTADA' && (
            <p className="gt-socio-pedido-fin">Sobre tu último pedido, tu profe te dejó: “{pedido.motivo}”</p>
          )}
          <div className="gt-socio-pedido-opciones">
            <Link to="/mi-rutina/plantillas" className="gt-socio-opcion">
              <LayoutTemplate size={20} aria-hidden />
              <span><strong>Elegir una plantilla</strong><small>Rutinas ya armadas por el gimnasio. La empezás hoy.</small></span>
            </Link>
            <button type="button" className={`gt-socio-opcion${abierto ? ' activa' : ''}`} onClick={() => setAbierto(a => !a)} aria-expanded={abierto}>
              <MessageSquarePlus size={20} aria-hidden />
              <span><strong>Pedir una a medida</strong><small>Le llega a tu profe y te la arma según lo que buscás.</small></span>
            </button>
          </div>

          {abierto && (
            <form className="gt-socio-pedido-form" onSubmit={enviar} noValidate>
              <label className="gt-label" htmlFor="ped-obj">¿Qué buscás?</label>
              <select id="ped-obj" className="gt-select" value={objetivo} onChange={e => setObjetivo(e.target.value)}>
                <option value="">Que me recomiende el profe</option>
                {Object.entries(OBJETIVO_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
              <label className="gt-label" htmlFor="ped-dias">¿Cuántos días por semana podés venir?</label>
              <div className="gt-socio-pedido-dias" role="radiogroup" aria-label="Días por semana" id="ped-dias">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button key={n} type="button" role="radio" aria-checked={dias === n} className={`gt-chip-btn${dias === n ? ' activo' : ''}`}
                    onClick={() => setDias(dias === n ? '' : n)}>{n}</button>
                ))}
              </div>
              <label className="gt-label" htmlFor="ped-msj">Algo que tu profe tenga que saber <span className="gt-text-muted">(opcional)</span></label>
              <textarea id="ped-msj" className="gt-input" rows={3} maxLength={MAX} value={mensaje} onChange={e => setMensaje(e.target.value)}
                placeholder="Ej: me molesta la rodilla, quiero enfocarme en piernas, entreno a la mañana…" />
              <span className="gt-hint">{mensaje.length}/{MAX}</span>
              <button type="submit" className="gt-btn gt-btn-primary" disabled={enviando}>{enviando ? <><Spinner /> Enviando…</> : 'Enviar pedido'}</button>
            </form>
          )}
        </>
      )}

      <ConfirmModal open={confirmarCancelar} title="Cancelar el pedido" message="Tu profe deja de verlo. Podés volver a pedir otra cuando quieras."
        confirmLabel="Cancelar pedido" cancelLabel="Volver" danger onConfirm={cancelar} onCancel={() => setConfirmarCancelar(false)} />
    </section>
  )
}
