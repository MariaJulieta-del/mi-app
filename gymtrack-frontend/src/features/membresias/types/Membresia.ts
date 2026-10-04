/** Cada socio tiene UNA membresía, que se renueva pagando un plan. No existe el fiado. */
export type EstadoMembresia = 'ACTIVA' | 'VENCIDA' | 'CANCELADA'

export interface Membresia {
  id: number
  socioId: number
  socioNombreCompleto: string
  tipoMembresia: string
  planNombre: string
  estadoMembresia: EstadoMembresia
  fechaInicio: string
  fechaVencimiento: string
  precio: number
  fechaCreacion?: string
  /** Días hasta el vencimiento (negativo si ya venció) */
  diasRestantes: number | null

  // Pases del ciclo mensual actual (calculados en el backend)
  paseLibre: boolean
  pasesMensuales: number | null
  pasesUsados: number
  pasesRestantes: number | null
  cicloInicio: string
  cicloFin: string
}
