import { CalendarDays, CircleCheck, CircleDollarSign, Pencil, Trash2, User, Wrench } from 'lucide-react'
import { EmptyState, IconButton, Pill, Segmentado, Skeleton } from '../../../../shared/components/ui'
import { formatFecha } from '../../../../shared/utils/fechas'
import type { useMantenimientos } from '../../hooks/useMantenimientos'
import type { Maquina } from '../../types/Maquina'
import type { Mantenimiento, TipoMantenimiento } from '../../types/Mantenimiento'
import NroMaquina from '../NroMaquina'

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`

/** Registro de fallas y arreglos: primero lo pendiente */
export default function MantenimientoTab({ mant, maquinas, onEliminar }: {
  mant: ReturnType<typeof useMantenimientos>
  maquinas: Maquina[]
  onEliminar: (id: number) => void
}) {
  const cuenta = (t: TipoMantenimiento) => mant.mantenimientos.filter(m => m.tipo === t).length

  return (
    <>
      <div className="gt-toolbar-fila">
        <Segmentado etiqueta="Estado" valor={mant.mantFiltroTipo} onChange={mant.setMantFiltroTipo}
          opciones={[
            { valor: 'PENDIENTE', texto: 'Pendientes', cuenta: cuenta('PENDIENTE') },
            { valor: 'REALIZADO', texto: 'Hechos', cuenta: cuenta('REALIZADO') },
            { valor: 'todos', texto: 'Todos' },
          ]} />
        <select className="gt-select" value={mant.mantFiltroMaquina} aria-label="Máquina"
          onChange={e => mant.setMantFiltroMaquina(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}>
          <option value="todas">Todas las máquinas</option>
          {maquinas.filter(m => m.activa).map(m => <option key={m.id} value={m.id}>{m.nroMaquina ? `N° ${m.nroMaquina} · ` : ''}{m.nombre}</option>)}
        </select>
      </div>

      {mant.mantCargando ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1, 2].map(i => <Skeleton key={i} alto={84} radio={12} />)}
        </div>
      ) : mant.mantFiltrados.length === 0 ? (
        <div className="gt-card">
          {mant.mantFiltroTipo === 'PENDIENTE' && mant.mantFiltroMaquina === 'todas'
            ? <EmptyState icono={CircleCheck} titulo="Todo funcionando" texto="No hay fallas ni revisiones pendientes." />
            : <EmptyState icono={Wrench} titulo="Sin registros" texto="No hay mantenimientos con esos filtros."
                accion={<button type="button" className="gt-btn gt-btn-primary" onClick={mant.abrirNuevoMant}>Registrar mantenimiento</button>} />}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mant.mantFiltrados.map(m => <FilaMantenimiento key={m.id} m={m} mant={mant} onEliminar={onEliminar} />)}
        </div>
      )}
    </>
  )
}

function FilaMantenimiento({ m, mant, onEliminar }: { m: Mantenimiento; mant: ReturnType<typeof useMantenimientos>; onEliminar: (id: number) => void }) {
  const pendiente = m.tipo === 'PENDIENTE'
  const falla = pendiente && m.categoria !== 'PREVENTIVO'
  return (
    <article className={`gt-mant-item${pendiente ? (falla ? ' falla' : ' revision') : ''}`}>
      <NroMaquina nro={m.maquinaNroMaquina} chico />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <strong>{m.maquinaNombre}</strong>
          {pendiente
            ? <Pill tono={falla ? 'danger' : 'warn'}>{falla ? 'Falla' : 'Revisión'} pendiente</Pill>
            : <Pill tono="ok">Hecho</Pill>}
          {m.categoria && !pendiente && <Pill>{m.categoria === 'CORRECTIVO' ? 'Correctivo' : 'Preventivo'}</Pill>}
        </div>
        <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: 14 }}>{m.descripcion}</p>
        <div className="gt-mant-meta">
          {m.fechaMantenimiento && <span><CalendarDays size={13} aria-hidden /> {formatFecha(m.fechaMantenimiento)}</span>}
          {m.fechaAlta && <span><CircleCheck size={13} aria-hidden /> Operativa desde {formatFecha(m.fechaAlta)}{m.diasInactividad != null ? ` (${m.diasInactividad} d)` : ''}</span>}
          {m.tecnico && <span><User size={13} aria-hidden /> {m.tecnico}{m.telefonoTecnico ? ` · ${m.telefonoTecnico}` : ''}</span>}
          {m.costo != null && m.costo > 0 && <span><CircleDollarSign size={13} aria-hidden /> {pesos(Number(m.costo))}</span>}
        </div>
        {m.observaciones && <p className="gt-text-sm gt-text-muted" style={{ margin: '4px 0 0' }}>{m.observaciones}</p>}
      </div>
      <div className="gt-mant-acciones">
        {pendiente && (
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => mant.marcarRealizado(m)}>
            <CircleCheck size={14} aria-hidden /> Arreglada
          </button>
        )}
        <IconButton icono={Pencil} etiqueta="Editar" onClick={() => mant.abrirEditarMant(m)} />
        <IconButton icono={Trash2} etiqueta="Eliminar" tono="danger" onClick={() => onEliminar(m.id!)} />
      </div>
    </article>
  )
}
