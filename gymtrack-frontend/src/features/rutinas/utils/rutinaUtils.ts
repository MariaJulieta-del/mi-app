import type { Rutina } from '../types/Rutina'
import { Dumbbell, Flame, Footprints, HeartPulse, Repeat, Sprout, Weight, Zap, type LucideIcon } from 'lucide-react'

/**
 * Convención única de días:
 *   un ejercicio con `dia = N` pertenece al N-ésimo día de `diasSemana`
 *   ORDENADO de lunes a domingo. Si la rutina no tiene días de semana, es "Día N".
 */
export const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function ordenarDias(dias: string[] | undefined | null): string[] {
  return DIAS_ORDER.filter(d => (dias ?? []).includes(d))
}

/** "Día 1 · Lunes" o "Día 1" si la rutina no tiene días de semana */
export function etiquetaDia(diasSemana: string[] | undefined | null, n: number): string {
  const nombre = ordenarDias(diasSemana)[n - 1]
  return nombre ? `Día ${n} · ${nombre}` : `Día ${n}`
}

export const TREN_CONFIG: Record<string, { label: string; icono: LucideIcon; bg: string; color: string }> = {
  SUPERIOR:  { label: 'Tren Superior',  icono: Dumbbell, bg: 'var(--blue-bg)',   color: 'var(--blue-text)' },
  INFERIOR:  { label: 'Tren Inferior',  icono: Footprints, bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  CORE:      { label: 'Core / Abdomen', icono: Flame, bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
  CARDIO:    { label: 'Cardio',         icono: HeartPulse, bg: 'var(--red-light)', color: 'var(--red-text)' },
  FULL_BODY: { label: 'Full Body',      icono: Zap, bg: 'var(--purple-bg)', color: 'var(--purple-text)' },
}
export const TREN_DEFAULT = { label: 'Sin especificar', icono: Dumbbell, bg: 'var(--bg-surface-2)', color: 'var(--text-muted)' }

export const DIFICULTAD_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  BAJA:  { label: 'Baja',  bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  MEDIA: { label: 'Media', bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
  ALTA:  { label: 'Alta',  bg: 'var(--red-light)', color: 'var(--red-text)' },
}

/** Esquema de trabajo sugerido para cada ejercicio */
export interface Esquema { series: number; reps: number; descanso: number }

/**
 * Cómo progresa cada objetivo cuando el socio completó todas las series:
 *  - 'carga': subir el peso (fuerza / hipertrofia)
 *  - 'reps':  sumar repeticiones con el mismo peso (resistencia, pérdida de grasa, salud)
 */
export type Progresion = 'carga' | 'reps'

export const OBJETIVO_CONFIG: Record<string, {
  label: string; icono: LucideIcon; desc: string; esquema: Esquema; progresion: Progresion; bg: string; color: string
}> = {
  FUERZA:        { label: 'Fuerza',           icono: Weight, desc: 'Pocas repeticiones con mucha carga y descansos largos.',      esquema: { series: 5, reps: 5,  descanso: 150 }, progresion: 'carga', bg: 'var(--red-light)',   color: 'var(--red-text)' },
  HIPERTROFIA:   { label: 'Hipertrofia',      icono: Dumbbell, desc: 'Ganar masa muscular: volumen medio y descansos moderados.',   esquema: { series: 4, reps: 10, descanso: 90 },  progresion: 'carga', bg: 'var(--purple-bg)',  color: 'var(--purple-text)' },
  RESISTENCIA:   { label: 'Resistencia',      icono: Repeat, desc: 'Muchas repeticiones con carga liviana y poco descanso.',      esquema: { series: 3, reps: 15, descanso: 45 },  progresion: 'reps',  bg: 'var(--blue-bg)',    color: 'var(--blue-text)' },
  PERDIDA_GRASA: { label: 'Pérdida de grasa', icono: Flame, desc: 'Circuitos dinámicos para gastar más energía.',                esquema: { series: 3, reps: 12, descanso: 30 },  progresion: 'reps',  bg: 'var(--yellow-bg)',  color: 'var(--yellow-text)' },
  SALUD:         { label: 'Salud / inicio',   icono: Sprout, desc: 'Técnica, movilidad y acondicionamiento general para empezar.', esquema: { series: 3, reps: 12, descanso: 60 },  progresion: 'reps',  bg: 'var(--green-bg)',   color: 'var(--green-text)' },
}

/** Nivel de la ficha médica → dificultad de plantilla recomendada */
export const NIVEL_A_DIFICULTAD: Record<string, string> = {
  PRINCIPIANTE: 'BAJA', INTERMEDIO: 'MEDIA', AVANZADO: 'ALTA',
}

export const esPlantilla = (r: Pick<Rutina, 'socioId'>) => r.socioId === null || r.socioId === undefined

/** Link al detalle de una rutina con el contexto correcto */
export function linkRutina(r: Pick<Rutina, 'id' | 'socioId'>, esStaff: boolean): string {
  if (esPlantilla(r)) return `/rutinas/${r.id}?general=true`
  return esStaff ? `/rutinas/${r.id}?socioId=${r.socioId}` : `/rutinas/${r.id}`
}

export function linkEditarRutina(r: Pick<Rutina, 'id' | 'socioId'>, esStaff: boolean): string {
  if (esPlantilla(r)) return `/rutinas/editar/${r.id}?general=true`
  return esStaff ? `/rutinas/editar/${r.id}?socioId=${r.socioId}` : `/rutinas/editar/${r.id}`
}
