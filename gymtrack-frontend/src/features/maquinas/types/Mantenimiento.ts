/** Estado del trabajo */
export type TipoMantenimiento = 'PENDIENTE' | 'REALIZADO'
/** Naturaleza del trabajo: preventivo (antes de que se rompa) o correctivo (ya falla) */
export type CategoriaMantenimiento = 'PREVENTIVO' | 'CORRECTIVO'

export interface Mantenimiento {
  id?: number
  maquinaId: number
  maquinaNombre?: string
  maquinaNroMaquina?: string
  tipo: TipoMantenimiento
  categoria?: CategoriaMantenimiento | null
  descripcion: string
  fechaMantenimiento?: string
  fechaAlta?: string
  tecnico?: string
  telefonoTecnico?: string
  costo?: number
  observaciones?: string
  fechaCreacion?: string
  /** Calculado en backend: días entre fechaMantenimiento y fechaAlta */
  diasInactividad?: number
}

export interface MantenimientoRequest {
  maquinaId: number
  tipo: TipoMantenimiento
  categoria?: CategoriaMantenimiento | null
  descripcion: string
  fechaMantenimiento?: string
  fechaAlta?: string
  tecnico?: string
  telefonoTecnico?: string
  costo?: number
  observaciones?: string
}

export interface MaquinaEstadisticas {
  maquinaId: number
  maquinaNombre: string
  maquinaNroMaquina?: string
  totalReparaciones: number
  costoTotal: number
  diasInactividadTotal: number
  diasInactividadPromedio: number
}
