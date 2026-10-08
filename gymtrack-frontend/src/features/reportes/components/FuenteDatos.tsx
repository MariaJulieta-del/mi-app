import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

/** Explicación plegable de dónde sale cada número del reporte */
export default function FuenteDatos({ children }: { children: ReactNode }) {
  return (
    <details className="gt-fuente">
      <summary><Info size={14} aria-hidden /> ¿De dónde salen estos datos?</summary>
      <ul>{children}</ul>
    </details>
  )
}
