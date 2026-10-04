import axiosInstance from '../../../shared/services/axiosInstance'

const API = '/api/v1/seguimiento'

export interface SocioHoy {
  socioId: number
  nombre: string
  hora: string
  alertaMedica: string | null
  rutina: { id: number; nombre: string; semanas: number } | null
  diasParaVencer: number | null
}

export interface SocioARenovar {
  socioId: number
  nombre: string
  motivo: 'SIN_RUTINA' | 'RUTINA_VIEJA'
  semanas: number | null
  ultimaVisita: string
}

export interface Hoy {
  ingresosHoy: number
  denegadosHoy: number
  entrenando: SocioHoy[]
  renovarRutina: SocioARenovar[]
  semanasRenovar: number
}

export interface RegistroProgreso { fecha: string; pesoKg: number | null; repeticiones: number | null; series: number | null }

export interface EjercicioProgreso {
  ejercicio: string
  registros: RegistroProgreso[]
  pesoInicial: number | null
  pesoActual: number | null
  pesoMaximo: number | null
  ultimaVez: string | null
}

export interface Progreso {
  socioId: number
  ejercicios: EjercicioProgreso[]
  semanas: { inicio: string; dias: number }[]
  rachaSemanas: number
  diasEsteMes: number
  sesionesRegistradas: number
}

export const obtenerHoy = async (): Promise<Hoy> => (await axiosInstance.get(`${API}/hoy`)).data

export const obtenerProgreso = async (socioId: number): Promise<Progreso> =>
  (await axiosInstance.get(`${API}/socio/${socioId}/progreso`)).data
