import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Rutina } from '../types/Rutina'
import {
  obtenerRutinas, obtenerTodasRutinas, obtenerRutinasGenerales, eliminarRutina
} from '../services/rutinaService'
import { useAuth } from '../context/AuthContext'
import ConfirmModal from './ConfirmModal'
import { useToast } from '../hooks/useToast'

// ── Configuración visual de trenes musculares ──────────────────────
const TREN_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  SUPERIOR:  { label: 'Tren Superior',  bg: 'var(--blue-bg)',   color: 'var(--blue-text)' },
  INFERIOR:  { label: 'Tren Inferior',  bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  CORE:      { label: 'Core / Abdomen', bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
  CARDIO:    { label: 'Cardio',         bg: 'var(--red-light)', color: 'var(--red-text)' },
  FULL_BODY: { label: 'Full Body',      bg: '#F5F3FF', color: '#7C3AED' },
}
const TREN_DEFAULT = { label: 'Sin especificar', bg: 'var(--bg-surface-2)', color: 'var(--text-muted)' }

const DIFICULTAD_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  BAJA:  { label: 'Baja',  bg: 'var(--green-bg)',   color: 'var(--green-text)' },
  MEDIA: { label: 'Media', bg: 'var(--yellow-bg)',  color: 'var(--yellow-text)' },
  ALTA:  { label: 'Alta',  bg: 'var(--red-light)',  color: 'var(--red-text)' },
}

const DIA_SHORT: Record<string, string> = {
  'Lunes': 'L', 'Martes': 'M', 'Miércoles': 'X', 'Jueves': 'J',
  'Viernes': 'V', 'Sábado': 'S', 'Domingo': 'D',
}
const DIAS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

type Tab = 'personalizadas' | 'genericas'

