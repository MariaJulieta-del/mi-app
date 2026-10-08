import { Dumbbell, Pencil, Wrench } from 'lucide-react'
import type { Maquina } from '../types/Maquina'
import { IconButton, Pill } from '../../../shared/components/ui'
import { ESTADO_MAQUINA, type EstadoMaquina } from '../utils/estadoMaquina'
import NroMaquina from './NroMaquina'

/** Tarjeta de una máquina: número, nombre, estado y cuántos ejercicios se hacen en ella */
export default function MaquinaCard({ maquina: m, estado, cantidadEjercicios, onAbrir, onEditar, onReportar }: {
  maquina: Maquina
  estado: EstadoMaquina
  cantidadEjercicios: number
  onAbrir: () => void
  onEditar: () => void
  onReportar: () => void
}) {
  const e = ESTADO_MAQUINA[estado]
  return (
    <article className={`gt-maq-card ${estado}`}>
      <button type="button" className="gt-maq-card-main" onClick={onAbrir} aria-label={`Ver ${m.nombre}`}>
        <NroMaquina nro={m.nroMaquina} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="gt-maq-nombre">{m.nombre}</span>
          {(m.grupos ?? []).length > 0 && (
            <span className="gt-grupos" style={{ marginTop: 6 }}>
              {(m.grupos ?? []).slice(0, 3).map(g => <span key={g} className="gt-grupo">{g}</span>)}
              {(m.grupos ?? []).length > 3 && <span className="gt-grupo">+{(m.grupos ?? []).length - 3}</span>}
            </span>
          )}
        </span>
      </button>
      <div className="gt-maq-pie">
        <Pill tono={e.tono} icono={e.icono}>{e.texto}</Pill>
        <span className={`gt-maq-ejs${cantidadEjercicios === 0 ? ' cero' : ''}`} title="Ejercicios asociados a esta máquina">
          <Dumbbell size={13} aria-hidden /> {cantidadEjercicios}
        </span>
        <span style={{ flex: 1 }} />
        {m.activa && <IconButton icono={Wrench} etiqueta={`Reportar falla en ${m.nombre}`} onClick={onReportar} />}
        <IconButton icono={Pencil} etiqueta={`Editar ${m.nombre}`} onClick={onEditar} />
      </div>
    </article>
  )
}
