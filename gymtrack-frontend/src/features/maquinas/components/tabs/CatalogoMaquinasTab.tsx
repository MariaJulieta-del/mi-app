import { useEffect, useMemo, useState } from 'react'
import { Bike, Check, Cog, Dumbbell, Plus, Search, Spline, Warehouse, type LucideIcon } from 'lucide-react'
import { EmptyState, Pill } from '../../../../shared/components/ui'
import type { Maquina } from '../../types/Maquina'
import { MACHINES_CATALOG, CATALOG_MACHINE_GROUPS, type CatalogMaquina } from '../../assets/maquinasCatalog'

const ICONO_TIPO: Record<string, LucideIcon> = {
  'máquina': Cog,
  'polea': Spline,
  'rack': Warehouse,
  'cardio': Bike,
  'barra libre': Dumbbell,
}

/** Catálogo de máquinas comunes, listas para agregar al gimnasio con músculos e instrucciones */
export default function CatalogoMaquinasTab({ maquinas, guardandoCat, catError, setCatError, onGuardar }: {
  maquinas: Maquina[]
  guardandoCat: string | null
  catError: string | null
  setCatError: (v: string | null) => void
  onGuardar: (cat: CatalogMaquina) => void
}) {
  const [grupo, setGrupo] = useState('')
  const [q, setQ] = useState('')
  const [qActivo, setQActivo] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setQActivo(q), 250)
    return () => clearTimeout(t)
  }, [q])

  const guardadas = useMemo(() => new Set(maquinas.map(m => m.nombre.trim().toLowerCase())), [maquinas])

  const lista = useMemo(() => MACHINES_CATALOG.filter(m =>
    (!grupo || m.grupos.includes(grupo)) && (!qActivo || m.nombre.toLowerCase().includes(qActivo.toLowerCase())),
  ), [grupo, qActivo])

  return (
    <>
      {catError && (
        <div className="gt-alert gt-alert-error" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {catError}
          <button type="button" onClick={() => setCatError(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}
      <div className="gt-toolbar-fila">
        <div className="gt-busqueda">
          <Search size={16} aria-hidden />
          <input className="gt-input" placeholder="Buscar en el catálogo…" value={q} onChange={e => setQ(e.target.value)} aria-label="Buscar en el catálogo" />
        </div>
        <select className="gt-select" value={grupo} onChange={e => setGrupo(e.target.value)} aria-label="Músculo">
          <option value="">Todos los músculos</option>
          {CATALOG_MACHINE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="gt-text-sm gt-text-muted">{lista.length} de {MACHINES_CATALOG.length}</span>
      </div>

      {lista.length === 0 ? (
        <div className="gt-card"><EmptyState icono={Search} titulo="No hay máquinas que coincidan" /></div>
      ) : (
        <div className="gt-maq-grid">
          {lista.map(cat => {
            const ya = guardadas.has(cat.nombre.trim().toLowerCase())
            const cargando = guardandoCat === cat.id
            const Icono = ICONO_TIPO[cat.tipo] ?? Cog
            return (
              <article key={cat.id} className="gt-maq-card gt-cat-maq">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className="gt-cat-maq-icono"><Icono size={20} aria-hidden /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="gt-maq-nombre">{cat.nombre}</span>
                    <span className="gt-grupos" style={{ marginTop: 6 }}>
                      {cat.grupos.slice(0, 3).map(g => <span key={g} className="gt-grupo">{g}</span>)}
                    </span>
                  </div>
                </div>
                <p className="gt-cat-maq-desc">{cat.descripcion}</p>
                <div className="gt-maq-pie">
                  <span className="gt-text-sm gt-text-muted" style={{ textTransform: 'capitalize' }}>{cat.tipo}</span>
                  <span style={{ flex: 1 }} />
                  {ya
                    ? <Pill tono="ok" icono={Check}>En tu gimnasio</Pill>
                    : <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={cargando} onClick={() => onGuardar(cat)}>
                        <Plus size={14} aria-hidden /> {cargando ? 'Agregando…' : 'Agregar'}
                      </button>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
