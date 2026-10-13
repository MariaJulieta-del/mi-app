import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Ventana modal: se cierra con Escape o tocando afuera. En el celular aparece desde abajo. */
export default function Modal({ titulo, onCerrar, children, pie, ancho = 560 }: {
  titulo: ReactNode
  onCerrar: () => void
  children: ReactNode
  /** Botones de abajo (quedan fijos aunque el contenido se desplace) */
  pie?: ReactNode
  ancho?: number
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', h)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = overflow }
  }, [onCerrar])

  // En <body> para que ningún contenedor con transform u overflow lo recorte (Safari en iPhone)
  return createPortal(
    <div className="gt-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCerrar() }}>
      <div className="gt-modal gt-modal-flex" role="dialog" aria-modal="true" style={{ maxWidth: ancho }}>
        <div className="gt-modal-cab">
          <h2 className="gt-modal-title" style={{ margin: 0 }}>{titulo}</h2>
          <button type="button" className="gt-modal-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="gt-modal-cuerpo">{children}</div>
        {pie && <div className="gt-modal-actions gt-modal-pie">{pie}</div>}
      </div>
    </div>,
    document.body,
  )
}
