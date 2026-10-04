export interface Socio {
 id?: number
 nombre: string
 apellido: string
 dni: string
 email?: string
 telefono?: string
 estado?: string
 activo?: boolean
 fechaNacimiento?: string
 fechaInicio?: string
 fechaVencimiento?: string
 fechaCreacion?: string
 fechaModificacion?: string
 disciplina?: { id: number; nombre: string; instructor?: string; horario?: string } | null
}
