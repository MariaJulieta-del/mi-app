/** Colores y textos del resultado de un ingreso (calculado en el backend) */
export const SEMAFORO = {
  VERDE:    { titulo: 'ACCESO PERMITIDO', icono: '✅', color: 'var(--green-text)',  bg: 'var(--green-bg)' },
  AMARILLO: { titulo: 'ACCESO PERMITIDO · ATENCIÓN', icono: '⚠️', color: 'var(--yellow-text)', bg: 'var(--yellow-bg)' },
  ROJO:     { titulo: 'ACCESO DENEGADO', icono: '🚫', color: 'var(--red)', bg: 'var(--red-light)' },
} as const

export type Semaforo = keyof typeof SEMAFORO
