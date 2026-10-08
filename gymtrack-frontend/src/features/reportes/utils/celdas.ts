/** Opacidad de la celda según el porcentaje (una sola escala de color) */
export const celdaPct = (v: number | null) => (v == null ? undefined : { background: `color-mix(in srgb, var(--accent) ${Math.round(12 + v * 0.7)}%, transparent)`, color: v >= 55 ? 'var(--on-accent)' : 'var(--text-primary)' })
