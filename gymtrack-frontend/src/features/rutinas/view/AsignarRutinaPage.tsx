import { Link } from 'react-router-dom'
import { useAsignarRutina } from '../hooks/useAsignarRutina'
import RutinaCard from '../components/RutinaCard'
import { TREN_CONFIG, OBJETIVO_CONFIG, DIFICULTAD_CONFIG, linkRutina } from '../utils/rutinaUtils'

const PASOS = ['Socio', '¿Cómo la armás?', 'Elegir plantilla', 'Listo']

export default function AsignarRutinaPage() {
  const a = useAsignarRutina()

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div className="gt-section-header">
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Asignar rutina</h1>
          <p className="gt-text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            Elegí el socio y asignale una plantilla lista o armale una rutina a medida.
          </p>
        </div>
        <button className="gt-btn gt-btn-secondary" onClick={() => a.navigate(-1)}>← Volver</button>
      </div>

      <div className="gt-steps" aria-label="Pasos">
        {PASOS.map((nombre, i) => (
          <span key={nombre} className={`gt-step${a.paso === i + 1 ? ' activo' : ''}${a.paso > i + 1 ? ' hecho' : ''}`}>
            <span className="gt-step-num">{a.paso > i + 1 ? '✓' : i + 1}</span>{nombre}
          </span>
        ))}
      </div>

      {a.error && (
        <div className="gt-alert gt-alert-error">
          {a.error}
          <button onClick={() => a.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
        </div>
      )}

      {/* ── Listo ── */}
      {a.asignada && a.socio && (
        <div className="gt-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <p style={{ fontSize: 44, margin: '0 0 8px' }}>🎉</p>
          <h2 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>¡Rutina asignada!</h2>
          <p className="gt-text-muted" style={{ margin: '0 0 20px' }}>
            <strong>{a.asignada.nombre}</strong> ya figura en el perfil de {a.socio.nombre} {a.socio.apellido}.
            Es una copia: podés ajustarla sin tocar la plantilla original.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={linkRutina(a.asignada, true)} className="gt-btn gt-btn-primary">Ajustar ejercicios / pesos</Link>
            <Link to={`/socios/${a.socio.id}/perfil`} className="gt-btn gt-btn-secondary">Ir al perfil del socio</Link>
            <button className="gt-btn gt-btn-secondary" onClick={a.reiniciar}>Asignar otra</button>
          </div>
        </div>
      )}

      {!a.asignada && (
        <>
          {/* ── 1. Socio ── */}
          <div className="gt-card">
            <p className="gt-card-title">1. ¿Para qué socio?</p>
            {a.socio ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.socio.nombre} {a.socio.apellido}</span>
                  <span className="gt-text-muted gt-text-sm">DNI {a.socio.dni}</span>
                  <span className="gt-text-muted gt-text-sm">· {a.rutinasDelSocio.length} {a.rutinasDelSocio.length === 1 ? 'rutina asignada' : 'rutinas asignadas'}</span>
                  <button className="gt-btn gt-btn-secondary" style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px' }}
                    onClick={() => { a.setSocio(null); a.setModo(null) }}>Cambiar</button>
                </div>
                {a.observaciones && (
                  <div className="gt-alert gt-alert-warning" style={{ marginTop: 10, marginBottom: 0 }}>
                    <strong>⚠ Tené en cuenta antes de asignar:</strong>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{a.observaciones}</p>
                  </div>
                )}
              </>
            ) : (
              <div style={{ maxWidth: 480 }}>
                <input className="gt-input" placeholder="Buscá por nombre, apellido o DNI…" autoFocus
                  value={a.busquedaSocio} onChange={e => a.setBusquedaSocio(e.target.value)} />
                {a.sociosFiltrados.map(s => (
                  <button key={s.id} type="button" className="gt-option" onClick={() => a.elegirSocio(s)}
                    style={{ width: '100%', marginTop: 6, display: 'flex', gap: 10 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.nombre} {s.apellido}</span>
                    <span className="gt-text-muted gt-text-sm" style={{ marginLeft: 'auto' }}>DNI {s.dni}</span>
                  </button>
                ))}
                {a.busquedaSocio && a.sociosFiltrados.length === 0 && <p className="gt-hint">Sin resultados.</p>}
              </div>
            )}
          </div>

          {/* ── 2. Modo ── */}
          {a.socio && (
            <div className="gt-card">
              <p className="gt-card-title">2. ¿Cómo querés armarla?</p>
              <div className="gt-choice-grid">
                <button type="button" className={`gt-choice${a.modo === 'plantilla' ? ' selected' : ''}`} onClick={() => a.elegirModo('plantilla')}>
                  <p className="gt-choice-icon">📋</p>
                  <p className="gt-choice-title">Usar una plantilla</p>
                  <p className="gt-choice-desc">
                    Lo más rápido. Elegís una rutina modelo ({a.plantillas.length} disponibles), se copia al socio y después la ajustás si hace falta.
                  </p>
                </button>
                <button type="button" className="gt-choice" onClick={() => a.elegirModo('personalizada')}>
                  <p className="gt-choice-icon">✏️</p>
                  <p className="gt-choice-title">Crear personalizada</p>
                  <p className="gt-choice-desc">
                    Armás la rutina a medida: días, ejercicios del catálogo, series y repeticiones. Ideal si tiene lesiones u objetivos específicos.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* ── 3. Plantilla ── */}
          {a.socio && a.modo === 'plantilla' && (
            <div className="gt-card">
              <p className="gt-card-title">3. Elegí la plantilla</p>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                <input className="gt-input" style={{ maxWidth: 280 }} placeholder="Buscar plantilla…"
                  value={a.busqueda} onChange={e => a.setBusqueda(e.target.value)} />
                <button type="button" className={`gt-option${!a.filtroTren ? ' selected' : ''}`} style={{ padding: '4px 12px' }}
                  onClick={() => a.setFiltroTren('')}>Todas</button>
                {Object.entries(TREN_CONFIG).map(([id, cfg]) => (
                  <button key={id} type="button" className={`gt-option${a.filtroTren === id ? ' selected' : ''}`} style={{ padding: '4px 12px' }}
                    onClick={() => a.setFiltroTren(a.filtroTren === id ? '' : id)}>{cfg.emoji} {cfg.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                <span className="gt-text-muted gt-text-sm">Objetivo:</span>
                {Object.entries(OBJETIVO_CONFIG).map(([id, cfg]) => (
                  <button key={id} type="button" className={`gt-option${a.filtroObjetivo === id ? ' selected' : ''}`} style={{ padding: '4px 12px' }}
                    onClick={() => a.setFiltroObjetivo(a.filtroObjetivo === id ? '' : id)}>{cfg.emoji} {cfg.label}</button>
                ))}
                {a.nivelRecomendado && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
                    <input type="checkbox" checked={a.soloSuNivel} onChange={e => a.setSoloSuNivel(e.target.checked)} />
                    Solo nivel {DIFICULTAD_CONFIG[a.nivelRecomendado]?.label.toLowerCase()} (según su ficha)
                  </label>
                )}
              </div>

              {a.cargandoPlantillas ? <p className="gt-text-muted">Cargando plantillas…</p>
                : a.plantillas.length === 0 ? (
                  <div className="gt-empty">
                    <p>Todavía no hay plantillas.</p>
                    <Link to="/rutinas/nueva?general=true" className="gt-btn gt-btn-primary" style={{ marginTop: 8 }}>Crear la primera plantilla</Link>
                  </div>
                ) : a.plantillasFiltradas.length === 0 ? <p className="gt-text-muted">Ninguna plantilla coincide con el filtro.</p>
                : (
                  <div className="gt-rutina-grid">
                    {a.plantillasFiltradas.map(p => (
                      <RutinaCard key={p.id} rutina={p}
                        seleccionada={a.plantillaSel?.id === p.id}
                        onSeleccionar={() => a.setPlantillaSel(p)}
                        acciones={
                          <button type="button" onClick={() => a.setPlantillaSel(p)}>
                            {a.plantillaSel?.id === p.id ? '✓ Elegida' : 'Elegir'}
                          </button>
                        } />
                    ))}
                  </div>
                )}

              {a.plantillaSel && (
                <div style={{ marginTop: 18, padding: 16, borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                  <label className="gt-label">Nombre de la rutina para {a.socio.nombre}</label>
                  <input className="gt-input" style={{ maxWidth: 420 }} value={a.nombre} onChange={e => a.setNombre(e.target.value)} />
                  <p className="gt-hint">Se crea una copia de "{a.plantillaSel.nombre}" para este socio. La plantilla original no cambia.</p>
                  <button className="gt-btn gt-btn-primary" style={{ marginTop: 12 }} onClick={a.asignar} disabled={a.asignando || !a.nombre.trim()}>
                    {a.asignando ? 'Asignando…' : `Asignar a ${a.socio.nombre}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
