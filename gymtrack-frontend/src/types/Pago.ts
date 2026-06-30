export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
export type EstadoPago = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO'

export interface Pago {
  id?: number
  membresiaId: number
  socioId?: number
  socioNombre?: string
  monto: number
  metodoPago: MetodoPago
  estadoPago?: EstadoPago
  fechaPago?: string
  observaciones?: string
}

export interface PagoRequestDTO {
  membresiaId: number
  monto: number
  metodoPago: MetodoPago
  observaciones?: string
}