export default function RutinasList() {
  const { user } = useAuth()
  const toast = useToast()
  const esAdmin = user?.rol === 'ADMIN' || user?.rol === 'EMPLEADO'
  const socioId = user?.socioId ?? null

  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [rutinasGenerales, setRutinasGenerales] = useState<Rutina[]>([])
  const [tab, setTab] = useState<Tab>('personalizadas')
  const [filtroTren, setFiltroTren] = useState('')
  const [filtroDificultad, setFiltroDificultad] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<Rutina | null>(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      if (esAdmin) {
        const [todas, generales] = await Promise.all([
          obtenerTodasRutinas(),
          obtenerRutinasGenerales(),
        ])
        setRutinas(todas)
        setRutinasGenerales(generales)
      } else if (socioId) {
        setRutinas(await obtenerRutinas(socioId))
      }
    } catch {
      setError('Error al cargar las rutinas')
    } finally {
      setCargando(false)
    }
  }

  const handleEliminar = (r: Rutina) => setConfirmarEliminar(r)

  const confirmarEliminarRutina = async () => {
    if (!confirmarEliminar) return
    const r = confirmarEliminar
    setConfirmarEliminar(null)
    try {
      await eliminarRutina(r.id!, r.socioId ?? null)
      if (r.socioId === null) setRutinasGenerales(p => p.filter(x => x.id !== r.id))
      else setRutinas(p => p.filter(x => x.id !== r.id))
      toast.success('Rutina eliminada', r.nombre)
    } catch {
      toast.error('Error', 'No se pudo eliminar la rutina')
    }
  }

  const linkVer = (r: Rutina) =>
    r.socioId === null
      ? `/rutinas/${r.id}?general=true`
      : esAdmin ? `/rutinas/${r.id}?socioId=${r.socioId}` : `/rutinas/${r.id}`

  const linkEditar = (r: Rutina) =>
    r.socioId === null
      ? `/rutinas/editar/${r.id}?general=true`
      : esAdmin ? `/rutinas/editar/${r.id}?socioId=${r.socioId}` : `/rutinas/editar/${r.id}`

  const listaBase = tab === 'genericas' ? rutinasGenerales : rutinas

  const lista = listaBase
    .filter(r => !filtroTren || (r.trenes ?? []).includes(filtroTren))
    .filter(r => !filtroDificultad || r.dificultad === filtroDificultad)
    .filter(r => {
      if (!busqueda.trim()) return true
      const q = busqueda.toLowerCase()
      return (
        r.nombre.toLowerCase().includes(q) ||
        (r.descripcion ?? '').toLowerCase().includes(q) ||
        (r.socioNombre ?? '').toLowerCase().includes(q)
      )
    })

  const trenes = Object.keys(TREN_CONFIG)
  const dificultades = Object.keys(DIFICULTAD_CONFIG)

  const resetFiltros = () => {
    setFiltroTren('')
    setFiltroDificultad('')
    setBusqueda('')
  }

  const hayFiltros = filtroTren || filtroDificultad || busqueda.trim()

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Rutinas</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {esAdmin ? 'Gestión de rutinas de entrenamiento' : 'Tus rutinas asignadas'}
          </p>
        </div>
        {esAdmin && (
          <Link to="/rutinas/nueva" className="gt-btn gt-btn-primary">+ Nueva rutina</Link>
        )}
      </div>

      {error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs admin */}
      {esAdmin && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid var(--border)' }}>
          {(['personalizadas', 'genericas'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setFiltroTren(''); setFiltroDificultad(''); setBusqueda('') }}
              style={{
                padding: '8px 20px', border: 'none', cursor: 'pointer', fontSize: 14,
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                background: 'none',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -2, transition: 'all 0.15s',
              }}>
              {t === 'personalizadas' ? 'Personalizadas' : 'Generales'}
              <span style={{ marginLeft: 6, fontSize: 12, background: 'var(--bg-surface-2)', borderRadius: 10, padding: '1px 7px', color: 'var(--text-muted)' }}>
                {t === 'personalizadas' ? rutinas.length : rutinasGenerales.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div style={{ marginBottom: 12 }}>
        <input
          className="gt-input"
          style={{ maxWidth: 360 }}
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)' }}>
            {lista.length} resultado{lista.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filtros: tren muscular */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <button onClick={() => setFiltroTren('')}
          style={{
            padding: '5px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 12,
            cursor: 'pointer', fontWeight: !filtroTren ? 700 : 400,
            background: !filtroTren ? 'var(--accent)' : 'var(--bg-surface)',
            color: !filtroTren ? '#fff' : 'var(--text-secondary)',
            borderColor: !filtroTren ? 'var(--accent)' : 'var(--border)',
          }}>
          Todos los grupos
        </button>
        {trenes.map(t => {
          const cfg = TREN_CONFIG[t]
          const sel = filtroTren === t
          return (
            <button key={t} onClick={() => setFiltroTren(sel ? '' : t)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 12,
                cursor: 'pointer', fontWeight: sel ? 700 : 400,
                background: sel ? cfg.color : 'var(--bg-surface)',
                color: sel ? '#fff' : cfg.color,
                borderColor: cfg.color,
              }}>
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Filtros: dificultad */}
      {(tab === 'genericas' || !esAdmin) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 2 }}>Dificultad:</span>
          <button onClick={() => setFiltroDificultad('')}
            style={{
              padding: '4px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 12,
              cursor: 'pointer', fontWeight: !filtroDificultad ? 700 : 400,
              background: !filtroDificultad ? 'var(--text-secondary)' : 'var(--bg-surface)',
              color: !filtroDificultad ? '#fff' : 'var(--text-secondary)',
              borderColor: 'var(--border)',
            }}>
            Todas
          </button>
          {dificultades.map(d => {
            const cfg = DIFICULTAD_CONFIG[d]
            const sel = filtroDificultad === d
            return (
              <button key={d} onClick={() => setFiltroDificultad(sel ? '' : d)}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: '1.5px solid', fontSize: 12,
                  cursor: 'pointer', fontWeight: sel ? 700 : 400,
                  background: sel ? cfg.color : cfg.bg,
                  color: sel ? '#fff' : cfg.color,
                  borderColor: cfg.color,
                }}>
                {cfg.label}
              </button>
            )
          })}
          {hayFiltros && (
            <button onClick={resetFiltros}
              style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer' }}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {cargando ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando rutinas...</div>
      ) : lista.length === 0 ? (
        <div className="gt-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>🏋️</p>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {hayFiltros ? 'No hay rutinas que coincidan con los filtros.' : 'No hay rutinas todavía.'}
          </p>
          {hayFiltros && (
            <button onClick={resetFiltros} className="gt-btn gt-btn-secondary" style={{ marginTop: 12 }}>
              Limpiar filtros
            </button>
          )}
          {esAdmin && !hayFiltros && (
            <Link to="/rutinas/nueva" className="gt-btn gt-btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
              Crear primera rutina
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {lista.map(r => {
            const trenPrincipal = (r.trenes && r.trenes.length > 0)
              ? (TREN_CONFIG[r.trenes[0]] ?? TREN_DEFAULT)
              : TREN_DEFAULT
            const difCfg = r.dificultad ? DIFICULTAD_CONFIG[r.dificultad] : null
            return (
              <div key={r.id} style={{
                background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
              >
                {/* Color strip by tren */}
                <div style={{ height: 5, background: trenPrincipal.color }} />

                <div style={{ padding: '16px 18px', flex: 1 }}>
                  {/* Badges row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 6, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(r.trenes && r.trenes.length > 0)
                        ? r.trenes.map(tid => {
                            const cfg = TREN_CONFIG[tid] ?? TREN_DEFAULT
                            return (
                              <span key={tid} style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', background: cfg.bg, color: cfg.color }}>
                                {cfg.label}
                              </span>
                            )
                          })
                        : (
                          <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', background: TREN_DEFAULT.bg, color: TREN_DEFAULT.color }}>
                            {TREN_DEFAULT.label}
                          </span>
                        )
                      }
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {difCfg && (
                        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', background: difCfg.bg, color: difCfg.color }}>
                          {difCfg.label}
                        </span>
                      )}
                      {r.socioId === null ? (
                        <span style={{ fontSize: 11, background: '#F5F3FF', color: '#7C3AED', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                          GENERAL
                        </span>
                      ) : esAdmin && (
                        <span style={{ fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
                          {r.socioNombre ?? `Socio #${r.socioId}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nombre */}
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {r.nombre}
                  </p>
                  {r.descripcion && (
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {r.descripcion.length > 80 ? r.descripcion.slice(0, 80) + '…' : r.descripcion}
                    </p>
                  )}

                  {/* Días de la semana */}
                  {r.diasSemana && r.diasSemana.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                      {DIAS_ORDER.map(dia => {
                        const activo = r.diasSemana!.includes(dia)
                        const esFinSemana = dia === 'Sábado' || dia === 'Domingo'
                        return (
                          <div key={dia} style={{
                            width: 26, height: 26, borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700,
                            background: activo ? (esFinSemana ? 'var(--yellow-bg)' : trenPrincipal.bg) : 'var(--bg-surface-2)',
                            color: activo ? (esFinSemana ? 'var(--yellow-text)' : trenPrincipal.color) : 'var(--border)',
                            border: activo ? `1.5px solid ${esFinSemana ? 'var(--yellow-text)' : trenPrincipal.color}44` : '1.5px solid transparent',
                          }}>
                            {DIA_SHORT[dia] ?? dia[0]}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-xmuted)' }}>
                    Creada {r.fechaCreacion?.slice(0, 10)}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                  <Link to={linkVer(r)} style={{
                    flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 13,
                    fontWeight: 600, color: 'var(--accent)', textDecoration: 'none',
                    borderRight: '1px solid var(--border-light)', transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    Ver ejercicios
                  </Link>
                  {esAdmin && (
                    <>
                      <Link to={linkEditar(r)} style={{
                        flex: 1, padding: '10px 0', textAlign: 'center', fontSize: 13,
                        fontWeight: 600, color: 'var(--blue-text)', textDecoration: 'none',
                        borderRight: '1px solid var(--border-light)', transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Editar
                      </Link>
                      <button onClick={() => handleEliminar(r)}
                        style={{
                          flex: 1, padding: '10px 0', border: 'none', background: 'none',
                          fontSize: 13, fontWeight: 600, color: 'var(--red)', cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-light)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        open={confirmarEliminar !== null}
        title="Eliminar rutina"
        message={confirmarEliminar ? `¿Eliminar la rutina "${confirmarEliminar.nombre}"? Se perderán todos sus ejercicios.` : ''}
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmarEliminarRutina}
        onCancel={() => setConfirmarEliminar(null)}
      />
    </>
  )
}
