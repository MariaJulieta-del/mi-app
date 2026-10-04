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
  /** Objetivo: FUERZA | HIPERTROFIA | RESISTENCIA | PERDIDA_GRASA | SALUD */
  objetivo?: string | null
  /** Ejercicios sin contar la entrada en calor */
  cantidadEjercicios?: number
  /** Cantidad de días (Día 1, Día 2…) */
  cantidadDias?: number
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
  /** Objetivo: FUERZA | HIPERTROFIA | RESISTENCIA | PERDIDA_GRASA | SALUD */
  objetivo?: string
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
  /** true → pertenece al bloque inamovible de Entrada en Calor */
  esCalentamiento?: boolean
  /** Día al que pertenece dentro de la rutina (1, 2, 3...) */
  dia?: number
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
  esCalentamiento?: boolean
  dia?: number
}

// Registro de progreso del socio para un ejercicio
export interface ProgresoEjercicio {
  id?: number
  fecha: string
  pesoKg?: number | null
  repeticionesReales?: number | null
  seriesRealizadas?: number | null
  observacion?: string | null
}
