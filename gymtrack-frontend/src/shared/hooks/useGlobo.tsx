import { useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Globo { x: number; y: number; contenido: ReactNode }

/**
 * Globo de ayuda (tooltip) para los gráficos: sigue al mouse y también aparece al llegar con el teclado.
 * Uso: const g = useGlobo(); <rect {...g.props(<>texto</>)} />; y renderizar {g.globo} una vez.
 */
export function useGlobo() {
  const [globo, setGlobo] = useState<Globo | null>(null)

  const props = (contenido: ReactNode) => ({
    onMouseMove: (e: MouseEvent) => setGlobo({ x: e.clientX, y: e.clientY, contenido }),
    onMouseLeave: () => setGlobo(null),
    onFocus: (e: FocusEvent) => {
      const r = (e.currentTarget as Element).getBoundingClientRect()
      setGlobo({ x: r.left + r.width / 2, y: r.top, contenido })
    },
    onBlur: () => setGlobo(null),
  })

  const nodo = globo && createPortal(
    <div className="gt-globo" role="tooltip" style={{ left: globo.x, top: globo.y }}>{globo.contenido}</div>,
    document.body,
  )
  return { props, globo: nodo }
}
