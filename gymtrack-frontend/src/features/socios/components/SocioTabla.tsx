import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, BellRing, MessageCircle, Pencil, RotateCcw, UserX } from 'lucide-react'
import type { Socio } from '../types/Socio'
import { formatFecha } from '../../../shared/utils/fechas'
import { IconButton, Pill, type Tono } from '../../../shared/components/ui'
import { linkWhatsApp } from '../../../shared/utils/whatsapp'
import type { SocioFila } from '../services/socioService'
import type { Orden } from '../hooks/useSociosPage'
import { textoMotivoBaja } from '../utils/motivosBaja'

interface Props {
  socios: SocioFila[]
  onEditar: (socio: Socio) => void
  onEliminar: (id: number) => void
  onReactivar: (id: number) => void
  /** Socio con una operación en curso (botones deshabilitados) */
  ocupado?: number | 'editar' | null
  orden: Orden
  desc: boolean
  onOrdenar: (o: Orden) => void
}

/** Encabezado de columna que ordena (accesible con teclado y lector de pantalla) */
function Columna({ campo, texto, orden, desc, onOrdenar }: { campo: Orden; texto: string; orden: Orden; desc: boolean; onOrdenar: (o: Orden) => void }) {
  const activa = orden === campo
  return (
    <button type="button" className={`gt-socios-orden${activa ? ' activa' : ''}`} onClick={() => onOrdenar(campo)}
      aria-label={`Ordenar por ${texto.toLowerCase()}${activa ? (desc ? ', ahora de mayor a menor' : ', ahora de menor a mayor') : ''}`}>
      {texto}{activa && (desc ? <ArrowDown size={13} aria-hidden /> : <ArrowUp size={13} aria-hidden />)}
    </button>
  )
}

const MEMBRESIA: Record<string, { texto: string; tono: Tono }> = {
  ACTIVA: { texto: 'Al día', tono: 'ok' },
  VENCIDA: { texto: 'Vencida', tono: 'danger' },
  CANCELADA: { texto: 'Cancelada', tono: 'neutral' },
  SIN_MEMBRESIA: { texto: 'Sin membresía', tono: 'warn' },
}

const iniciales = (s: Socio) => `${s.nombre?.[0] ?? ''}${s.apellido?.[0] ?? ''}`.toUpperCase()

/**
 * Lista de socios. En la computadora es una tabla; en el celular, una tarjeta por socio
 * (el mismo contenido, sin tener que desplazar a los costados).
 */
export default function SocioTabla({ socios, onEditar, onEliminar, onReactivar, ocupado, orden, desc, onOrdenar }: Props) {
  const col = { orden, desc, onOrdenar }
  return (
    <div className="gt-socios-lista">
      <div className="gt-socios-fila gt-socios-cab">
        <span><Columna campo="apellido" texto="Socio" {...col} /></span>
        <span>Contacto</span>
        <span><Columna campo="vencimiento" texto="Membresía" {...col} /></span>
        <span><Columna campo="alta" texto="Alta" {...col} /></span>
        <span />
      </div>
      {socios.map(s => {
        const inactivo = s.activo === false || s.estado === 'INACTIVO'
        const mem = MEMBRESIA[s.estadoMembresia ?? 'SIN_MEMBRESIA'] ?? MEMBRESIA.SIN_MEMBRESIA
        const baja = inactivo && s.motivoBaja ? { motivo: s.motivoBaja, fecha: s.fechaBaja } : undefined
        const wa = s.telefono ? linkWhatsApp(s.telefono, `¡Hola ${s.nombre}!`) : null
        return (
          <div key={s.id} className={`gt-socios-fila${inactivo ? ' inactivo' : ''}`}>
            <Link to={`/socios/${s.id}/perfil`} className="gt-socio-nombre">
              <span className="gt-avatar" aria-hidden>{iniciales(s)}</span>
              <span style={{ minWidth: 0 }}>
                <strong>{s.nombre} {s.apellido}</strong>
                <small>DNI {s.dni}</small>
              </span>
            </Link>
            <span className="gt-socio-contacto">
              {s.telefono
                ? <>{s.telefono}{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="gt-socio-wa" aria-label={`WhatsApp a ${s.nombre}`} title="WhatsApp"><MessageCircle size={14} /></a>}</>
                : <span className="gt-text-muted">Sin teléfono</span>}
              {s.email && <small>{s.email}</small>}
            </span>
            <span>
              {inactivo
                ? <>
                    <Pill tono="neutral">Dado de baja</Pill>
                    {baja && <small className="gt-socio-baja">{textoMotivoBaja(baja.motivo)} · {formatFecha(baja.fecha)}</small>}
                  </>
                : <>
                    <Pill tono={mem.tono}>{mem.texto}</Pill>
                    {s.vencimiento && s.estadoMembresia !== 'CANCELADA' && <small className="gt-socio-baja">{s.estadoMembresia === 'VENCIDA' ? 'venció' : 'vence'} el {formatFecha(s.vencimiento)}</small>}
                  </>}
            </span>
            <span className="gt-socio-alta">{formatFecha(s.fechaCreacion)}</span>
            <span className="gt-socio-acciones">
              {inactivo ? (
                <IconButton icono={RotateCcw} etiqueta={`Reactivar a ${s.nombre}`} disabled={ocupado != null} onClick={() => onReactivar(s.id)} />
              ) : (
                <>
                  {s.estadoMembresia === 'VENCIDA' && (
                    <Link className="gt-socio-avisar" title={`Escribirle a ${s.nombre} que se le venció la membresía`}
                      to={`/notificaciones?socio=${s.id}&motivo=vencida${s.vencimiento ? `&vence=${s.vencimiento}` : ''}`}>
                      <BellRing size={14} aria-hidden /> Avisar
                    </Link>
                  )}
                  <IconButton icono={Pencil} etiqueta={`Editar a ${s.nombre}`} onClick={() => onEditar(s)} />
                  <span className="gt-sep-accion" aria-hidden />
                  <IconButton icono={UserX} etiqueta={`Dar de baja a ${s.nombre}`} tono="danger" disabled={ocupado != null} onClick={() => onEliminar(s.id)} />
                </>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
