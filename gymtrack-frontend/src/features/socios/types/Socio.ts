export type Genero = 'FEMENINO' | 'MASCULINO' | 'NO_BINARIO'

export const GENEROS: { valor: Genero; texto: string }[] = [
  { valor: 'FEMENINO', texto: 'Femenino' },
  { valor: 'MASCULINO', texto: 'Masculino' },
  { valor: 'NO_BINARIO', texto: 'No binario' },
]

export const textoGenero = (g?: Genero | null) => GENEROS.find(x => x.valor === g)?.texto ?? null

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
 /** FEMENINO, MASCULINO o NO_BINARIO */
 genero?: Genero | null
 fechaInicio?: string
 fechaVencimiento?: string
 fechaCreacion?: string
 fechaModificacion?: string
}
