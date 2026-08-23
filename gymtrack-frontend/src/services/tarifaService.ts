import axiosInstance from './axiosInstance'
import type { Tarifa, TarifaCreateDTO } from '../types/Tarifa'
const API = '/api/v1/tarifas'
export const listarTarifas = async (): Promise<Tarifa[]> => {
 const res = await axiosInstance.get(API)
 return res.data
}
export const crearTarifa = async (data: TarifaCreateDTO): Promise<Tarifa> => {
 const res = await axiosInstance.post(API, data)
 return res.data
}
export const actualizarTarifa = async (tipo: string, precio: number): Promise<Tarifa> => {
 const res = await axiosInstance.put(`${API}/${tipo}`, { precio })
 return res.data
}
