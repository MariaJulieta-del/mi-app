import axiosInstance from '../../../shared/services/axiosInstance'
const API = '/api/v1/disciplinas'

/** Lo que se envía al crear o editar una disciplina */
export interface DisciplinaRequest {
 nombre: string
 descripcion?: string
 instructor?: string
 horario?: string
 cupoMaximo: number | null
 activa: boolean
 diasSemana: string[]
 horaInicio?: string
 horaFin?: string
}

/** Disciplina como la devuelve el backend */
export interface DisciplinaApi extends DisciplinaRequest {
 id: number
 totalInscritos?: number
 cuposDisponibles?: number | null
 sociosInscritos?: string[]
}

export const listarDisciplinas = async (soloActivas = true): Promise<DisciplinaApi[]> => {
 const res = await axiosInstance.get(API, { params: { soloActivas } })
 return res.data
}
export const crearDisciplina = async (data: DisciplinaRequest) => {
 const res = await axiosInstance.post(API, data)
 return res.data
}
export const actualizarDisciplina = async (id: number, data: DisciplinaRequest) => {
 const res = await axiosInstance.put(`${API}/${id}`, data)
 return res.data
}
export const desactivarDisciplina = async (id: number) => {
 await axiosInstance.delete(`${API}/${id}`)
}
export const renovarMesDisciplina = async (id: number) => {
 await axiosInstance.post(`${API}/${id}/renovar-mes`)
}
