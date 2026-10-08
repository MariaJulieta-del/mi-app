import { useCallback, useState } from 'react'

const CLAVE = 'gt-montos-visibles'

function leer(): boolean {
  try { return localStorage.getItem(CLAVE) === '1' } catch { return false }
}

/**
 * Montos de dinero ocultos por defecto (como en las apps de bancos):
 * en una PC de recepción que ve cualquiera, la plata no queda a la vista.
 * Se recuerda en este navegador.
 */
export function useMontosVisibles() {
  const [visibles, setVisibles] = useState(leer)
  const alternar = useCallback(() => {
    setVisibles(v => {
      try { localStorage.setItem(CLAVE, v ? '0' : '1') } catch { /* sin almacenamiento */ }
      return !v
    })
  }, [])
  return { visibles, alternar }
}
