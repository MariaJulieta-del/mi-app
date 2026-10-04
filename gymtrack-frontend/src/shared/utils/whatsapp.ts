/**
 * Link de WhatsApp con mensaje precargado (abre la app o WhatsApp Web).
 * Normaliza teléfonos argentinos: saca 0 y 15, y agrega 549 si falta.
 */
export function linkWhatsApp(telefono: string | null | undefined, mensaje: string): string | null {
  if (!telefono) return null
  let n = telefono.replace(/\D/g, '')
  if (n.length < 8) return null
  if (n.startsWith('00')) n = n.slice(2)
  if (!n.startsWith('54')) {
    if (n.startsWith('0')) n = n.slice(1)
    // 11 15 1234-5678 → 11 1234-5678
    n = n.replace(/^(\d{2,4})15(\d{6,8})$/, '$1$2')
    n = '549' + n
  } else if (!n.startsWith('549')) {
    n = '549' + n.slice(2)
  }
  return `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}`
}
