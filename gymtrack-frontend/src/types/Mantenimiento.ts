export type TipoMantenimiento = 'PENDIENTE' | 'REALIZADO'

export interface Mantenimiento {
  id?: number
  maquinaId: number
  maquinaNombre?: string
  maquinaNroMaquina?: string
  tipo: TipoMantenimiento
  descripcion: string
  fechaMantenimiento?: string
  tecnico?: string
  costo?: number
  observaciones?: string
  fechaCreacion?: string
}

export interface MantenimientoRequest {
  maquinaId: number
  tipo: TipoMantenimiento
  descripcion: string
  fechaMantenimiento?: string
  tecnico?: string
  costo?: number
  observaciones?: string
}
