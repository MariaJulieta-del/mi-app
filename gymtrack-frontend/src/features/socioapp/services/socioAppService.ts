import axiosInstance from '../../../shared/services/axiosInstance'
import { Dumbbell, Feather, Flame, ThumbsUp, type LucideIcon } from 'lucide-react'

// ── Clases y reservas ──────────────────────────────────────────────────────

/** Estado del socio en una clase: lugar fijo, liberado, reserva confirmada, en espera o nada */
export type MiEstadoClase = 'FIJO' | 'LIBERADA' | 'ASISTIO' | 'AUSENTE' | 'CONFIRMADA' | 'ESPERA' | null

export interface ClaseAgenda {
  disciplinaId: number
  nombre: string
  color: number | null
  descripcion: string | null
  instructor: string | null
  fecha: string
  dia: string
  horaInicio: string
  horaFin: string
  cupo: number | null
  ocupados: number
  disponibles: number | null
  enEspera: number
  estadoClase: 'PROXIMA' | 'EN_CURSO' | 'PASADA'
  fijo: boolean
  miEstado: MiEstadoClase
  miPosicion: number | null
}

export interface ResultadoReserva { estado: string; posicion: number | null; mensaje: string }

const claseBody = (c: ClaseAgenda) => ({ disciplinaId: String(c.disciplinaId), fecha: c.fecha, hora: c.horaInicio })

export const agendaClases = async (): Promise<ClaseAgenda[]> => (await axiosInstance.get('/api/v1/reservas/agenda')).data
export const misClases = async (): Promise<ClaseAgenda[]> => (await axiosInstance.get('/api/v1/reservas/mias')).data
export const reservarClase = async (c: ClaseAgenda): Promise<ResultadoReserva> => (await axiosInstance.post('/api/v1/reservas', claseBody(c))).data
export const cancelarClase = async (c: ClaseAgenda): Promise<ResultadoReserva> => (await axiosInstance.post('/api/v1/reservas/cancelar', claseBody(c))).data
export const anotarseFijo = async (disciplinaId: number) => (await axiosInstance.post(`/api/v1/reservas/disciplinas/${disciplinaId}/fijo`)).data
export const salirFijo = async (disciplinaId: number) => (await axiosInstance.delete(`/api/v1/reservas/disciplinas/${disciplinaId}/fijo`)).data

// ── Logros ─────────────────────────────────────────────────────────────────

export interface Insignia { codigo: string; titulo: string; descripcion: string; icono: string; obtenida: boolean; progreso: number; meta: number }
export interface Desafio { titulo: string; meta: number; actual: number; diasRestantes: number; completado: boolean }
export interface Logros {
  diasEntrenados: number
  rachaActual: number
  mejorRacha: number
  records: number
  insignias: Insignia[]
  desafio: Desafio
  desafiosGanados: number
  rankingVisible: boolean
}
export interface Puesto { posicion: number; socioId: number; nombre: string; dias: number; esVos: boolean }
export interface Ranking { mes: string; top: Puesto[]; tuPuesto: Puesto | null; participantes: number }

export const obtenerLogros = async (socioId: number): Promise<Logros> => (await axiosInstance.get(`/api/v1/gamificacion/socio/${socioId}`)).data
export const obtenerRanking = async (): Promise<Ranking> => (await axiosInstance.get('/api/v1/gamificacion/ranking')).data
export const participarRanking = async (participa: boolean): Promise<boolean> =>
  (await axiosInstance.put('/api/v1/gamificacion/ranking', { participa })).data.participa

// ── Récords y entrenamientos ───────────────────────────────────────────────

export interface RecordPersonal { ejercicio: string; pesoMax: number | null; fechaPeso: string | null; e1rm: number | null; fechaE1rm: string | null; repsMax: number | null }
export const obtenerRecords = async (socioId: number, hastaAyer = false): Promise<RecordPersonal[]> =>
  (await axiosInstance.get(`/api/v1/progreso/socio/${socioId}/records`, { params: { hastaAyer } })).data

export type Sensacion = 'MUY_FACIL' | 'BIEN' | 'DURO' | 'MUY_DURO'
export interface Sesion {
  id: number; socioId: number; socioNombre: string; telefono: string | null; rutinaId: number | null; rutinaNombre: string | null
  dia: number | null; fecha: string; duracionMin: number | null; series: number | null; volumenKg: number | null
  records: number; sensacion: Sensacion | null; comentario: string | null; leida: boolean; creada: string
}
export interface SesionNueva {
  socioId?: number | null; rutinaId: number; dia: number; duracionMin: number; series: number; volumenKg: number
  records: number; sensacion?: Sensacion | null; comentario?: string
}
export const registrarSesion = async (s: SesionNueva): Promise<Sesion> => (await axiosInstance.post('/api/v1/sesiones', s)).data
export const sesionesDelSocio = async (socioId: number): Promise<Sesion[]> => (await axiosInstance.get(`/api/v1/sesiones/socio/${socioId}`)).data

export const SENSACIONES: { valor: Sensacion; icono: LucideIcon; texto: string }[] = [
  { valor: 'MUY_FACIL', icono: Feather, texto: 'Muy fácil' },
  { valor: 'BIEN', icono: ThumbsUp, texto: 'Bien' },
  { valor: 'DURO', icono: Dumbbell, texto: 'Duro' },
  { valor: 'MUY_DURO', icono: Flame, texto: 'Al límite' },
]

/** 1RM estimado (Epley) */
export const unoRM = (kg: number, reps: number) => Math.round(kg * (1 + Math.max(1, reps) / 30) * 10) / 10
