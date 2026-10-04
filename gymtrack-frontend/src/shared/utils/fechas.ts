/**
 * Helpers de fecha en hora LOCAL.
 *
 * Evitan dos errores clásicos con zonas horarias negativas (Argentina, UTC-3):
 *  - `new Date().toISOString().slice(0, 10)` devuelve la fecha UTC → después de las 21 hs da "mañana".
 *  - `new Date('2026-10-03')` se interpreta como medianoche UTC → se muestra como 02/10.
 */

/** Fecha local en formato YYYY-MM-DD (para inputs type="date" y query params) */
export function fechaLocalISO(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Formatea una fecha ISO (YYYY-MM-DD o con hora) como dd/mm/aaaa sin corrimiento de día */
export function formatFecha(iso?: string | null): string {
  if (!iso) return '—'
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  const d = new Date(soloFecha ? iso + 'T00:00:00' : iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-AR')
}
