export interface CierreCajaResumen {
  id?: number
  fecha: string
  totalEfectivo: number
  totalTarjeta: number
  totalTransferencia: number
  totalIngresos: number
  totalEgresos: number
  balanceCalculado: number
  montoContado?: number
  diferencia?: number
  cantidadPagos: number
  observaciones?: string
  creadoPor?: string
  createdAt?: string
  cerrada: boolean
}

export interface CierreCajaRequest {
  fecha?: string
  montoContado?: number
  observaciones?: string
  creadoPor?: string
}
