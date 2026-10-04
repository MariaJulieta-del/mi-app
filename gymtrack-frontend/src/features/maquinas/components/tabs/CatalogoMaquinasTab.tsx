import { useState, useEffect, useMemo } from 'react'
import type { Maquina } from '../../types/Maquina'
import type { Ejercicio } from '../../../ejercicios/services/ejercicioService'
import { MACHINES_CATALOG, CATALOG_MACHINE_GROUPS, type CatalogMaquina } from '../../assets/maquinasCatalog'

const TIPO_EMOJI: Record<string, string> = {
  'máquina': '⚙️',
  'polea': '🔄',
  'rack': '🏗️',
  'cardio': '🏃',
  'barra libre': '🏋️',
}

interface Props {
  maquinas: Maquina[]
  ejercicios: Ejercicio[]
  guardandoCat: string | null
  catError: string | null
  setCatError: (v: string | null) => void
  onGuardar: (cat: CatalogMaquina) => void
}

export default function CatalogoMaquinasTab({
  maquinas, ejercicios, guardandoCat, catError, setCatError, onGuardar,
}: Props) {
  const [catGrupo, setCatGrupo] = useState('')
  const [catQ, setCatQ] = useState('')
  const [catQActivo, setCatQActivo] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setCatQActivo(catQ), 300)
    return () => clearTimeout(t)
  }, [catQ])

  const nombresGuardados = useMemo(
    () => new Set(maquinas.map(m => m.nombre.toLowerCase())),
    [maquinas]
  )

  const catFiltradas = useMemo(() => {
    return MACHINES_CATALOG.filter(m => {
      const matchGrupo = !catGrupo || m.grupos.includes(catGrupo)
      const matchQ = !catQActivo || m.nombre.toLowerCase().includes(catQActivo.toLowerCase())
      return matchGrupo && matchQ
    })
  }, [catGrupo, catQActivo])

  const countPorGrupo = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const g of CATALOG_MACHINE_GROUPS) {
      counts[g] = MACHINES_CATALOG.filter(m => m.grupos.includes(g)).length
    }
    return counts
  }, [])

  const ejerciciosCompatibles = (grupos: string[]): Ejercicio[] => {
    if (!grupos || grupos.length === 0) return []
    return ejercicios.filter(e =>
      e.activo && (e.grupos ?? []).some(g => grupos.includes(g))
    )
  }

  return (
    <div style={{ border: '1.5px solid #D97706', borderRadius: '0 8px 8px 8px', background: 'var(--bg-surface)', padding: 20 }}>

      {catError && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
          {catError}
          <button onClick={() => setCatError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <input
        className="gt-input"
        placeholder="Buscar máquina en el catálogo…"
        value={catQ}
        onChange={e => setCatQ(e.target.value)}
        style={{ marginBottom: 14, maxWidth: 380 }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        <button
          onClick={() => setCatGrupo('')}
          style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1.5px solid',
            fontWeight: !catGrupo ? 700 : 400,
            background: !catGrupo ? '#D97706' : 'var(--bg-surface-2)',
            color: !catGrupo ? '#fff' : 'var(--text-secondary)',
            borderColor: !catGrupo ? '#D97706' : 'var(--border)',
          }}>
          Todos ({MACHINES_CATALOG.length})
        </button>
        {CATALOG_MACHINE_GROUPS.filter(g => countPorGrupo[g] > 0).map(g => (
          <button key={g}
            onClick={() => setCatGrupo(g === catGrupo ? '' : g)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1.5px solid',
              fontWeight: catGrupo === g ? 700 : 400,
              background: catGrupo === g ? '#D97706' : 'var(--yellow-bg)',
              color: catGrupo === g ? '#fff' : 'var(--yellow-text)',
              borderColor: catGrupo === g ? '#D97706' : 'var(--border)',
            }}>
            {g} ({countPorGrupo[g]})
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
        {catFiltradas.length} máquina{catFiltradas.length !== 1 ? 's' : ''} en el catálogo
      </p>

      {catFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 28, marginBottom: 6 }}>🔍</p>
          <p style={{ margin: 0 }}>No hay máquinas que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {catFiltradas.map(cat => {
            const yaGuardada = nombresGuardados.has(cat.nombre.toLowerCase())
            const cargando = guardandoCat === cat.id
            const ejsRelacionados = ejerciciosCompatibles(cat.grupos)
            return (
              <div key={cat.id} style={{
                border: `1.5px solid var(--border)`, borderRadius: 10,
                background: yaGuardada ? 'var(--yellow-bg)' : 'var(--bg-surface-2)',
                padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
                opacity: yaGuardada ? 0.9 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 16, marginRight: 6 }}>{TIPO_EMOJI[cat.tipo] ?? '⚙️'}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{cat.nombre}</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: 'var(--bg-surface-3)', color: 'var(--text-muted)', textTransform: 'uppercase',
                    letterSpacing: 0.4, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {cat.tipo}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {cat.grupos.map(g => (
                    <span key={g} style={{
                      fontSize: 11, background: 'var(--yellow-bg)', color: 'var(--yellow-text)',
                      borderRadius: 4, padding: '2px 8px', fontWeight: 600,
                    }}>{g}</span>
                  ))}
                </div>

                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {cat.descripcion}
                </p>

                {ejsRelacionados.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      Ejercicios que usan esta máquina
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {ejsRelacionados.slice(0, 4).map(e => (
                        <span key={e.id} style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
                          💪 {e.nombre}
                        </span>
                      ))}
                      {ejsRelacionados.length > 4 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px' }}>
                          +{ejsRelacionados.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => !yaGuardada && !cargando && onGuardar(cat)}
                  disabled={yaGuardada || cargando}
                  style={{
                    marginTop: 4, padding: '7px 0', borderRadius: 7, fontSize: 13,
                    border: '1.5px solid', cursor: yaGuardada ? 'default' : 'pointer',
                    fontWeight: 700, transition: 'all 0.1s',
                    background: yaGuardada ? 'var(--green-bg)' : (cargando ? 'var(--yellow-bg)' : '#D97706'),
                    color: yaGuardada ? 'var(--green-text)' : (cargando ? 'var(--yellow-text)' : '#fff'),
                    borderColor: yaGuardada ? 'var(--accent-border)' : (cargando ? 'var(--border)' : '#B45309'),
                  }}>
                  {yaGuardada ? '✓ Guardada en Mis máquinas' : (cargando ? 'Guardando…' : '+ Agregar a Mis máquinas')}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
