import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerHoy, type Hoy } from '../services/seguimientoService'
import { formatFecha } from '../../../shared/utils/fechas'
import { useAuth } from '../../../shared/context/AuthContext'
import { clasesDeHoy, type ClaseHoy } from '../../disciplinas/services/disciplinaService'
import { colorDisciplina, minutos, textoCupo } from '../../disciplinas/utils/disciplinaUtils'

/**
 * Inicio del profesor: quién está entrenando ahora y a quién conviene atender.
 * Se actualiza sola cada 30 segundos.
 */
export default function HoyPage() {
  const { user } = useAuth()
  const [hoy, setHoy] = useState<Hoy | null>(null)
  const [error, setError] = useState(false)
  const [clases, setClases] = useState<ClaseHoy[]>([])
  const minutosDeAhora = () => new Date().getHours() * 60 + new Date().getMinutes()
  const [ahoraMin, setAhoraMin] = useState(minutosDeAhora)

  useEffect(() => {
    const cargar = () => {
      obtenerHoy().then(h => { setHoy(h); setError(false) }).catch(() => setError(true))
      clasesDeHoy().then(setClases).catch(() => {})
    }
    cargar()
    const id = setInterval(() => { cargar(); setAhoraMin(minutosDeAhora()) }, 30000)
    return () => clearInterval(id)
  }, [])

  const f = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const fecha = f.charAt(0).toUpperCase() + f.slice(1)

  return (
    <>
      <div className="gt-section-header" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Hoy en el gimnasio</h1>
          <p className="gt-text-muted" style={{ margin: '2px 0 0' }}>{fecha}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/rutinas/asignar" className="gt-btn gt-btn-primary">+ Asignar rutina</Link>
          <Link to="/qr-ingreso" className="gt-btn gt-btn-secondary">📱 QR de ingreso</Link>
        </div>
      </div>

      {error && <div className="gt-alert gt-alert-error">No se pudo cargar la información de hoy.</div>}
      {!hoy && !error && <p className="gt-text-muted">Cargando…</p>}

      {hoy && (
        <>
          <div className="gt-hoy-stats">
            <div className="gt-stat-card">
              <div className="gt-stat-number">{hoy.ingresosHoy}</div>
              <div className="gt-stat-label">{hoy.ingresosHoy === 1 ? 'socio entrenó hoy' : 'socios entrenaron hoy'}</div>
            </div>
            <div className="gt-stat-card">
              <div className="gt-stat-number">{hoy.renovarRutina.length}</div>
              <div className="gt-stat-label">para atender (rutina)</div>
            </div>
            {hoy.denegadosHoy > 0 && (
              <Link to="/acceso" className="gt-stat-card" style={{ textDecoration: 'none' }}>
                <div className="gt-stat-number" style={{ color: 'var(--red)' }}>{hoy.denegadosHoy}</div>
                <div className="gt-stat-label">🚫 ingresos denegados</div>
              </Link>
            )}
          </div>

          {clases.length > 0 && (
            <div className="gt-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="gt-card-title" style={{ margin: 0 }}>Clases de hoy</p>
                <Link to="/disciplinas" className="gt-text-sm">Calendario</Link>
              </div>
              <div className="gt-clases-hoy">
                {clases.map((c, i) => {
                  const enCurso = ahoraMin >= minutos(c.horaInicio) && ahoraMin < minutos(c.horaFin)
                  const termino = ahoraMin >= minutos(c.horaFin)
                  return (
                    <div key={`${c.disciplinaId}-${i}`} className={`gt-disc-fila${termino ? ' pasada' : ''}`} style={{ ['--c' as string]: colorDisciplina(c.color) }}>
                      <span className="gt-agenda-hora">{c.horaInicio}<small>{c.horaFin}</small></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{c.nombre}</strong>
                        {enCurso && <span className="gt-badge gt-badge-green" style={{ marginLeft: 6 }}>En curso</span>}
                        {c.instructor && <div className="gt-text-sm gt-text-muted">{c.instructor}</div>}
                      </div>
                      <span className="gt-text-sm" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{textoCupo(c.inscriptos, c.cupoMaximo)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="gt-hoy-grid">
            {/* ── Entrenando hoy ── */}
            <div className="gt-card">
              <p className="gt-card-title" style={{ marginTop: 0 }}>Entrenaron hoy</p>
              {hoy.entrenando.length === 0 ? (
                <div className="gt-empty">Todavía no ingresó nadie hoy.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {hoy.entrenando.map(s => (
                    <div key={s.socioId} className="gt-hoy-socio">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <Link to={`/socios/${s.socioId}/perfil`} style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {s.nombre}
                        </Link>
                        <span className="gt-text-muted gt-text-sm" style={{ fontFamily: 'monospace' }}>{String(s.hora).slice(0, 5)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, alignItems: 'center' }}>
                        {s.rutina ? (
                          <Link to={`/rutinas/${s.rutina.id}?socioId=${s.socioId}`} className="gt-chip" style={{ background: 'var(--accent-light)', color: 'var(--accent)', textDecoration: 'none' }}>
                            📋 {s.rutina.nombre}{s.rutina.semanas >= hoy.semanasRenovar ? ` · ${s.rutina.semanas} sem.` : ''}
                          </Link>
                        ) : (
                          <Link to={`/rutinas/asignar?socioId=${s.socioId}`} className="gt-chip" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow-text)', textDecoration: 'none' }}>
                            Sin rutina · asignar →
                          </Link>
                        )}
                        {s.diasParaVencer != null && s.diasParaVencer <= 5 && s.diasParaVencer >= 0 && (
                          <span className="gt-chip" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow-text)' }}>
                            ⏳ Vence {s.diasParaVencer === 0 ? 'hoy' : `en ${s.diasParaVencer} d`}
                          </span>
                        )}
                      </div>
                      {s.alertaMedica && (
                        <p className="gt-text-sm" style={{ margin: '6px 0 0', color: 'var(--red-text)' }}>
                          ⚠ {s.alertaMedica}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── A quién atender ── */}
            <div className="gt-card">
              <p className="gt-card-title" style={{ marginTop: 0 }}>Para atender</p>
              <p className="gt-text-muted gt-text-sm" style={{ margin: '-6px 0 12px' }}>
                Socios que vinieron en las últimas 2 semanas sin rutina o con una de más de {hoy.semanasRenovar} semanas.
              </p>
              {hoy.renovarRutina.length === 0 ? (
                <div className="gt-empty">Todos tienen una rutina al día 👌</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {hoy.renovarRutina.slice(0, 15).map(s => (
                    <div key={s.socioId} className="gt-hoy-fila">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/socios/${s.socioId}/perfil`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{s.nombre}</Link>
                        <div className="gt-text-sm gt-text-muted">
                          {s.motivo === 'SIN_RUTINA' ? 'Sin rutina' : `Rutina de hace ${s.semanas} semanas`} · vino el {formatFecha(s.ultimaVisita)}
                        </div>
                      </div>
                      <Link to={`/rutinas/asignar?socioId=${s.socioId}`} className="gt-btn gt-btn-secondary gt-btn-sm">
                        {s.motivo === 'SIN_RUTINA' ? 'Asignar' : 'Renovar'}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {user?.rol === 'ADMIN' && (
            <p className="gt-text-muted gt-text-sm" style={{ marginTop: 16 }}>
              Los números del negocio están en <Link to="/">Inicio</Link> y <Link to="/reportes">Reportes</Link>.
            </p>
          )}
        </>
      )}
    </>
  )
}
