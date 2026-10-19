import { useSyncExternalStore } from 'react'
import { cargasEnCurso, escucharCargas } from '../services/cargaGlobal'

/**
 * Barra fina arriba de todo mientras la app espera al servidor (cargar, guardar, borrar)
 * o mientras se descarga una pantalla que todavía no se abrió.
 * Aparece recién a los 300 ms (CSS), así los pedidos rápidos no la hacen parpadear.
 */
export default function BarraCarga() {
  const enCurso = useSyncExternalStore(escucharCargas, cargasEnCurso)
  if (enCurso === 0) return null
  return <div className="gt-barra-carga" role="progressbar" aria-label="Cargando" />
}
