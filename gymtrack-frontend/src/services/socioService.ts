import axios from 'axios'
import type { Socio } from '../types/Socio' 

const API = 'http://localhost:8080/api/v1/socios'

export const obtenerTodos = async (): Promise<Socio[]> => {
  const res = await axios.get(API)
  return res.data
}

export const crearSocio = async (socio: Socio): Promise<Socio> => {
  const res = await axios.post(API, socio)
  return res.data
}

export const actualizarSocio = async (id: number, socio: Socio): Promise<Socio> => {
  const res = await axios.put(`${API}/${id}`, socio)
  return res.data
}

export const darDeBaja = async (id: number): Promise<void> => {
  await axios.delete(`${API}/${id}`)
} 