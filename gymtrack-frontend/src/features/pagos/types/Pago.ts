export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
export type EstadoPago = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO'
export interface Pago {
 id?: number
 membresiaId: number
 socioId?: number
 socioNombre?: string
 tipoMembresia?: string
 estadoMembresia?: string
 monto: number
 metodoPago: MetodoPago
 estadoPago?: EstadoPago
 fechaPago?: string
 observaciones?: string
}
