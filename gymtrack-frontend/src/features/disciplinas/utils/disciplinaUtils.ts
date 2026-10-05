import type { Horario } from '../services/disciplinaService'

export const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'] as const
export const DIAS_CORTO: Record<string, string> = {
  LUNES: 'Lun', MARTES: 'Mar', 'MIÉRCOLES': 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', 'SÁBADO': 'Sáb', DOMINGO: 'Dom',
}
export const DIAS_LARGO: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', 'MIÉRCOLES': 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', 'SÁBADO': 'Sábado', DOMINGO: 'Domingo',
}

/** Día de hoy en el formato de los horarios */
export const diaDeHoy = (): string => DIAS[(new Date().getDay() + 6) % 7]

/**
 * Paleta de 8 colores (validada para daltonismo, con su versión para modo oscuro en index.css).
 * El color siempre va acompañado del nombre de la disciplina: nunca identifica solo.
 */
export const COLORES = [
  { n: 1, nombre: 'Azul' }, { n: 2, nombre: 'Naranja' }, { n: 3, nombre: 'Turquesa' }, { n: 4, nombre: 'Amarillo' },
  { n: 5, nombre: 'Rosa' }, { n: 6, nombre: 'Verde' }, { n: 7, nombre: 'Violeta' }, { n: 8, nombre: 'Rojo' },
] as const

export const colorDisciplina = (n: number | null | undefined) => `var(--disc-${n && n >= 1 && n <= 8 ? n : 1})`

export const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/**
 * Agrupa los horarios con la misma franja: "Lun, Mié y Vie · 18:00–19:00".
 * Devuelve una línea por franja distinta.
 */
export function resumenHorarios(horarios: Horario[]): string[] {
  const grupos = new Map<string, string[]>()
  for (const h of horarios) {
    const clave = `${h.horaInicio}–${h.horaFin}`
    grupos.set(clave, [...(grupos.get(clave) ?? []), h.dia])
  }
  return [...grupos.entries()]
    .sort((a, b) => minutos(a[0]) - minutos(b[0]))
    .map(([franja, dias]) => {
      const nombres = DIAS.filter(d => dias.includes(d)).map(d => DIAS_CORTO[d])
      const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0]
      return `${lista} · ${franja}`
    })
}

/** Franjas para el formulario: días con el mismo horario juntos */
export interface Franja { dias: string[]; horaInicio: string; horaFin: string }

export function aFranjas(horarios: Horario[]): Franja[] {
  const grupos = new Map<string, Franja>()
  for (const h of horarios) {
    const clave = `${h.horaInicio}|${h.horaFin}`
    const f = grupos.get(clave) ?? { dias: [], horaInicio: h.horaInicio, horaFin: h.horaFin }
    f.dias.push(h.dia)
    grupos.set(clave, f)
  }
  return [...grupos.values()].sort((a, b) => minutos(a.horaInicio) - minutos(b.horaInicio))
}

export function deFranjas(franjas: Franja[]): Horario[] {
  return franjas.flatMap(f => f.dias.map(dia => ({ dia, horaInicio: f.horaInicio, horaFin: f.horaFin })))
}

/** Texto del cupo: "12 / 20", "Completa" o "12 inscriptos" */
export function textoCupo(total: number, cupo: number | null): string {
  if (cupo == null) return `${total} ${total === 1 ? 'inscripto' : 'inscriptos'}`
  return `${total} / ${cupo}`
}
