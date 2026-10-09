export interface Tarifa {
  tipo: string
  nombre: string
  precio: number
  duracionDias: number
  /** Pases (ingresos) por mes. null = pase libre */
  pasesMensuales: number | null
  descripcion: string
  incluye: string
  sociosActivos: number
  /** false = deshabilitado: no se ofrece al cobrar */
  activo: boolean
  /** algún socio lo tuvo: no se puede borrar, solo deshabilitar */
  usado: boolean
}

export interface TarifaCreateDTO {
  tipo: string
  nombre: string
  precio: number
  duracionDias: number
  pasesMensuales: number | null
  incluye?: string
}

/** "8 pases/mes" o "Pase libre" */
export function textoPases(pases: number | null | undefined): string {
  return pases ? `${pases} pases/mes` : 'Pase libre'
}
