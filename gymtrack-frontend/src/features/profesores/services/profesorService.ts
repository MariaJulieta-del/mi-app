import axiosInstance from '../../../shared/services/axiosInstance'

export interface Profesor {
  id: number
  username: string
  email?: string
  nombre?: string
  apellido?: string
  telefono?: string
  especialidad?: string
  activo: boolean
}

export interface ProfesorInput {
  username: string
  password: string
  email?: string
  nombre?: string
  apellido?: string
  telefono?: string
  especialidad?: string
}

const BASE = '/api/v1/profesores'

export const listarProfesores = async (): Promise<Profesor[]> => {
  const r = await axiosInstance.get(BASE)
  return r.data
}

export const crearProfesor = async (data: ProfesorInput): Promise<void> => {
  await axiosInstance.post(BASE, data)
}

export const editarProfesor = async (id: number, data: Partial<ProfesorInput>): Promise<void> => {
  await axiosInstance.put(`${BASE}/${id}`, data)
}

export const toggleProfesor = async (id: number): Promise<{ activo: boolean }> => {
  const r = await axiosInstance.patch(`${BASE}/${id}/toggle`)
  return r.data
}

export const eliminarProfesor = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${BASE}/${id}`)
}
