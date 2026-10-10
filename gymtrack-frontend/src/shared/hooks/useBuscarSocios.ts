import { useEffect, useState } from 'react'
import { buscarSocios, type SocioFila } from '../../features/socios/services/socioService'

/**
 * Buscador de socios para los selectores (cobrar, avisos, rutinas, clases…).
 * Busca en el servidor recién cuando se deja de escribir y cancela la búsqueda anterior,
 * en lugar de bajar la lista entera de socios al abrir cada pantalla.
 */
export function useBuscarSocios(texto: string, { tam = 8, vista = 'activos' as const, minimo = 1 }: { tam?: number; vista?: 'activos' | 'todos'; minimo?: number } = {}) {
  const [resultados, setResultados] = useState<SocioFila[]>([])
  const [buscando, setBuscando] = useState(false)
  const q = texto.trim()

  useEffect(() => {
    if (q.length < minimo) return
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      setBuscando(true)
      buscarSocios({ q, vista, tam, orden: 'apellido' }, ctrl.signal)
        .then(d => setResultados(d.items))
        .catch(() => { if (!ctrl.signal.aborted) setResultados([]) })
        .finally(() => { if (!ctrl.signal.aborted) setBuscando(false) })
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q, tam, vista, minimo])

  // Con el texto vacío no se muestra nada (sin pedir al servidor)
  return { resultados: q.length < minimo ? [] : resultados, buscando: q.length >= minimo && buscando }
}
