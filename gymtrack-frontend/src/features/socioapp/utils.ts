import { DIAS_ORDER, ordenarDias } from '../rutinas/utils/rutinaUtils'
import type { Rutina } from '../rutinas/types/Rutina'
import type { MiEstadoClase } from './services/socioAppService'

/** Nombre del día de hoy como en las rutinas ("Lunes", "Martes"…) */
export const diaDeHoy = (): string => DIAS_ORDER[(new Date().getDay() + 6) % 7]

/** La rutina más nueva que tenga marcado el día de hoy, y qué número de día es dentro de ella */
export function rutinaDeHoy(rutinas: Rutina[]): { rutina: Rutina; dia: number } | null {
  const hoy = diaDeHoy()
  for (const r of rutinas) {
    const n = ordenarDias(r.diasSemana).indexOf(hoy) + 1
    if (n > 0) return { rutina: r, dia: n }
  }
  return null
}

/** Próximo día de entrenamiento según la rutina (para el día de descanso) */
export function proximoDia(r: Rutina): string | null {
  const dias = ordenarDias(r.diasSemana)
  if (dias.length === 0) return null
  const hoy = (new Date().getDay() + 6) % 7
  for (let i = 1; i <= 7; i++) {
    const d = DIAS_ORDER[(hoy + i) % 7]
    if (dias.includes(d)) return i === 1 ? 'mañana' : d.toLowerCase()
  }
  return null
}

export const saludo = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}

export const fechaLarga = (iso?: string) => {
  const f = iso ? new Date(iso + 'T00:00:00') : new Date()
  return mayuscula(f.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }))
}

const mayuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

/** "Hoy", "Mañana" o "mié 8/10" */
export function cuandoClase(fecha: string): string {
  const f = new Date(fecha + 'T00:00:00')
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((f.getTime() - hoy.getTime()) / 86400000)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  return mayuscula(f.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'numeric' }))
}

export const ESTADO_CLASE: Record<Exclude<MiEstadoClase, null>, { texto: string; tono: 'ok' | 'info' | 'warn' | 'neutral' }> = {
  FIJO: { texto: 'Tu lugar fijo', tono: 'ok' },
  CONFIRMADA: { texto: 'Reservada', tono: 'ok' },
  ESPERA: { texto: 'En espera', tono: 'warn' },
  LIBERADA: { texto: 'Avisaste que no vas', tono: 'neutral' },
}
