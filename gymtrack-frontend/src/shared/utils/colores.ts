// Colores derivados del color principal del gimnasio (para el tema claro y el oscuro)
type RGB = [number, number, number]
const aRgb = (hex: string): RGB => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as RGB
const aHex = (c: RGB) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mezclar = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t) as RGB
const luminancia = (c: RGB) => {
  const [r, g, b] = c.map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
/** Blanco o casi negro, el que más contraste tenga sobre el color */
const textoSobre = (c: RGB) => (1.05 / (luminancia(c) + 0.05) >= (luminancia(c) + 0.05) / 0.05 ? '#FFFFFF' : '#0B0F0C')

const BLANCO: RGB = [255, 255, 255]
const NEGRO: RGB = [0, 0, 0]
const FONDO_OSCURO: RGB = [17, 17, 17]

/** CSS con las variables del tema para el color elegido (claro y oscuro) */
export function cssDelColor(hex: string): string {
  const c = aRgb(hex)
  // En modo oscuro, un color muy oscuro se aclara para que se distinga del fondo
  const oscuro = luminancia(c) < 0.18 ? mezclar(c, BLANCO, 0.35) : c
  return `:root{--accent:${hex};--accent-hover:${aHex(mezclar(c, NEGRO, 0.15))};--accent-light:${aHex(mezclar(c, BLANCO, 0.92))};` +
    `--accent-border:${aHex(mezclar(c, BLANCO, 0.7))};--on-accent:${textoSobre(c)};--topbar:${aHex(mezclar(c, NEGRO, 0.08))}}` +
    `.dark{--accent:${aHex(oscuro)};--accent-hover:${aHex(mezclar(oscuro, NEGRO, 0.15))};--accent-light:${aHex(mezclar(oscuro, FONDO_OSCURO, 0.82))};` +
    `--accent-border:${aHex(mezclar(oscuro, FONDO_OSCURO, 0.55))};--on-accent:${textoSobre(oscuro)}}`
}


/** Color de texto que se lee sobre el color dado */
export const colorDeTexto = (hex: string) => textoSobre(aRgb(hex))
