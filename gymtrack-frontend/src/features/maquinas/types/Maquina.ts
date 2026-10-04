export interface Maquina {
  id?: number
  nroMaquina: string
  nombre: string
  descripcion?: string
  grupos?: string[]
  instruccionesUso?: string
  ajustes?: string
  activa: boolean
}
