// Rutina devuelta por el backend
export interface Rutina {
  id?: number
  nombre: string
  descripcion?: string
  /** Trenes musculares — múltiple selección */
  trenes?: string[]
  socioId: number | null
  socioNombre?: string | null
  fechaCreacion?: string
  diasSemana?: string[]
  /** Nivel de dificultad: BAJA | MEDIA | ALTA */
  dificultad?: string
}
// DTO para crear o actualizar una rutina
export interface RutinaRequestDTO {
  nombre: string
  descripcion?: string
  /** Trenes musculares — múltiple selección */
  trenes?: string[]
  diasSemana?: string[]
  /** Nivel de dificultad: BAJA | MEDIA | ALTA */
  dificultad?: string
}
// Ejercicio devuelto por el backend
export interface Ejercicio {
  id?: number
  nombreEjercicio: string
  series?: number
  repeticiones?: number
  pesoKg?: number
  orden: number
  descansoSeg?: number
  notas?: string
  ejercicioCatalogoId?: number
  esMaquina?: boolean
  descripcionEjercicio?: string
  grupos?: string[]
  imagenUrl?: string
  maquinaIds?: number[]
  maquinasNombres?: string[]
}
// DTO para agregar un ejercicio a una rutina
export interface EjercicioRequestDTO {
  nombreEjercicio: string
  series?: number
  repeticiones?: number
  pesoKg?: number
  descansoSeg?: number
  notas?: string
  ejercicioCatalogoId?: number
}
