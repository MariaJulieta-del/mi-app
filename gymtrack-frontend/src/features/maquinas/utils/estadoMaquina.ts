import { CircleCheck, CircleAlert, Wrench, CirclePause, type LucideIcon } from 'lucide-react'
import type { Maquina } from '../types/Maquina'
import type { Mantenimiento } from '../types/Mantenimiento'
import type { Tono } from '../../../shared/components/ui'

export type EstadoMaquina = 'operativa' | 'falla' | 'revision' | 'inactiva'

export const ESTADO_MAQUINA: Record<EstadoMaquina, { texto: string; tono: Tono; icono: LucideIcon }> = {
  operativa: { texto: 'Operativa', tono: 'ok', icono: CircleCheck },
  falla: { texto: 'Con falla', tono: 'danger', icono: CircleAlert },
  revision: { texto: 'Revisión pendiente', tono: 'warn', icono: Wrench },
  inactiva: { texto: 'Dada de baja', tono: 'neutral', icono: CirclePause },
}

/** Pendientes de mantenimiento agrupados por máquina */
export function pendientesPorMaquina(mantenimientos: Mantenimiento[]): Map<number, Mantenimiento[]> {
  const mapa = new Map<number, Mantenimiento[]>()
  for (const m of mantenimientos) {
    if (m.tipo !== 'PENDIENTE') continue
    mapa.set(m.maquinaId, [...(mapa.get(m.maquinaId) ?? []), m])
  }
  return mapa
}

/** Una falla (correctivo pendiente) pesa más que una revisión preventiva */
export function estadoMaquina(m: Maquina, pendientes: Mantenimiento[] | undefined): EstadoMaquina {
  if (!m.activa) return 'inactiva'
  if (!pendientes || pendientes.length === 0) return 'operativa'
  return pendientes.some(p => p.categoria !== 'PREVENTIVO') ? 'falla' : 'revision'
}
