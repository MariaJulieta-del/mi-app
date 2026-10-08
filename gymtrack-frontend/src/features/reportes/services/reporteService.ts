import axiosInstance from '../../../shared/services/axiosInstance'
const API = '/api/v1/reportes'
export const getDashboard = async () => {
 const res = await axiosInstance.get(`${API}/dashboard`)
 return res.data
}
export const getIngresos = async (meses = 6) => {
 const res = await axiosInstance.get(`${API}/ingresos`, { params: { meses } })
 return res.data
}
export const getAsistencias = async (desde: string, hasta: string) => {
 const res = await axiosInstance.get(`${API}/asistencias`, { params: { desde, hasta } })
 return res.data
}
export const getProximosAVencer = async (dias = 15) => {
 const res = await axiosInstance.get(`${API}/proximos-a-vencer`, { params: { dias } })
 return res.data
}
export const getMorosos = async () => {
 const res = await axiosInstance.get(`${API}/morosos`)
 return res.data
}
export const getSinAsistencias = async (dias = 14) => {
 const res = await axiosInstance.get(`${API}/sin-asistencias`, { params: { dias } })
 return res.data
}
export const getEdades = async () => {
 const res = await axiosInstance.get(`${API}/edades`)
 return res.data as { rango: string; cantidad: number }[]
}

export interface SocioEnRiesgo {
 socioId: number; nombre: string; telefono: string | null; ultimaVisita: string | null
 diasSinVenir: number | null; diasParaVencer: number; motivos: ('NUNCA_VINO' | 'NO_VIENE' | 'VENCE_SIN_VENIR')[]
}
export const getEnRiesgo = async (): Promise<SocioEnRiesgo[]> => (await axiosInstance.get(`${API}/en-riesgo`)).data

export interface Metricas {
 sociosVigentes: number; recaudadoMes: number; ingresoPromedioPorSocio: number
 meses: { mes: string; base: number; retenidos: number; porcentaje: number | null; nuevos: number; recaudado: number }[]
 ocupacion: number[][]; semanasOcupacion: number
}
export const getMetricas = async (): Promise<Metricas> => (await axiosInstance.get(`${API}/metricas`)).data

export interface GrupoPublico {
 clave: string; nombre: string; socios: number; porcentaje: number | null; edadPromedio: number | null
 visitas: number; visitasPorSemana: number | null; franjas: number[]; horaPico: string | null; horaPromedio: string | null
}
export interface Demografia {
 dias: number; sociosActivos: number; conEdad: number; conGenero: number; edadPromedio: number | null
 edadMinima: number | null; edadMaxima: number | null; nombresFranjas: string[]
 generos: GrupoPublico[]; edades: GrupoPublico[]
 franjas: { nombre: string; visitas: number; porcentaje: number | null; edadPromedio: number | null }[]
 visitas: number
}
export const getDemografia = async (dias = 60): Promise<Demografia> => (await axiosInstance.get(`${API}/demografia`, { params: { dias } })).data
