// Interfaz que representa una rutina devuelta por el backend
export interface Rutina {
  id?: number
  nombre: string
  descripcion?: string
  socioId: number
  fechaCreacion?: string
}

// Interfaz para los datos que se envían al crear o actualizar una rutina
export interface RutinaRequestDTO {
  nombre: string
  descripcion?: string
}
