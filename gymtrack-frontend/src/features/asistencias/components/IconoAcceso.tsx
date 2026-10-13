import { SEMAFORO, type Semaforo } from '../utils/semaforo'

/** Ícono del resultado de un ingreso (verde, amarillo o rojo) */
export default function IconoAcceso({ estado, size }: { estado: Semaforo; size: number }) {
  const Icono = SEMAFORO[estado].icono
  return <Icono size={size} aria-hidden />
}
