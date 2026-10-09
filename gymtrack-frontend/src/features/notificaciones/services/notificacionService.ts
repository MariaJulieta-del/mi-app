import axiosInstance from '../../../shared/services/axiosInstance'

const API = '/api/v1/notificaciones'

export interface Notificacion {
  id: number; titulo: string; mensaje: string; tipo: string; destinatario: string
  socioId?: number | null; socioNombre?: string | null
  disciplinaId?: number | null; disciplinaNombre?: string | null
  fechaCreacion: string; activa: boolean
  porEmail: boolean; porWhatsapp: boolean
}

export interface NotificacionRequest {
  titulo: string
  mensaje: string
  tipo?: string
  destinatario?: string
  socioId?: number | null
  disciplinaId?: number | null
  /** Mandarlo también por mail (por defecto sí) */
  porEmail?: boolean
  /** Preparar los links de WhatsApp */
  porWhatsapp?: boolean
}

/** Qué canales están listos */
export interface Canales { email: boolean; remitente: string; socios: number; conEmail: number; conTelefono: number }

export interface Whatsapp {
  texto: string
  destinos: { socioId: number; nombre: string; telefono: string; link: string }[]
  sinTelefono: string[]
}

export const listarNotificaciones = async (): Promise<Notificacion[]> => (await axiosInstance.get(API)).data

export const crearNotificacion = async (data: NotificacionRequest): Promise<Notificacion> => (await axiosInstance.post(API, data)).data

export const archivarNotificacion = async (id: number) => {
  await axiosInstance.delete(`${API}/${id}`)
}

export const obtenerCanales = async (): Promise<Canales> => (await axiosInstance.get(`${API}/canales`)).data

export const linksWhatsapp = async (id: number): Promise<Whatsapp> => (await axiosInstance.get(`${API}/${id}/whatsapp`)).data
