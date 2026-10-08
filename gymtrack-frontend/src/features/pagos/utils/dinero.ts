/** $12.500 (sin decimales si es entero) */
export const pesos = (n: number | null | undefined) =>
  n == null ? '—' : `${n < 0 ? '−' : ''}$${Math.abs(Number(n)).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`

/** Texto y tono de una diferencia de caja */
export function textoDiferencia(dif: number | null | undefined): { texto: string; tono: 'ok' | 'warn' | 'danger' | 'neutral' } {
  if (dif == null) return { texto: 'Sin contar', tono: 'neutral' }
  if (Math.abs(dif) < 0.5) return { texto: 'Cuadra', tono: 'ok' }
  return dif > 0 ? { texto: `Sobran ${pesos(dif)}`, tono: 'warn' } : { texto: `Faltan ${pesos(-dif)}`, tono: 'danger' }
}

export const METODOS = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TARJETA', texto: 'Tarjeta' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
] as const

export const CATEGORIAS_GASTO = [
  { valor: 'VARIOS', texto: 'Varios' },
  { valor: 'LIMPIEZA', texto: 'Limpieza' },
  { valor: 'SUMINISTROS', texto: 'Insumos' },
  { valor: 'REPARACION', texto: 'Reparación' },
] as const

/** Billetes y monedas en circulación para el arqueo */
export const DENOMINACIONES = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10] as const

/** Suma del contador de billetes */
export const totalArqueo = (c: Record<number, string>) =>
  DENOMINACIONES.reduce((s, d) => s + Number(c[d] || 0) * d, 0)
