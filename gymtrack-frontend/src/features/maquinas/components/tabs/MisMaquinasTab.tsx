import { useMemo, useState } from 'react'
import { Cog, Search } from 'lucide-react'
import { EmptyState, SkeletonTarjetas } from '../../../../shared/components/ui'
import { GRUPOS_CATEGORIAS } from '../../../ejercicios/services/ejercicioService'
import type { useMaquinas } from '../../hooks/useMaquinas'
import type { Mantenimiento } from '../../types/Mantenimiento'
import { estadoMaquina, type EstadoMaquina } from '../../utils/estadoMaquina'
import MaquinaCard from '../MaquinaCard'

export type FiltroMaquinas = 'todas' | 'falla' | 'sinNumero' | 'sinEjercicios'

const FILTROS: { valor: FiltroMaquinas; texto: string }[] = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'falla', texto: 'Con falla o revisión' },
  { valor: 'sinNumero', texto: 'Sin número' },
  { valor: 'sinEjercicios', texto: 'Sin ejercicios' },
]

/** Las máquinas del gimnasio en tarjetas, con búsqueda y filtros */
export default function MisMaquinasTab({ maq, pendientes, filtro, setFiltro, onAbrir, onIrCatalogo }: {
  maq: ReturnType<typeof useMaquinas>
  pendientes: Map<number, Mantenimiento[]>
  filtro: FiltroMaquinas
  setFiltro: (f: FiltroMaquinas) => void
  onAbrir: (id: number) => void
  onIrCatalogo: () => void
}) {
  const [grupo, setGrupo] = useState('')

  const lista = useMemo(() => {
    const q = maq.busqueda.trim().toLowerCase()
    return maq.maquinas
      .filter(m => maq.verInactivas || m.activa)
      .map(m => ({ m, estado: estadoMaquina(m, pendientes.get(m.id!)) as EstadoMaquina, ejs: maq.ejerciciosDe(m.id!).length }))
      .filter(({ m, estado, ejs }) => {
        if (q && !m.nombre.toLowerCase().includes(q) && !(m.nroMaquina ?? '').toLowerCase().includes(q)) return false
        if (grupo && !(m.grupos ?? []).includes(grupo)) return false
        if (filtro === 'falla') return estado === 'falla' || estado === 'revision'
        if (filtro === 'sinNumero') return m.activa && !(m.nroMaquina ?? '').trim()
        if (filtro === 'sinEjercicios') return m.activa && ejs === 0
        return true
      })
      // Primero las que tienen problemas, después por número
      .sort((a, b) => {
        const peso = (e: EstadoMaquina) => ({ falla: 0, revision: 1, operativa: 2, inactiva: 3 }[e])
        if (peso(a.estado) !== peso(b.estado)) return peso(a.estado) - peso(b.estado)
        const na = Number(a.m.nroMaquina), nb = Number(b.m.nroMaquina)
        if (!isNaN(na) && !isNaN(nb) && a.m.nroMaquina && b.m.nroMaquina) return na - nb
        if (a.m.nroMaquina && !b.m.nroMaquina) return -1
        if (!a.m.nroMaquina && b.m.nroMaquina) return 1
        return a.m.nombre.localeCompare(b.m.nombre)
      })
  }, [maq, pendientes, filtro, grupo])

  if (maq.cargando) return <SkeletonTarjetas />

  if (maq.maquinas.length === 0) {
    return (
      <div className="gt-card">
        <EmptyState icono={Cog} titulo="Todavía no cargaste máquinas"
          texto="Agregalas desde el catálogo (ya vienen con músculos e instrucciones) o creá una nueva."
          accion={<div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="gt-btn gt-btn-primary" onClick={onIrCatalogo}>Ver catálogo</button>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={maq.abrirNuevo}>Crear una</button>
          </div>} />
      </div>
    )
  }

  return (
    <>
      <div className="gt-toolbar-fila">
        <div className="gt-busqueda">
          <Search size={16} aria-hidden />
          <input className="gt-input" placeholder="Buscar por nombre o número…" value={maq.busqueda}
            onChange={e => maq.setBusqueda(e.target.value)} aria-label="Buscar máquina" />
        </div>
        <select className="gt-select" value={grupo} onChange={e => setGrupo(e.target.value)} aria-label="Músculo">
          <option value="">Todos los músculos</option>
          {GRUPOS_CATEGORIAS.map(c => (
            <optgroup key={c.label} label={c.label}>
              {c.grupos.map(g => <option key={g} value={g}>{g}</option>)}
            </optgroup>
          ))}
        </select>
        <label className="gt-text-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={maq.verInactivas} onChange={e => maq.setVerInactivas(e.target.checked)} /> Ver dadas de baja
        </label>
      </div>
      <div className="gt-toolbar-fila" style={{ marginTop: -4 }}>
        {FILTROS.map(f => (
          <button key={f.valor} type="button" className={`gt-filtro-chip${filtro === f.valor ? ' activo' : ''}`}
            aria-pressed={filtro === f.valor} onClick={() => setFiltro(f.valor)}>{f.texto}</button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="gt-card">
          <EmptyState icono={Search} titulo="No hay máquinas con esos filtros"
            accion={<button type="button" className="gt-btn gt-btn-secondary" onClick={() => { setFiltro('todas'); setGrupo(''); maq.setBusqueda('') }}>Limpiar filtros</button>} />
        </div>
      ) : (
        <div className="gt-maq-grid">
          {lista.map(({ m, estado, ejs }) => (
            <MaquinaCard key={m.id} maquina={m} estado={estado} cantidadEjercicios={ejs}
              onAbrir={() => onAbrir(m.id!)} onEditar={() => maq.abrirEditar(m)} onReportar={() => maq.abrirReportar(m.id!)} />
          ))}
        </div>
      )}
    </>
  )
}
