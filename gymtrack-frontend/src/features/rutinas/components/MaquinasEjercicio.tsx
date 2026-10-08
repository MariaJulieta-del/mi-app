import type { MaquinaDeEjercicio } from '../types/Rutina'

/** Máquinas de un ejercicio con su número bien visible, para que el socio sepa a cuál ir */
export default function MaquinasEjercicio({ maquinas, grande = false }: { maquinas?: MaquinaDeEjercicio[]; grande?: boolean }) {
  if (!maquinas || maquinas.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {maquinas.map(m => (
        <span key={m.id} className={`gt-maquina-chip${grande ? ' grande' : ''}${m.sugerida ? ' sugerida' : ''}`}
          title={m.sugerida ? 'Máquina sugerida por el nombre del ejercicio' : undefined}>
          <span className="gt-maquina-chip-nro">{m.nroMaquina ? `N° ${m.nroMaquina}` : '⚙'}</span>
          {m.nombre}
        </span>
      ))}
    </div>
  )
}
