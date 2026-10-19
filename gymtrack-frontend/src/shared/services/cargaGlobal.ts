/**
 * Cuántas cosas está esperando la app ahora mismo: pedidos al servidor y pantallas que todavía se
 * están descargando. Lo usa la barra de carga de arriba (BarraCarga).
 */
let enCurso = 0
const oyentes = new Set<() => void>()

export const avisarCarga = (delta: number) => {
  enCurso = Math.max(0, enCurso + delta)
  oyentes.forEach(f => f())
}

/** Para useSyncExternalStore */
export const cargasEnCurso = () => enCurso
export const escucharCargas = (f: () => void) => {
  oyentes.add(f)
  return () => { oyentes.delete(f) }
}

/** Envuelve el import de una pantalla (lazy) para que se vea la barra mientras se descarga */
export function conCarga<T>(importar: () => Promise<T>): () => Promise<T> {
  return () => {
    avisarCarga(1)
    return importar().finally(() => avisarCarga(-1))
  }
}
