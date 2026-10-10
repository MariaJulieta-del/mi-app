import axiosInstance from '../../../shared/services/axiosInstance'
import type { Genero, Socio } from '../types/Socio'

const API = '/api/v1/socios'

export interface AltaSocioRequestDTO {
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  email?: string
  fechaNacimiento?: string
  genero?: Genero | ''
  tipoMembresia: string
  formaDePago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
}

export interface AltaSocioResponseDTO {
  socioId: number
  nombre: string
  apellido: string
  dni: string
  /** PIN para la app: viene solo en esta respuesta */
  pin?: string
  membresiaId: number
  tipoMembresia: string
  estadoMembresia: 'ACTIVA'
  fechaInicio: string
  fechaVencimiento: string
  precio: number
  pasesMensuales: number | null
  pagoId?: number
  metodoPago?: string
  montoPagado?: number
}

export const altaSocioCompleta = async (data: AltaSocioRequestDTO): Promise<AltaSocioResponseDTO> => {
  const res = await axiosInstance.post(`${API}/alta`, data)
  return res.data
}
export const obtenerTodos = async (): Promise<Socio[]> => {
 const res = await axiosInstance.get(API)
 return res.data
}
export const obtenerPorId = async (id: number): Promise<Socio> => {
 const res = await axiosInstance.get(`${API}/${id}`)
 return res.data
}
export const crearSocio = async (socio: Socio): Promise<Socio> => {
 const res = await axiosInstance.post(API, socio)
 return res.data
}
export const actualizarSocio = async (id: number, socio: Socio): Promise<Socio> => {
 const res = await axiosInstance.put(`${API}/${id}`, socio)
 return res.data
}
export const darDeBaja = async (id: number, motivo: string, detalle?: string): Promise<void> => {
 await axiosInstance.put(`${API}/${id}/baja`, { motivo, detalle })
}

/** Una baja registrada, con su motivo */
export interface BajaSocio {
 id: number
 socioId: number | null
 socioNombre: string
 /** true si el socio volvió después de esta baja */
 socioActivo: boolean
 fecha: string
 motivo: string
 detalle?: string | null
 registradoPor?: string | null
}
export const listarBajas = async (): Promise<BajaSocio[]> =>
 (await axiosInstance.get(`${API}/bajas`)).data
export const obtenerConInactivos = async (): Promise<Socio[]> => {
 const res = await axiosInstance.get(`${API}/todos`)
 return res.data
}
export const reactivarSocio = async (id: number): Promise<Socio> => {
 const res = await axiosInstance.put(`${API}/${id}/reactivar`)
 return res.data
}

/** Genera un PIN nuevo para el socio (se muestra una sola vez). Cierra sus sesiones anteriores. */
export const generarPin = async (socioId: number): Promise<string> =>
  (await axiosInstance.post(`${API}/${socioId}/pin`)).data.pin

export interface PinGenerado { socioId: number; nombre: string; dni: string; pin: string }
/** Genera PIN para todos los socios activos que no tienen (solo admin) */
export const generarPinesPendientes = async (): Promise<PinGenerado[]> =>
  (await axiosInstance.post('/api/v1/auth/pines-pendientes')).data

/** El socio cambia su PIN; devuelve una sesión nueva (las anteriores dejan de valer) */
export const cambiarMiPin = async (pinActual: string, pinNuevo: string) =>
  (await axiosInstance.post('/api/v1/auth/cambiar-pin', { pinActual, pinNuevo })).data

/** Una fila del listado de socios (con lo justo de su membresía y su baja) */
export interface SocioFila extends Socio {
  id: number
  estadoMembresia: 'ACTIVA' | 'VENCIDA' | 'CANCELADA' | 'PENDIENTE_PAGO' | null
  vencimiento: string | null
  motivoBaja: string | null
  fechaBaja: string | null
}
export interface PaginaSocios {
  items: SocioFila[]; total: number; pagina: number; paginas: number; tam: number
  conteos: { activos: number; inactivos: number; alDia: number; vencidas: number; sinMembresia: number }
}
export interface FiltrosSocios {
  q?: string; vista?: 'activos' | 'inactivos' | 'todos'; membresia?: '' | 'ACTIVA' | 'VENCIDA' | 'SIN_MEMBRESIA'
  orden?: 'apellido' | 'nombre' | 'vencimiento' | 'alta'; desc?: boolean; pagina?: number; tam?: number
}

/** Listado paginado: búsqueda, filtros y orden los hace el servidor */
export const buscarSocios = async (f: FiltrosSocios, signal?: AbortSignal): Promise<PaginaSocios> =>
  (await axiosInstance.get(`${API}/buscar`, { params: f, signal })).data
