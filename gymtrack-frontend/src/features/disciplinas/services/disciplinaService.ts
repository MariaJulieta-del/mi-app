import axiosInstance from '../../../shared/services/axiosInstance'

const API = '/api/v1/disciplinas'

export interface Horario {
  /** LUNES … DOMINGO */
  dia: string
  /** "HH:mm" */
  horaInicio: string
  horaFin: string
}

export interface Inscripto {
  socioId: number
  nombre: string
  activo: boolean
  membresiaVigente: boolean
  fechaAlta: string
}

/** Disciplina como la devuelve el backend */
export interface DisciplinaApi {
  id: number
  nombre: string
  descripcion?: string | null
  /** Nombre a mostrar (profesor vinculado o texto libre) */
  instructor?: string | null
  profesorId?: number | null
  cupoMaximo: number | null
  /** 1 a 8 */
  color: number | null
  activa: boolean
  horarios: Horario[]
  totalInscritos: number
  cuposDisponibles: number | null
  /** Solo staff */
  inscriptos?: Inscripto[]
  /** Solo socio: si él está inscripto */
  inscripto?: boolean
}

/** Lo que se envía al crear o editar */
export interface DisciplinaRequest {
  nombre: string
  descripcion?: string
  profesorId?: number | null
  instructor?: string
  cupoMaximo: number | null
  color: number | null
  activa: boolean
  horarios: Horario[]
}

export interface ClaseHoy {
  disciplinaId: number; nombre: string; color: number | null
  horaInicio: string; horaFin: string; instructor: string | null
  inscriptos: number; cupoMaximo: number | null
}

export interface Instructor { id: number; nombre: string }

export const listarDisciplinas = async (soloActivas = true): Promise<DisciplinaApi[]> =>
  (await axiosInstance.get(API, { params: { soloActivas } })).data

export const obtenerDisciplina = async (id: number): Promise<DisciplinaApi> =>
  (await axiosInstance.get(`${API}/${id}`)).data

export const crearDisciplina = async (data: DisciplinaRequest): Promise<DisciplinaApi> =>
  (await axiosInstance.post(API, data)).data

export const actualizarDisciplina = async (id: number, data: DisciplinaRequest): Promise<DisciplinaApi> =>
  (await axiosInstance.put(`${API}/${id}`, data)).data

export const cambiarActivaDisciplina = async (id: number, valor: boolean): Promise<void> => {
  await axiosInstance.patch(`${API}/${id}/activa`, null, { params: { valor } })
}

export const inscribirSocio = async (disciplinaId: number, socioId: number): Promise<DisciplinaApi> =>
  (await axiosInstance.post(`${API}/${disciplinaId}/inscripciones`, { socioId })).data

export const desinscribirSocio = async (disciplinaId: number, socioId: number): Promise<DisciplinaApi> =>
  (await axiosInstance.delete(`${API}/${disciplinaId}/inscripciones/${socioId}`)).data

/** Saca a los inscriptos dados de baja o sin membresía vigente. Devuelve cuántos. */
export const liberarCupos = async (disciplinaId: number): Promise<number> =>
  (await axiosInstance.post(`${API}/${disciplinaId}/liberar-cupos`)).data.liberados

export const listarInstructores = async (): Promise<Instructor[]> =>
  (await axiosInstance.get(`${API}/instructores`)).data

export const clasesDeHoy = async (): Promise<ClaseHoy[]> =>
  (await axiosInstance.get(`${API}/hoy`)).data

export const disciplinasDelSocio = async (socioId: number): Promise<DisciplinaApi[]> =>
  (await axiosInstance.get(`${API}/socio/${socioId}`)).data
