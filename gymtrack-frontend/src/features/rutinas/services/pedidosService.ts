import axiosInstance from '../../../shared/services/axiosInstance'
import type { Ejercicio, Rutina } from '../types/Rutina'

/** Pedido de rutina personalizada que hace un socio desde su app */
export interface PedidoRutina {
  id: number
  socioId: number
  socio: string
  telefono: string | null
  objetivo: string | null
  diasSemana: number | null
  mensaje: string | null
  estado: 'PENDIENTE' | 'EN_CURSO' | 'HECHA' | 'DESCARTADA' | 'CANCELADA'
  creada: string
  tomadaPor: string | null
  resuelta: string | null
  resueltaPor: string | null
  rutinaId: number | null
  rutinaNombre: string | null
  motivo: string | null
  rutinaActualId: number | null
  rutinaActualNombre: string | null
}

export const pedidoAbierto = (p: PedidoRutina | null) => !!p && (p.estado === 'PENDIENTE' || p.estado === 'EN_CURSO')

// ── Staff ──
const STAFF = '/api/v1/pedidos-rutina'
export const bandejaPedidos = async () =>
  (await axiosInstance.get<{ abiertos: PedidoRutina[]; resueltos: PedidoRutina[] }>(STAFF)).data
export const cantidadPedidos = async () => (await axiosInstance.get<{ abiertos: number }>(`${STAFF}/cantidad`)).data.abiertos
export const tomarPedido = async (id: number) => (await axiosInstance.patch<PedidoRutina>(`${STAFF}/${id}/tomar`)).data
export const pedidoHecho = async (id: number) => (await axiosInstance.patch<PedidoRutina>(`${STAFF}/${id}/hecho`)).data
export const descartarPedido = async (id: number, motivo: string) =>
  (await axiosInstance.patch<PedidoRutina>(`${STAFF}/${id}/descartar`, { motivo })).data
export const cambiarVisibilidadPlantilla = async (id: number, visible: boolean) =>
  (await axiosInstance.patch<Rutina>(`/api/v1/rutinas/${id}/visible`, { visible })).data

// ── Socio ──
const SOCIO = '/api/v1/socio-app/rutinas'
export const plantillasParaSocio = async () => (await axiosInstance.get<Rutina[]>(`${SOCIO}/plantillas`)).data
export const ejerciciosDePlantilla = async (id: number) => (await axiosInstance.get<Ejercicio[]>(`${SOCIO}/plantillas/${id}/ejercicios`)).data
export const elegirPlantilla = async (id: number) => (await axiosInstance.post<Rutina>(`${SOCIO}/plantillas/${id}/elegir`)).data
export const miPedido = async (): Promise<PedidoRutina | null> => {
  const r = await axiosInstance.get<PedidoRutina>(`${SOCIO}/pedido`)
  return r.status === 204 ? null : r.data
}
export const pedirRutina = async (datos: { objetivo: string | null; diasSemana: number | null; mensaje: string | null }) =>
  (await axiosInstance.post<PedidoRutina>(`${SOCIO}/pedido`, datos)).data
export const cancelarPedido = async () => { await axiosInstance.delete(`${SOCIO}/pedido`) }
