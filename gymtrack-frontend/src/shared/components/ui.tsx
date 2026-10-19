import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { LoaderCircle } from 'lucide-react'

/**
 * Piezas comunes de las pantallas (encabezado, resumen, pestañas, estados vacíos y de carga).
 * Usan las clases de index.css, así todas las pantallas se ven iguales y respetan el modo oscuro.
 */

/** Título de la pantalla con bajada y acciones a la derecha */
export function PageHeader({ titulo, subtitulo, acciones }: { titulo: ReactNode; subtitulo?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="gt-page-head">
      <div>
        <h1 className="gt-page-title" style={{ margin: 0 }}>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {acciones && <div className="gt-page-head-acciones">{acciones}</div>}
    </div>
  )
}

export type Tono = 'ok' | 'warn' | 'danger' | 'info' | 'neutral'

export interface ItemResumen {
  valor: ReactNode
  texto: string
  tono?: Tono
  icono?: LucideIcon
  /** Si tiene onClick, el número funciona como filtro */
  onClick?: () => void
  activo?: boolean
}

/** Fila de números clave arriba de la pantalla */
export function Resumen({ items }: { items: ItemResumen[] }) {
  return (
    <div className="gt-resumen" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))` }}>
      {items.map(it => {
        const Icono = it.icono
        const contenido = (
          <>
            <span className="gt-resumen-valor">
              {Icono && <Icono size={16} aria-hidden />}
              {it.valor}
            </span>
            <span className="gt-resumen-texto">{it.texto}</span>
          </>
        )
        const clase = `gt-resumen-item${it.tono ? ` ${it.tono}` : ''}${it.activo ? ' activo' : ''}`
        return it.onClick
          ? <button key={it.texto} type="button" className={clase} onClick={it.onClick} aria-pressed={!!it.activo}>{contenido}</button>
          : <div key={it.texto} className={clase}>{contenido}</div>
      })}
    </div>
  )
}

export interface OpcionSegmentado<T extends string> { valor: T; texto: string; icono?: LucideIcon; cuenta?: number }

/** Pestañas compactas (mismo estilo en toda la app) */
export function Segmentado<T extends string>({ opciones, valor, onChange, etiqueta }: {
  opciones: OpcionSegmentado<T>[]
  valor: T
  onChange: (v: T) => void
  etiqueta: string
}) {
  return (
    <div className="gt-segmentado" role="tablist" aria-label={etiqueta}>
      {opciones.map(o => {
        const Icono = o.icono
        return (
          <button key={o.valor} type="button" role="tab" aria-selected={valor === o.valor}
            className={valor === o.valor ? 'activo' : ''} onClick={() => onChange(o.valor)}>
            {Icono && <Icono size={15} aria-hidden />}
            {o.texto}
            {o.cuenta != null && <span className="gt-segmentado-cuenta">{o.cuenta}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Etiqueta de estado (operativa, con falla, pendiente…) */
export function Pill({ tono = 'neutral', icono: Icono, children, title }: { tono?: Tono; icono?: LucideIcon; children: ReactNode; title?: string }) {
  return (
    <span className={`gt-pill ${tono}`} title={title}>
      {Icono && <Icono size={12} aria-hidden />}
      {children}
    </span>
  )
}

/** Pantalla o lista vacía: explica qué pasa y ofrece qué hacer */
export function EmptyState({ icono: Icono, titulo, texto, accion }: { icono: LucideIcon; titulo: string; texto?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="gt-empty-state">
      <span className="gt-empty-state-icono"><Icono size={26} aria-hidden /></span>
      <strong>{titulo}</strong>
      {texto && <p>{texto}</p>}
      {accion}
    </div>
  )
}

/** Bloque gris animado mientras carga */
export function Skeleton({ alto = 16, ancho = '100%', radio = 8 }: { alto?: number; ancho?: number | string; radio?: number }) {
  return <span className="gt-skel" style={{ height: alto, width: ancho, borderRadius: radio }} aria-hidden />
}

/** Grilla de tarjetas "fantasma" mientras carga una lista */
export function SkeletonTarjetas({ cantidad = 6, alto = 132 }: { cantidad?: number; alto?: number }) {
  return (
    <div className="gt-skel-grid" role="status" aria-label="Cargando">
      {Array.from({ length: cantidad }, (_, i) => <Skeleton key={i} alto={alto} radio={12} />)}
    </div>
  )
}

/** Botón chico con solo un ícono (siempre con texto accesible) */
export function IconButton({ icono: Icono, etiqueta, onClick, tono, disabled }: {
  icono: LucideIcon; etiqueta: string; onClick: (e: React.MouseEvent) => void; tono?: 'danger'; disabled?: boolean
}) {
  return (
    <button type="button" className={`gt-icon-btn${tono ? ` ${tono}` : ''}`} onClick={onClick} aria-label={etiqueta} title={etiqueta} disabled={disabled}>
      <Icono size={16} aria-hidden />
    </button>
  )
}

/** Esqueleto de una pantalla completa (título, números y filas) mientras carga */
export function CargandoPagina({ filas = 5, resumen = true }: { filas?: number; resumen?: boolean }) {
  return (
    <div role="status" aria-label="Cargando" className="gt-cargando-pagina">
      <Skeleton alto={28} ancho={220} />
      <Skeleton alto={14} ancho={320} />
      {resumen && (
        <div className="gt-cargando-resumen">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} alto={64} radio={12} />)}
        </div>
      )}
      {Array.from({ length: filas }, (_, i) => <Skeleton key={i} alto={52} radio={10} />)}
    </div>
  )
}

/** Ruedita de carga: en botones mientras se guarda, o junto a un texto */
export function Spinner({ size = 16 }: { size?: number }) {
  return <LoaderCircle size={size} className="gt-spinner" aria-hidden />
}

/** "Cargando…" con la ruedita, para listas y secciones que todavía no llegaron */
export function Cargando({ texto = 'Cargando…', tarjeta = false }: { texto?: string; tarjeta?: boolean }) {
  const contenido = (
    <div className="gt-cargando" role="status" aria-live="polite">
      <Spinner size={18} /><span>{texto}</span>
    </div>
  )
  return tarjeta ? <div className="gt-card gt-mb-20">{contenido}</div> : contenido
}
