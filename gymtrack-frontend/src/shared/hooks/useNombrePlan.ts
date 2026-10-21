import { useEffect, useState } from 'react'
import { listarTarifas } from '../../features/membresias/services/tarifaService'

/** Nombres de los planes por código (MENSUAL → "Pase libre mensual"), buscados una sola vez por sesión */
let cache: Record<string, string> | null = null
let pedido: Promise<Record<string, string>> | null = null

function cargar(): Promise<Record<string, string>> {
  if (cache) return Promise.resolve(cache)
  pedido ??= listarTarifas()
    .then(ts => (cache = Object.fromEntries(ts.map(t => [t.tipo, t.nombre]))))
    .catch(() => { pedido = null; return {} })
  return pedido
}

/** Devuelve una función que traduce el código del plan a su nombre (si no lo encuentra, muestra el código) */
export function useNombrePlan(): (tipo?: string | null) => string {
  const [nombres, setNombres] = useState<Record<string, string>>(cache ?? {})
  useEffect(() => {
    if (!cache) cargar().then(setNombres)
  }, [])
  return tipo => (tipo ? nombres[tipo] ?? tipo : '')
}
