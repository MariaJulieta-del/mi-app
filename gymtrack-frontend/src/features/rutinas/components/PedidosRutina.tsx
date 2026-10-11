import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Hand, Inbox, LayoutTemplate, MessageCircle, PencilRuler, X } from 'lucide-react'
import { EmptyState, IconButton, Pill, SkeletonTarjetas } from '../../../shared/components/ui'
import Modal from '../../../shared/components/Modal'
import { useToast } from '../../../shared/hooks/useToast'
import { useAuth } from '../../../shared/context/AuthContext'
import { usePedidosRutina } from '../../../shared/context/PedidosRutinaContext'
import { mensajeError } from '../../../shared/utils/errores'
import { linkWhatsApp } from '../../../shared/utils/whatsapp'
import { formatFecha } from '../../../shared/utils/fechas'
import { OBJETIVO_CONFIG } from '../utils/rutinaUtils'
import { bandejaPedidos, descartarPedido, pedidoHecho, tomarPedido, type PedidoRutina } from '../services/pedidosService'

const hace = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return 'recién'
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'ayer' : `hace ${d} días`
}
const ESTADO: Record<PedidoRutina['estado'], { texto: string; tono: 'ok' | 'warn' | 'danger' | 'info' | 'neutral' }> = {
  PENDIENTE: { texto: 'Sin tomar', tono: 'warn' },
  EN_CURSO: { texto: 'En curso', tono: 'info' },
  HECHA: { texto: 'Hecha', tono: 'ok' },
  DESCARTADA: { texto: 'Descartada', tono: 'danger' },
  CANCELADA: { texto: 'La canceló el socio', tono: 'neutral' },
}

/** Lo que pidió el socio, en una línea */
export function DetallePedido({ p }: { p: PedidoRutina }) {
  const obj = p.objetivo ? OBJETIVO_CONFIG[p.objetivo] : null
  return (
    <span className="gt-pedido-detalle">
      {obj && <span>{obj.emoji} {obj.label}</span>}
      {p.diasSemana && <span>{p.diasSemana} {p.diasSemana === 1 ? 'día' : 'días'} por semana</span>}
      {p.rutinaActualNombre && <span>Hoy hace: {p.rutinaActualNombre}</span>}
    </span>
  )
}

/**
 * Pedidos de rutina personalizada (Rutinas › Pedidos). Quedan acá hasta que se le arma o asigna
 * una rutina al socio (se cierran solos) o se descartan con un motivo que le llega al socio.
 */
