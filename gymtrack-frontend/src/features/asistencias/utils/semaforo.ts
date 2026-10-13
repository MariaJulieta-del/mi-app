import { Ban, CircleCheck, TriangleAlert } from 'lucide-react'

/** Colores y textos del resultado de un ingreso (calculado en el backend) */
export const SEMAFORO = {
  VERDE:    { titulo: 'ACCESO PERMITIDO', icono: CircleCheck, color: 'var(--green-text)',  bg: 'var(--green-bg)' },
  AMARILLO: { titulo: 'ACCESO PERMITIDO · ATENCIÓN', icono: TriangleAlert, color: 'var(--yellow-text)', bg: 'var(--yellow-bg)' },
  ROJO:     { titulo: 'ACCESO DENEGADO', icono: Ban, color: 'var(--red)', bg: 'var(--red-light)' },
} as const

export type Semaforo = keyof typeof SEMAFORO
