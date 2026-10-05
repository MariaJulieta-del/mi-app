import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { asistenciaDisciplina, type AsistenciaClase as Datos, type Sesion } from '../services/disciplinaService'
import { DIAS_CORTO } from '../utils/disciplinaUtils'

const fechaCorta = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(d)}/${Number(m)}` }

function FilaSesion({ s }: { s: Sesion }) {
  const [abierta, setAbierta] = useState(false)
  const pct = s.esperados ? Math.round((s.presentes.length / s.esperados) * 100) : 0
  return (
    <div className="gt-sesion">
      <button type="button" className="gt-sesion-cab" onClick={() => setAbierta(a => !a)} aria-expanded={abierta} disabled={s.estado === 'PROXIMA'}>
        <span className="gt-sesion-fecha">
          <strong>{DIAS_CORTO[s.dia]} {fechaCorta(s.fecha)}</strong>
          <small>{s.horaInicio}–{s.horaFin}</small>
        </span>
        {s.estado === 'PROXIMA' ? (
          <span className="gt-text-sm gt-text-muted" style={{ flex: 1 }}>Más tarde hoy · {s.esperados} inscriptos</span>
        ) : (
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="gt-text-sm" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {s.presentes.length} de {s.esperados} vinieron
            </span>
            {s.estado === 'EN_CURSO' && <span className="gt-badge gt-badge-green" style={{ marginLeft: 6 }}>En curso</span>}
            <span className="gt-cupo-barra" style={{ display: 'block', marginTop: 4 }} aria-hidden>
              <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3 }} />
            </span>
          </span>
        )}
        {s.estado !== 'PROXIMA' && <span className="gt-text-muted" aria-hidden>{abierta ? '▴' : '▾'}</span>}
      </button>
      {abierta && (
        <div className="gt-sesion-detalle">
          {s.presentes.length === 0 ? <span className="gt-text-muted gt-text-sm">Nadie registró ingreso en este horario.</span>
            : s.presentes.map(p => (
              <Link key={p.socioId} to={`/socios/${p.socioId}/perfil`} className="gt-chip gt-chip-neutro" style={{ textDecoration: 'none' }}>
                ✓ {p.nombre} <span className="gt-text-muted" style={{ fontWeight: 400 }}>{p.hora}</span>
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}

/** Asistencia a la clase: por fecha y por alumno */
export default function AsistenciaClase({ disciplinaId }: { disciplinaId: number }) {
  const [semanas, setSemanas] = useState(4)
  const [datos, setDatos] = useState<{ para: number; d: Datos } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    asistenciaDisciplina(disciplinaId, semanas)
      .then(d => { setDatos({ para: semanas, d }); setError(false) })
      .catch(() => setError(true))
  }, [disciplinaId, semanas])

  if (error) return <div className="gt-alert gt-alert-error">No se pudo cargar la asistencia.</div>
  if (!datos || datos.para !== semanas) return <p className="gt-text-muted">Cargando asistencia…</p>
  const { d } = datos
  // Las clases de antes de que hubiera inscriptos no aportan nada
  const sesiones = d.sesiones.filter(s => s.esperados > 0 || s.estado === 'PROXIMA')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <p className="gt-text-muted gt-text-sm" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          Cuenta como presente quien ingresó al gimnasio (QR o recepción) desde {d.minutosAntes} min antes del inicio hasta el fin de la clase.
        </p>
        <select className="gt-select" style={{ width: 'auto' }} value={semanas} onChange={e => setSemanas(Number(e.target.value))} aria-label="Período">
          {[2, 4, 8].map(n => <option key={n} value={n}>Últimas {n} semanas</option>)}
        </select>
      </div>

      <p className="gt-stat-label" style={{ margin: '10px 0 6px' }}>Por clase</p>
      {sesiones.length === 0 ? <div className="gt-empty" style={{ padding: '14px 0' }}>No hubo clases con alumnos inscriptos en este período.</div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{sesiones.map(s => <FilaSesion key={`${s.fecha}-${s.horaInicio}`} s={s} />)}</div>}

      {d.alumnos.length > 0 && (
        <>
          <p className="gt-stat-label" style={{ margin: '16px 0 6px' }}>Por alumno <span style={{ fontWeight: 400, textTransform: 'none' }}>(los que menos vienen, primero)</span></p>
          <div className="gt-alumnos-lista">
            {d.alumnos.map(a => {
              const pct = a.sesiones ? Math.round((a.asistencias / a.sesiones) * 100) : null
              return (
                <div key={a.socioId} className="gt-hoy-fila">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/socios/${a.socioId}/perfil`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{a.nombre}</Link>
                    <div className="gt-text-sm gt-text-muted">{a.ultimaVez ? `Última vez: ${fechaCorta(a.ultimaVez)}` : 'No vino en este período'}</div>
                  </div>
                  <span className="gt-text-sm" style={{ whiteSpace: 'nowrap', fontWeight: 600, color: pct != null && pct < 50 ? 'var(--red-text)' : 'var(--text-secondary)' }}>
                    {a.sesiones ? `${a.asistencias} de ${a.sesiones}` : 'Sin clases aún'}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
