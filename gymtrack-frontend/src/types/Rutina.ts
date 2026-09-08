// Rutina devuelta por el backend
export interface Rutina {
 id?: number
 nombre: string
 descripcion?: string
 socioId: number | null
 socioNombre?: string | null
 fechaCreacion?: string
}
// DTO para crear o actualizar una rutina
export interface RutinaRequestDTO {
 nombre: string
 descripcion?: string
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
 // Info del catálogo (presente si el ejercicio está vinculado al catálogo)
 ejercicioCatalogoId?: number
 esMaquina?: boolean
 descripcionEjercicio?: string
 grupoMuscular?: string
 imagenUrl?: string
 maquinaIds?: number[]
 // Nombres resueltos de las máquinas requeridas (enriquecido en el frontend)
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
