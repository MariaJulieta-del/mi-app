export interface CierreCajaResumen {
  id?: number
  fecha: string
  /** Cambio con el que arrancó la caja (lo que quedó del cierre anterior) */
  fondoInicial: number
  totalEfectivo: number
  totalTarjeta: number
  totalTransferencia: number
  totalIngresos: number
  totalEgresos: number
  /** Efectivo que debería haber: fondo + cobros en efectivo − gastos */
  balanceCalculado: number
  montoContado?: number | null
  diferencia?: number | null
  /** Lo que quedó en la caja para el día siguiente */
  dejaEnCaja?: number | null
  /** Lo que se retiró al cerrar */
  retiro?: number | null
  cantidadPagos: number
  observaciones?: string | null
  creadoPor?: string | null
  createdAt?: string | null
  cerrada: boolean
}

export interface CierreCajaRequest {
  fecha?: string
  montoContado?: number
  dejaEnCaja?: number
  observaciones?: string
}