export default function PedidosRutina() {
  const toast = useToast()
  const { user } = useAuth()
  const { recargar: recargarContador } = usePedidosRutina()
  const [datos, setDatos] = useState<{ abiertos: PedidoRutina[]; resueltos: PedidoRutina[] } | null>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)
  const [descartando, setDescartando] = useState<PedidoRutina | null>(null)
  const [motivo, setMotivo] = useState('')

  const cargar = useCallback(() => bandejaPedidos().then(setDatos).catch(() => setDatos({ abiertos: [], resueltos: [] })), [])
  useEffect(() => { cargar() }, [cargar])

  const accion = async (p: PedidoRutina, fn: () => Promise<unknown>, ok: string) => {
    setOcupado(p.id)
    try { await fn(); toast.success(ok, p.socio); await cargar(); recargarContador() }
    catch (e) { toast.error('No se pudo', mensajeError(e, 'Probá de nuevo')); await cargar() }
    finally { setOcupado(null) }
  }

  const confirmarDescarte = async () => {
    if (!descartando) return
    const p = descartando
    await accion(p, () => descartarPedido(p.id, motivo.trim()), 'Pedido descartado: le avisamos al socio')
    setDescartando(null); setMotivo('')
  }

  if (!datos) return <SkeletonTarjetas cantidad={3} alto={140} />

  return (
    <>
      {datos.abiertos.length === 0 ? (
        <div className="gt-card">
          <EmptyState icono={Inbox} titulo="No hay pedidos pendientes"
            texto="Cuando un socio pida una rutina personalizada desde su app, aparece acá y en Hoy." />
        </div>
      ) : (
        <div className="gt-pedidos">
          {datos.abiertos.map(p => {
            const wa = p.telefono ? linkWhatsApp(p.telefono, `¡Hola ${p.socio.split(' ')[0]}! Vi tu pedido de rutina. `) : null
            const mio = p.tomadaPor === user?.username
            return (
              <article key={p.id} className={`gt-pedido${p.estado === 'EN_CURSO' ? ' en-curso' : ''}`}>
                <div className="gt-pedido-cab">
                  <Link to={`/socios/${p.socioId}/perfil`} className="gt-pedido-socio">{p.socio}</Link>
                  <Pill tono={ESTADO[p.estado].tono}>{p.estado === 'EN_CURSO' ? (mio ? 'Lo estás armando vos' : `Lo arma ${p.tomadaPor}`) : ESTADO[p.estado].texto}</Pill>
                  <span className="gt-text-sm gt-text-muted" style={{ marginLeft: 'auto' }} title={new Date(p.creada).toLocaleString('es-AR')}>{hace(p.creada)}</span>
                </div>
                <DetallePedido p={p} />
                {p.mensaje && <p className="gt-pedido-mensaje">“{p.mensaje}”</p>}
                <div className="gt-pedido-acciones">
                  <Link to={`/rutinas/nueva?socioId=${p.socioId}`} className="gt-btn gt-btn-primary gt-btn-sm"><PencilRuler size={14} aria-hidden /> Armarle una</Link>
                  <Link to={`/rutinas/asignar?socioId=${p.socioId}`} className="gt-btn gt-btn-secondary gt-btn-sm"><LayoutTemplate size={14} aria-hidden /> Asignar plantilla</Link>
                  {p.estado === 'PENDIENTE' && (
                    <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado === p.id}
                      onClick={() => accion(p, () => tomarPedido(p.id), 'Lo tomaste vos')}>
                      <Hand size={14} aria-hidden /> Lo tomo
                    </button>
                  )}
                  <span style={{ flex: 1 }} />
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="gt-icon-btn" aria-label={`WhatsApp a ${p.socio}`} title="WhatsApp"><MessageCircle size={16} /></a>}
                  <IconButton icono={CircleCheck} etiqueta="Ya está (le renové la rutina que tenía)" disabled={ocupado === p.id}
                    onClick={() => accion(p, () => pedidoHecho(p.id), 'Pedido resuelto: le avisamos al socio')} />
                  <IconButton icono={X} etiqueta="Descartar el pedido" tono="danger" disabled={ocupado === p.id} onClick={() => { setDescartando(p); setMotivo('') }} />
                </div>
              </article>
            )
          })}
        </div>
      )}
      <p className="gt-hint" style={{ marginTop: 10 }}>
        Al armarle o asignarle una rutina al socio, el pedido se cierra solo y le llega un aviso a su app.
      </p>

      {datos.resueltos.length > 0 && (
        <section className="gt-card" style={{ marginTop: 16 }}>
          <p className="gt-subtitulo" style={{ marginTop: 0 }}>Resueltos en las últimas 2 semanas</p>
          {datos.resueltos.map(p => (
            <div key={p.id} className="gt-pedido-resuelto">
              <Link to={`/socios/${p.socioId}/perfil`}>{p.socio}</Link>
              <Pill tono={ESTADO[p.estado].tono}>{ESTADO[p.estado].texto}</Pill>
              <span className="gt-text-sm gt-text-muted">
                {p.rutinaNombre ? `${p.rutinaNombre} · ` : ''}{p.motivo ? `“${p.motivo}” · ` : ''}{p.resuelta ? formatFecha(p.resuelta) : ''}{p.resueltaPor && p.resueltaPor !== 'socio' ? ` · ${p.resueltaPor}` : ''}
              </span>
            </div>
          ))}
        </section>
      )}

      {descartando && (
        <Modal titulo="Descartar el pedido" onCerrar={() => setDescartando(null)} ancho={460}
          pie={<>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={() => setDescartando(null)}>Volver</button>
            <button type="button" className="gt-btn gt-btn-danger" disabled={motivo.trim().length < 5 || ocupado !== null} onClick={confirmarDescarte}>Descartar</button>
          </>}>
          <p style={{ marginTop: 0 }}>A <strong>{descartando.socio}</strong> le llega este mensaje en su app:</p>
          <textarea className="gt-input" rows={3} maxLength={300} value={motivo} autoFocus
            placeholder="Ej: Pasá por el salón el martes así te evaluamos y te la armamos."
            onChange={e => setMotivo(e.target.value)} aria-label="Motivo" />
          <span className="gt-hint">{motivo.trim().length}/300</span>
        </Modal>
      )}
    </>
  )
}
