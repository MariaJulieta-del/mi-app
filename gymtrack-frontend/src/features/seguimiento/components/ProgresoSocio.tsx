import { useEffect, useState } from 'react'
import { obtenerProgreso, type Progreso, type EjercicioProgreso } from '../services/seguimientoService'
import { formatFecha } from '../../../shared/utils/fechas'

const fmtKg = (n: number | null | undefined) => (n == null ? '—' : `${Number(n).toLocaleString('es-AR')} kg`)
const fechaCorta = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${Number(d)}/${Number(m)}`
}

/** Asistencia por semana: 12 barras, una sola serie */
function BarrasSemanas({ semanas }: { semanas: Progreso['semanas'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(3, ...semanas.map(s => s.dias))
  const W = 300, H = 96, gap = 4, bw = (W - gap * (semanas.length - 1)) / semanas.length
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%" role="img"
        aria-label={`Días de entrenamiento por semana, últimas ${semanas.length} semanas`}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--border)" strokeWidth={1} />
        {semanas.map((s, i) => {
          const h = s.dias === 0 ? 0 : Math.max(4, (s.dias / max) * (H - 8))
          const x = i * (bw + gap)
          const actual = i === semanas.length - 1
          return (
            <g key={s.inicio} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* zona de hover más grande que la barra */}
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              {h > 0 && (
                <path d={`M${x},${H} v${-(h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${h - 4} z`}
                  fill="var(--accent)" opacity={hover === null || hover === i ? (actual ? 0.7 : 1) : 0.45} />
              )}
              {i % 3 === 2 || actual ? (
                <text x={x + bw / 2} y={H + 13} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
                  {actual ? 'Esta' : fechaCorta(s.inicio)}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="gt-chart-tip" style={{ left: `${((hover + 0.5) / semanas.length) * 100}%` }}>
          Semana del {fechaCorta(semanas[hover].inicio)}: <strong>{semanas[hover].dias} {semanas[hover].dias === 1 ? 'día' : 'días'}</strong>
        </div>
      )}
    </div>
  )
}

/** Evolución de la carga de un ejercicio: línea de 2px con puntos y tooltip */
function LineaCarga({ e }: { e: EjercicioProgreso }) {
  const [hover, setHover] = useState<number | null>(null)
  const pts = e.registros.filter(r => r.pesoKg != null)
  if (pts.length < 2) {
    return <p className="gt-text-muted gt-text-sm" style={{ margin: '6px 0 0' }}>
      {pts.length === 1 ? 'Un solo registro por ahora.' : 'Sin pesos registrados.'}
    </p>
  }
  const W = 260, H = 64, pad = 6
  const pesos = pts.map(p => Number(p.pesoKg))
  const min = Math.min(...pesos), max = Math.max(...pesos), rango = max - min || 1
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2)
  const y = (v: number) => H - pad - ((v - min) / rango) * (H - pad * 2)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(Number(p.pesoKg)).toFixed(1)}`).join(' ')
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
        aria-label={`${e.ejercicio}: de ${fmtKg(e.pesoInicial)} a ${fmtKg(e.pesoActual)}`}
        onMouseLeave={() => setHover(null)}>
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={p.fecha} onMouseEnter={() => setHover(i)}>
            <rect x={x(i) - W / pts.length / 2} y={0} width={W / pts.length} height={H} fill="transparent" />
            {(hover === i || i === pts.length - 1) && (
              <circle cx={x(i)} cy={y(Number(p.pesoKg))} r={4} fill="var(--accent)" stroke="var(--bg-surface)" strokeWidth={2} />
            )}
          </g>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="var(--border)" strokeWidth={1} />}
      </svg>
      {hover !== null && (
        <div className="gt-chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          {formatFecha(pts[hover].fecha)}: <strong>{fmtKg(pts[hover].pesoKg)}</strong>
          {pts[hover].repeticiones != null && ` × ${pts[hover].repeticiones}`}
        </div>
      )}
    </div>
  )
}

/**
 * Progreso de un socio. Lo ve el propio socio ("Mi progreso") y el profesor en el perfil.
 */
export default function ProgresoSocio({ socioId, titulo = 'Progreso' }: { socioId: number; titulo?: string }) {
  const [p, setP] = useState<Progreso | null>(null)
  const [error, setError] = useState(false)
  const [verTodos, setVerTodos] = useState(false)

  useEffect(() => {
    obtenerProgreso(socioId).then(setP).catch(() => setError(true))
  }, [socioId])

  if (error) return null
  if (!p) return <div className="gt-card"><p className="gt-text-muted" style={{ margin: 0 }}>Cargando progreso…</p></div>

  const ejercicios = verTodos ? p.ejercicios : p.ejercicios.slice(0, 6)

  return (
    <div className="gt-card">
      <p className="gt-card-title" style={{ marginTop: 0 }}>{titulo}</p>

      <div className="gt-progreso-stats">
        <div><span className="gt-progreso-num">{p.rachaSemanas}</span><span className="gt-stat-label">{p.rachaSemanas === 1 ? 'semana seguida' : 'semanas seguidas'} 🔥</span></div>
        <div><span className="gt-progreso-num">{p.diasEsteMes}</span><span className="gt-stat-label">días este mes</span></div>
        <div><span className="gt-progreso-num">{p.sesionesRegistradas}</span><span className="gt-stat-label">entrenamientos registrados</span></div>
      </div>

      <p className="gt-stat-label" style={{ margin: '16px 0 4px' }}>Días por semana</p>
      <BarrasSemanas semanas={p.semanas} />

      <p className="gt-stat-label" style={{ margin: '18px 0 8px' }}>Cargas por ejercicio</p>
      {p.ejercicios.length === 0 ? (
        <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>
          Todavía no hay cargas registradas. Se registran desde la rutina o en el modo entrenamiento.
        </p>
      ) : (
        <>
          <div className="gt-progreso-grid">
            {ejercicios.map(e => {
              const dif = e.pesoInicial != null && e.pesoActual != null ? Number(e.pesoActual) - Number(e.pesoInicial) : null
              return (
                <div key={e.ejercicio} className="gt-progreso-ej">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                    <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{e.ejercicio}</strong>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{fmtKg(e.pesoActual)}</span>
                  </div>
                  <div className="gt-text-sm gt-text-muted">
                    {dif != null && dif !== 0 && <span style={{ color: dif > 0 ? 'var(--green-text)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {dif > 0 ? '▲ +' : '▼ '}{dif.toLocaleString('es-AR')} kg </span>}
                    {e.pesoMaximo != null && `· máx. ${fmtKg(e.pesoMaximo)}`}
                    {e.ultimaVez && ` · ${formatFecha(e.ultimaVez)}`}
                  </div>
                  <LineaCarga e={e} />
                </div>
              )
            })}
          </div>
          {p.ejercicios.length > 6 && (
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 10 }} onClick={() => setVerTodos(v => !v)}>
              {verTodos ? 'Ver menos' : `Ver los ${p.ejercicios.length} ejercicios`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
