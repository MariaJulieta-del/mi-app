/** Mensaje legible de un error de la API (axios) o, si no hay, el texto por defecto */
export function mensajeError(err: unknown, porDefecto: string): string {
  const e = err as { response?: { data?: { error?: unknown; message?: unknown } | string } }
  const data = e?.response?.data
  if (typeof data === 'string' && data.trim()) return data
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string' && data.error) return data.error
    if (typeof data.message === 'string' && data.message) return data.message
  }
  return porDefecto
}
