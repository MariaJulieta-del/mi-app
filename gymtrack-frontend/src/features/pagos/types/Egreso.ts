export type CategoriaEgreso = 'LIMPIEZA' | 'REPARACION' | 'SUMINISTROS' | 'VARIOS'

export interface Egreso {
  id: number
  fecha: string
  descripcion: string
  monto: number
  categoria: CategoriaEgreso
  registradoPor?: string
  createdAt?: string
}

export interface EgresoRequestDTO {
  fecha: string
  descripcion: string
  monto: number
  categoria?: CategoriaEgreso
  registradoPor?: string
}
