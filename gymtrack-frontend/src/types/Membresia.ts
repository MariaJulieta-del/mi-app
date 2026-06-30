export type TipoMembresia = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
export type EstadoMembresia = 'PENDIENTE_PAGO' | 'ACTIVA' | 'VENCIDA' | 'CANCELADA'

export interface Membresia {
  id?: number
  socioId: number
  socioNombreCompleto?: string
  tipoMembresia: TipoMembresia
  estadoMembresia?: EstadoMembresia
  fechaInicio?: string
  fechaVencimiento?: string
  precio: number
  fechaCreacion?: string
}

export interface MembresiaRequestDTO {
  socioId: number
  tipoMembresia: TipoMembresia
  fechaInicio?: string
  precio: number
}
