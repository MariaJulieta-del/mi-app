import { useState, useRef } from 'react'
import type { Ejercicio } from '../../services/ejercicioService'
import { crearEjercicio } from '../../services/ejercicioService'
import { EXERCISES_CATALOG, CATALOG_BODY_PARTS, type CatalogExercise } from '../../assets/exercisesCatalog'

interface Props {
  ejercicios: Ejercicio[]
  setMsg: (m: string | null) => void
  setError: (m: string | null) => void
  setLightbox: (v: { url: string; nombre: string } | null) => void
  onGuardado: () => void
}

export default function CatalogoEjerciciosTab({ ejercicios, setMsg, setError, setLightbox, onGuardado }: Props) {
  const [catBodyPart, setCatBodyPart] = useState('')
  const [catQ, setCatQ] = useState('')
  const [catQActivo, setCatQActivo] = useState('')
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)
  const [guardandoCat, setGuardandoCat] = useState<string | null>(null)
  const timerCat = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCatQ = (q: string) => {
    setCatQ(q)
    if (timerCat.current) clearTimeout(timerCat.current)
    timerCat.current = setTimeout(() => setCatQActivo(q), 300)
  }

  const catFiltrados = EXERCISES_CATALOG.filter(ex => {
    const matchGrupo = !catBodyPart || ex.bodyPart === catBodyPart
    const matchQ = !catQActivo ||
      ex.name.toLowerCase().includes(catQActivo.toLowerCase()) ||
      ex.target.toLowerCase().includes(catQActivo.toLowerCase())
    return matchGrupo && matchQ
  })

  const abrirGifCatalogo = (ex: CatalogExercise) => {
    if (ex.gifUrl) { setLightbox({ url: ex.gifUrl, nombre: ex.name }); return }
    setError('No hay imagen disponible para este ejercicio.')
  }

  const guardarDeCatalogo = async (ex: CatalogExercise) => {
    setGuardandoCat(ex.id)
    try {
      await crearEjercicio({
        nombre: ex.name,
        descripcion: ex.instructions?.join('\n').substring(0, 2000) || undefined,
        grupos: [ex.bodyPart],
        esMaquina: !['body weight', 'barbell', 'dumbbell', 'band', 'ez barbell'].includes(ex.equipment),
        activo: true,
        imagenUrl: ex.gifUrl || undefined,
        maquinaIds: [],
      })
      setMsg(`✓ "${ex.name}" guardado en Mis ejercicios`)
      onGuardado()
    } catch {
      setError('Error al guardar el ejercicio')
    } finally {
      setGuardandoCat(null)
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="gt-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input className="gt-input" style={{ flex: 1 }}
            placeholder="Buscar ejercicio o músculo…"
            value={catQ}
            onChange={e => handleCatQ(e.target.value)} />
          {catQ && (
            <button className="gt-btn gt-btn-secondary" onClick={() => { setCatQ(''); setCatQActivo('') }}>
              Limpiar
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setCatBodyPart('')}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
              fontWeight: !catBodyPart ? 700 : 400,
              background: !catBodyPart ? 'var(--accent)' : 'var(--bg-surface-2)',
              color: !catBodyPart ? 'var(--on-accent)' : 'var(--text-secondary)',
              borderColor: !catBodyPart ? 'var(--accent)' : 'var(--border)',
            }}>
            Todos ({EXERCISES_CATALOG.length})
          </button>
          {CATALOG_BODY_PARTS.map(bp => {
            const count = EXERCISES_CATALOG.filter(e => e.bodyPart === bp).length
            return (
              <button key={bp} onClick={() => setCatBodyPart(bp === catBodyPart ? '' : bp)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
                  fontWeight: catBodyPart === bp ? 700 : 400,
                  background: catBodyPart === bp ? 'var(--accent)' : 'var(--blue-bg)',
                  color: catBodyPart === bp ? 'var(--on-accent)' : 'var(--blue-text)',
                  borderColor: catBodyPart === bp ? 'var(--accent)' : 'var(--border)',
                }}>
                {bp} ({count})
              </button>
            )
          })}
        </div>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
        {catFiltrados.length} ejercicio{catFiltrados.length !== 1 ? 's' : ''} encontrados
      </p>

      {catFiltrados.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}>
          {catFiltrados.map(ex => {
            const yaGuardado = ejercicios.some(e => e.nombre.toLowerCase() === ex.name.toLowerCase())
            const cargando = guardandoCat === ex.id
            const isExp = expandedCatId === ex.id

            return (
              <div key={ex.id} style={{
                border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                background: 'var(--bg-surface-2)', boxShadow: 'var(--shadow-sm)',
                transition: 'box-shadow 0.15s, transform 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none' }}
                onClick={() => setExpandedCatId(isExp ? null : ex.id)}>

                <div
                  style={{ position: 'relative', background: '#ffffff', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in' }}
                  onClick={ev => { ev.stopPropagation(); abrirGifCatalogo(ex) }}
                  title="Ver GIF animado"
                >
                  {ex.gifUrl ? (
                    <img src={ex.gifUrl} alt={ex.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <span style={{ fontSize: 40 }}>💪</span>
                  )}
                  {ex.gifUrl && (
                    <span style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>▶ GIF</span>
                  )}
                  <span style={{
                    position: 'absolute', top: 8, left: 8,
                    fontSize: 10, fontWeight: 700,
                    background: 'rgba(46,117,182,0.9)', color: '#fff',
                    borderRadius: 6, padding: '2px 7px',
                  }}>
                    {ex.bodyPart}
                  </span>
                  {yaGuardado && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8,
                      fontSize: 10, fontWeight: 700,
                      background: 'rgba(22,163,74,0.9)', color: '#fff',
                      borderRadius: 6, padding: '2px 7px',
                    }}>
                      ✓ Guardado
                    </span>
                  )}
                </div>

                <div style={{ padding: '10px 12px' }}>
                  <p style={{
                    margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)',
                    textTransform: 'capitalize', lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {ex.name}
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {ex.equipment} · {ex.target}
                  </p>

                  {isExp && ex.instructions?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <ol style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {ex.instructions.slice(0, 4).map((inst, i) => (
                          <li key={i} style={{ marginBottom: 3 }}>{inst}</li>
                        ))}
                      </ol>
                      <button
                        onClick={ev => { ev.stopPropagation(); abrirGifCatalogo(ex) }}
                        style={{
                          marginTop: 6, background: 'none', border: '1px solid var(--border)',
                          borderRadius: 5, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
                          color: 'var(--text-muted)', width: '100%',
                        }}>
                        ▶ Ver demostración
                      </button>
                    </div>
                  )}

                  <button
                    className={yaGuardado ? 'gt-btn gt-btn-secondary' : 'gt-btn gt-btn-primary'}
                    style={{ width: '100%', fontSize: 12, padding: '6px 0' }}
                    disabled={cargando || yaGuardado}
                    onClick={ev => { ev.stopPropagation(); if (!yaGuardado) guardarDeCatalogo(ex) }}
                  >
                    {cargando ? '⏳ Guardando…' : yaGuardado ? '✓ En mis ejercicios' : '+ Guardar en mis ejercicios'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="gt-card" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 24, marginBottom: 6 }}>🔍</p>
          <p style={{ margin: 0 }}>Sin resultados para "{catQActivo || catBodyPart}"</p>
        </div>
      )}
    </div>
  )
}
