import { Link } from 'react-router-dom'
import { MessageCircle, Pencil, RotateCcw, Trash2, UserX } from 'lucide-react'
import type { Socio } from '../types/Socio'
import { formatFecha } from '../../../shared/utils/fechas'
import { IconButton, Pill, type Tono } from '../../../shared/components/ui'
import { linkWhatsApp } from '../../../shared/utils/whatsapp'
import type { BajaSocio } from '../services/socioService'
import { textoMotivoBaja } from '../utils/motivosBaja'

interface Props {
  socios: Socio[]
  onEditar: (socio: Socio) => void
  onEliminar: (id: number) => void
  onReactivar: (id: number) => void
  onEliminarPermanente: (id: number) => void
  membresiaMap?: Map<number, string>
  bajaPorSocio?: Map<number, BajaSocio>
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
export default function SocioTabla({ socios, onEditar, onEliminar, onReactivar, onEliminarPermanente, membresiaMap, bajaPorSocio }: Props) {
  return (
    <div className="gt-socios-lista">
      <div className="gt-socios-fila gt-socios-cab" aria-hidden>
        <span>Socio</span><span>Contacto</span><span>Membresía</span><span>Alta</span><span />
      </div>
      {socios.map(s => {
        const inactivo = s.activo === false || s.estado === 'INACTIVO'
        const mem = MEMBRESIA[membresiaMap?.get(s.id!) ?? 'SIN_MEMBRESIA'] ?? MEMBRESIA.SIN_MEMBRESIA
        const baja = inactivo ? bajaPorSocio?.get(s.id!) : undefined
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
                    {baja && <small className="gt-socio-baja" title={baja.detalle ?? undefined}>{textoMotivoBaja(baja.motivo)} · {formatFecha(baja.fecha)}</small>}
                  </>
                : <Pill tono={mem.tono}>{mem.texto}</Pill>}
            </span>
            <span className="gt-socio-alta">{formatFecha(s.fechaCreacion)}</span>
            <span className="gt-socio-acciones">
              {inactivo ? (
                <>
                  <IconButton icono={RotateCcw} etiqueta={`Reactivar a ${s.nombre}`} onClick={() => onReactivar(s.id!)} />
                  <IconButton icono={Trash2} etiqueta={`Eliminar a ${s.nombre} para siempre`} tono="danger" onClick={() => onEliminarPermanente(s.id!)} />
                </>
              ) : (
                <>
                  <IconButton icono={Pencil} etiqueta={`Editar a ${s.nombre}`} onClick={() => onEditar(s)} />
                  <IconButton icono={UserX} etiqueta={`Dar de baja a ${s.nombre}`} tono="danger" onClick={() => onEliminar(s.id!)} />
                </>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
