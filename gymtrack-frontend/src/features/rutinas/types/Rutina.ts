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
  /** Indicaciones personales del profe para el socio */
  notasProfe?: string | null
  /** Ejercicios sin contar la entrada en calor */
  cantidadEjercicios?: number
  /** Cantidad de días (Día 1, Día 2…) */
  cantidadDias?: number
  /** Semanas que el socio lleva con esta rutina (desde que se cambiaron los ejercicios por última vez) */
  semanasActual?: number
  /** Límite de semanas que fijó el gimnasio (Configuración) */
  semanasMax?: number
  /** Rutina de un socio que ya superó el límite: hay que renovarla */
  paraRenovar?: boolean
  fechaRenovacion?: string
  /** Plantilla visible en la app de los socios */
  visibleSocios?: boolean
  /** La eligió el propio socio desde las plantillas */
  elegidaPorSocio?: boolean
  /**
   * Plantilla asignada al socio (no es una copia): socioId/socioNombre son del socio y las semanas
   * se cuentan desde que se la asignaron. Para ajustarla solo para él, se personaliza.
   */
  asignada?: boolean
  /** Plantillas: a cuántos socios está asignada */
  cantidadAsignados?: number
  /** Plantillas: cuántos de esos socios ya tienen que renovarla */
  asignadosParaRenovar?: number
}

/** Un socio que tiene asignada una plantilla */
export interface Asignacion {
  plantillaId: number
  plantillaNombre: string
  socioId: number
  socioNombre: string
  fechaAsignacion: string
  /** Desde cuándo la hace tal como está (asignación o último cambio de la plantilla) */
  desde: string
  semanas: number
  semanasMax: number
  paraRenovar: boolean
  elegidaPorSocio: boolean
  asignadaPor?: string | null
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
  /** Indicaciones personales del profe (rutinas de socio) */
  notasProfe?: string
}
export interface MaquinaDeEjercicio {
  id: number
  nombre: string
  nroMaquina?: string | null
  /** true = no está asociada al ejercicio: se dedujo por el nombre */
  sugerida?: boolean
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
  /** Máquinas activas asociadas en el catálogo, con su número */
  maquinas?: MaquinaDeEjercicio[]
  /** true → pertenece al bloque inamovible de Entrada en Calor */
  esCalentamiento?: boolean
  /** Día al que pertenece dentro de la rutina (1, 2, 3...) */
  dia?: number
  /** Superserie: los seguidos con el mismo número se hacen alternando series */
  superserie?: number | null
}
// DTO para agregar un ejercicio a una rutina
export interface EjercicioRequestDTO {
  /** Al guardar todos juntos: id del que ya estaba en la rutina */
  id?: number
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
