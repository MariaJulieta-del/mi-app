import { useEffect, useMemo, useState } from 'react'
import { CircleCheck, Dumbbell, Pencil, Plus, Power, Wrench, X } from 'lucide-react'
import Modal from '../../../shared/components/Modal'
import { Pill } from '../../../shared/components/ui'
import { formatFecha } from '../../../shared/utils/fechas'
import { actualizarEjercicio, type Ejercicio } from '../../ejercicios/services/ejercicioService'
import { resolverImagenEjercicio } from '../../ejercicios/assets/imagenesEjercicios'
import { estadisticasMaquina } from '../services/mantenimientoService'
import type { Maquina } from '../types/Maquina'
import type { Mantenimiento, MaquinaEstadisticas } from '../types/Mantenimiento'
import { ESTADO_MAQUINA, type EstadoMaquina } from '../utils/estadoMaquina'
import NroMaquina from './NroMaquina'

const UMBRAL_REPARACIONES = 5
const UMBRAL_COSTO = 50000
const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`

/** Ficha de la máquina: estado, ejercicios que se hacen en ella, cómo se usa e historial de arreglos */
export default function MaquinaDetalleModal({ maquina: m, estado, mantenimientos, ejercicios, onCerrar, onEditar, onReportar, onToggleActiva, onMarcarRealizado, onCambioEjercicios }: {
  maquina: Maquina
  estado: EstadoMaquina
  /** Todos los registros de esta máquina */
  mantenimientos: Mantenimiento[]
  /** Todos los ejercicios del gimnasio (para asociar) */
  ejercicios: Ejercicio[]
  onCerrar: () => void
  onEditar: () => void
  onReportar: () => void
  onToggleActiva: () => void
  onMarcarRealizado: (r: Mantenimiento) => void
  onCambioEjercicios: () => Promise<unknown>
}) {
  const [stats, setStats] = useState<MaquinaEstadisticas | null>(null)
  const [busca, setBusca] = useState('')
  const [guardando, setGuardando] = useState<number | null>(null)
  const e = ESTADO_MAQUINA[estado]

  // Se recalcula cuando cambia algún registro (por ejemplo, una falla que pasa a arreglada)
  const firma = mantenimientos.map(r => `${r.id}:${r.tipo}:${r.costo ?? ''}`).join(',')
  useEffect(() => { estadisticasMaquina(m.id!).then(setStats).catch(() => setStats(null)) }, [m.id, firma])

  const asociados = useMemo(() => ejercicios.filter(x => x.activo !== false && (x.maquinaIds ?? []).includes(m.id!)), [ejercicios, m.id])
  const candidatos = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return []
    return ejercicios
      .filter(x => x.activo !== false && !(x.maquinaIds ?? []).includes(m.id!) && x.nombre.toLowerCase().includes(q))
      .slice(0, 6)
  }, [ejercicios, busca, m.id])

  const cambiar = async (ej: Ejercicio, asociar: boolean) => {
    setGuardando(ej.id!)
    try {
      const ids = ej.maquinaIds ?? []
      await actualizarEjercicio(ej.id!, { ...ej, maquinaIds: asociar ? [...ids, m.id!] : ids.filter(i => i !== m.id) })
      await onCambioEjercicios()
      setBusca('')
    } finally { setGuardando(null) }
  }

  const pendientes = mantenimientos.filter(r => r.tipo === 'PENDIENTE')
  const historial = mantenimientos.filter(r => r.tipo === 'REALIZADO').slice(0, 5)
  const conviene = stats && (stats.totalReparaciones >= UMBRAL_REPARACIONES || Number(stats.costoTotal) >= UMBRAL_COSTO)

  return (
    <Modal ancho={680} onCerrar={onCerrar}
      titulo={
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NroMaquina nro={m.nroMaquina} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block' }}>{m.nombre}</span>
            <Pill tono={e.tono} icono={e.icono}>{e.texto}</Pill>
          </span>
        </span>
      }
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onToggleActiva} style={{ marginRight: 'auto' }}>
          <Power size={15} aria-hidden /> {m.activa ? 'Dar de baja' : 'Reactivar'}
        </button>
        {m.activa && <button type="button" className="gt-btn gt-btn-secondary" onClick={onReportar}><Wrench size={15} aria-hidden /> Reportar</button>}
        <button type="button" className="gt-btn gt-btn-primary" onClick={onEditar}><Pencil size={15} aria-hidden /> Editar</button>
      </>}>

      {/* Fallas abiertas */}
      {pendientes.length > 0 && (
        <section className="gt-maq-seccion">
          <h3 className="gt-subtitulo">Pendiente de arreglo</h3>
          {pendientes.map(r => (
            <div key={r.id} className={`gt-maq-pendiente${r.categoria === 'PREVENTIVO' ? ' revision' : ''}`}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{r.categoria === 'PREVENTIVO' ? 'Revisión' : 'Falla'}</strong> · {r.descripcion}
                <div className="gt-text-sm gt-text-muted">Reportado el {formatFecha(r.fechaMantenimiento ?? r.fechaCreacion)}</div>
              </div>
              <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => onMarcarRealizado(r)}>
                <CircleCheck size={14} aria-hidden /> Arreglada
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Ejercicios asociados */}
      <section className="gt-maq-seccion">
        <h3 className="gt-subtitulo">Ejercicios que se hacen acá ({asociados.length})</h3>
        {asociados.length === 0 && (
          <p className="gt-text-sm gt-text-muted" style={{ margin: '0 0 8px' }}>
            Ninguno todavía. Asociá ejercicios para que el socio vea esta máquina en su rutina.
          </p>
        )}
        <div className="gt-maq-ejercicios">
          {asociados.map(x => {
            const img = x.imagenUrl || resolverImagenEjercicio(x.nombre)
            return (
              <span key={x.id} className="gt-maq-ejercicio">
                {img ? <img src={img} alt="" loading="lazy" /> : <Dumbbell size={16} aria-hidden />}
                {x.nombre}
                <button type="button" aria-label={`Quitar ${x.nombre}`} title="Quitar de esta máquina"
                  disabled={guardando === x.id} onClick={() => cambiar(x, false)}><X size={14} /></button>
              </span>
            )
          })}
        </div>
        <div className="gt-maq-asociar">
          <Plus size={16} aria-hidden />
          <input className="gt-input" placeholder="Asociar ejercicio… (escribí el nombre)" value={busca}
            onChange={ev => setBusca(ev.target.value)} aria-label="Buscar ejercicio para asociar" />
          {candidatos.length > 0 && (
            <div className="gt-maq-asociar-lista" role="listbox">
              {candidatos.map(x => (
                <button key={x.id} type="button" role="option" aria-selected={false} disabled={guardando === x.id} onClick={() => cambiar(x, true)}>
                  {x.nombre}
                  {(x.grupos ?? []).length > 0 && <span className="gt-text-muted"> · {(x.grupos ?? []).join(', ')}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Uso */}
      {(m.descripcion || m.instruccionesUso || m.ajustes) && (
        <section className="gt-maq-seccion">
          {m.descripcion && <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>{m.descripcion}</p>}
          <div className="gt-maq-form-fila dos">
            {m.instruccionesUso && <div><h3 className="gt-subtitulo">Cómo se usa</h3><p className="gt-text-sm" style={{ margin: 0, whiteSpace: 'pre-line' }}>{m.instruccionesUso}</p></div>}
            {m.ajustes && <div><h3 className="gt-subtitulo">Ajustes</h3><p className="gt-text-sm" style={{ margin: 0, whiteSpace: 'pre-line' }}>{m.ajustes}</p></div>}
          </div>
        </section>
      )}

      {/* Historial */}
      <section className="gt-maq-seccion" style={{ marginBottom: 0 }}>
        <h3 className="gt-subtitulo">Historial de arreglos</h3>
        {stats && stats.totalReparaciones > 0 ? (
          <>
            <div className="gt-maq-stats">
              <div><strong>{stats.totalReparaciones}</strong><span>arreglos</span></div>
              <div><strong>{pesos(Number(stats.costoTotal))}</strong><span>gastado</span></div>
              <div><strong>{stats.diasInactividadTotal}</strong><span>días parada</span></div>
            </div>
            {conviene && (
              <div className="gt-alert gt-alert-warning" style={{ marginTop: 10 }}>
                Lleva {stats.totalReparaciones} arreglos y {pesos(Number(stats.costoTotal))} gastados: puede convenir reemplazarla.
              </div>
            )}
            <ul className="gt-maq-historial">
              {historial.map(r => (
                <li key={r.id}>
                  <span className="gt-text-muted">{formatFecha(r.fechaMantenimiento ?? r.fechaCreacion)}</span>
                  <span style={{ flex: 1 }}>{r.descripcion}</span>
                  {r.costo != null && r.costo > 0 && <strong>{pesos(Number(r.costo))}</strong>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="gt-text-sm gt-text-muted" style={{ margin: 0 }}>Sin arreglos registrados.</p>
        )}
      </section>
    </Modal>
  )
}
