import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { obtenerProgreso, type Progreso, type EjercicioProgreso } from '../services/seguimientoService'
import { formatFecha } from '../../../shared/utils/fechas'
import { useGlobo } from '../../../shared/hooks/useGlobo'

const fmtKg = (n: number | null | undefined) => (n == null ? '—' : `${Number(n).toLocaleString('es-AR')} kg`)
const fechaCorta = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${Number(d)}/${Number(m)}`
}
const POR_DEFECTO = 6

/**
 * Días entrenados por semana (últimas 12). Barras en HTML para que tengan siempre la misma altura
 * y el texto no se agrande con el ancho de la pantalla. Si se sabe cuántos días por semana tiene su rutina,
 * se marca como objetivo.
 */
function BarrasSemanas({ semanas, objetivo }: { semanas: Progreso['semanas']; objetivo: number | null }) {
  const g = useGlobo()
  const max = Math.max(objetivo ?? 0, 3, ...semanas.map(s => s.dias))
  const conDatos = semanas.slice(0, -1)   // la semana en curso todavía no terminó
  const promedio = conDatos.length ? conDatos.reduce((a, s) => a + s.dias, 0) / conDatos.length : 0
  const cumplidas = objetivo ? conDatos.filter(s => s.dias >= objetivo).length : null

  return (
    <div className="gt-semanas">
      <div className="gt-semanas-resumen">
        <span><strong>{promedio.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</strong> días por semana en promedio</span>
        {objetivo != null && cumplidas != null && (
          <span>Cumplió su rutina ({objetivo} {objetivo === 1 ? 'día' : 'días'}) en <strong>{cumplidas} de {conDatos.length}</strong> semanas</span>
        )}
      </div>
      <div className="gt-semanas-grafico" role="img" aria-label={`Días de entrenamiento por semana: ${semanas.map(s => s.dias).join(', ')}`}>
        {objetivo != null && (
          <div className="gt-semanas-objetivo" style={{ bottom: `${(objetivo / max) * 100}%` }}>
            <span>objetivo</span>
          </div>
        )}
        {semanas.map((s, i) => {
          const actual = i === semanas.length - 1
          const ok = objetivo != null && s.dias >= objetivo
          return (
            <div key={s.inicio} className={`gt-semana${actual ? ' actual' : ''}${ok ? ' ok' : ''}`} tabIndex={0}
              {...g.props(<>
                <strong>{actual ? 'Esta semana' : `Semana del ${fechaCorta(s.inicio)}`}</strong>
                <span>{s.dias} {s.dias === 1 ? 'día entrenado' : 'días entrenados'}</span>
                {objetivo != null && !actual && <small>{ok ? 'Cumplió el objetivo' : `Le faltaron ${objetivo - s.dias}`}</small>}
                {actual && <small>La semana todavía no terminó</small>}
              </>)}>
              <span className="gt-semana-valor">{s.dias > 0 ? s.dias : ''}</span>
              <span className="gt-semana-barra" style={{ height: `${(s.dias / max) * 100}%` }} />
            </div>
          )
        })}
      </div>
      <div className="gt-semanas-ejes" aria-hidden>
        {semanas.map((s, i) => (
          <span key={s.inicio}>{i === semanas.length - 1 ? 'Hoy' : i % 2 === 0 ? fechaCorta(s.inicio) : ''}</span>
        ))}
      </div>
      {g.globo}
    </div>
  )
}

/** Evolución de la carga de un ejercicio: línea con un punto por registro, pesos y fechas de referencia */
function LineaCarga({ e }: { e: EjercicioProgreso }) {
  const g = useGlobo()
  const pts = e.registros.filter(r => r.pesoKg != null)
  if (pts.length < 2) {
    return <p className="gt-text-muted gt-text-sm" style={{ margin: '8px 0 0' }}>
      {pts.length === 1 ? 'Un solo registro por ahora: con el próximo se ve la evolución.' : 'Sin pesos registrados.'}
    </p>
  }
  const pesos = pts.map(p => Number(p.pesoKg))
  const min = Math.min(...pesos), max = Math.max(...pesos)
  const rango = max - min || 1
  // Coordenadas en %: la línea se dibuja con un SVG estirado y los puntos en HTML (no se deforman)
  const x = (i: number) => (i / (pts.length - 1)) * 100
  const y = (v: number) => 90 - ((v - min) / rango) * 80
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(Number(p.pesoKg)).toFixed(2)}`).join(' ')
  const area = `${d} L100,100 L0,100 Z`

  return (
    <div className="gt-carga">
      <div className="gt-carga-escala" aria-hidden>
        <span>{fmtKg(max)}</span>
        <span>{fmtKg(min)}</span>
      </div>
      <div className="gt-carga-grafico" role="img" aria-label={`${e.ejercicio}: de ${fmtKg(e.pesoInicial)} a ${fmtKg(e.pesoActual)} en ${pts.length} registros`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path d={area} className="gt-carga-area" />
          <path d={d} className="gt-carga-linea" vectorEffect="non-scaling-stroke" />
        </svg>
        {pts.map((p, i) => (
          <span key={`${p.fecha}-${i}`} className={`gt-carga-punto${i === pts.length - 1 ? ' ultimo' : ''}`} tabIndex={0}
            style={{ left: `${x(i)}%`, top: `${y(Number(p.pesoKg))}%` }}
            {...g.props(<>
              <strong>{formatFecha(p.fecha)}</strong>
              <span>{fmtKg(p.pesoKg)}{p.repeticiones != null ? ` × ${p.repeticiones} reps` : ''}{p.series != null ? ` · ${p.series} series` : ''}</span>
              {i > 0 && pts[i - 1].pesoKg != null && Number(p.pesoKg) !== Number(pts[i - 1].pesoKg) && (
                <small>{Number(p.pesoKg) > Number(pts[i - 1].pesoKg) ? '▲ subió' : '▼ bajó'} {Math.abs(Number(p.pesoKg) - Number(pts[i - 1].pesoKg)).toLocaleString('es-AR')} kg</small>
              )}
            </>)} />
        ))}
      </div>
      <div className="gt-carga-fechas" aria-hidden>
        <span>{fechaCorta(pts[0].fecha)}</span>
        <span>{fechaCorta(pts[pts.length - 1].fecha)}</span>
      </div>
      {g.globo}
    </div>
  )
}

/**
 * Progreso de un socio. Lo ve el propio socio ("Mi progreso") y el staff en el perfil.
 * objetivoDias: días por semana de su rutina (si se sabe), para comparar.
 */
export default function ProgresoSocio({ socioId, titulo = 'Progreso', objetivoDias = null }: { socioId: number; titulo?: string; objetivoDias?: number | null }) {
  const [p, setP] = useState<Progreso | null>(null)
  const [error, setError] = useState(false)
  const [verTodos, setVerTodos] = useState(false)

  useEffect(() => {
    obtenerProgreso(socioId).then(setP).catch(() => setError(true))
  }, [socioId])

  if (error) return null
  if (!p) return <div className="gt-card"><p className="gt-text-muted" style={{ margin: 0 }}>Cargando progreso…</p></div>

  // Primero los ejercicios con más registros (los que de verdad muestran evolución)
  const ordenados = [...p.ejercicios].sort((a, b) => b.registros.length - a.registros.length)
  const ejercicios = verTodos ? ordenados : ordenados.slice(0, POR_DEFECTO)
  const sinActividad = p.semanas.every(s => s.dias === 0)

  return (
    <div className="gt-card">
      <p className="gt-card-title" style={{ marginTop: 0 }}>{titulo}</p>

      <div className="gt-progreso-stats">
        <div><span className="gt-progreso-num">{p.rachaSemanas}</span><span className="gt-stat-label">{p.rachaSemanas === 1 ? 'semana seguida' : 'semanas seguidas'} entrenando</span></div>
        <div><span className="gt-progreso-num">{p.diasEsteMes}</span><span className="gt-stat-label">días este mes</span></div>
        <div><span className="gt-progreso-num">{p.sesionesRegistradas}</span><span className="gt-stat-label">entrenamientos registrados</span></div>
      </div>

      <p className="gt-subtitulo" style={{ margin: '18px 0 8px' }}>Días por semana · últimas {p.semanas.length} semanas</p>
      {sinActividad
        ? <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>No registró ingresos ni entrenamientos en las últimas {p.semanas.length} semanas.</p>
        : <BarrasSemanas semanas={p.semanas} objetivo={objetivoDias && objetivoDias > 0 ? objetivoDias : null} />}

      <p className="gt-subtitulo" style={{ margin: '20px 0 8px' }}>Cargas por ejercicio</p>
      {p.ejercicios.length === 0 ? (
        <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>
          Todavía no hay cargas registradas. Se registran desde la rutina o en el modo entrenamiento.
        </p>
      ) : (
        <>
          <div className="gt-progreso-grid">
            {ejercicios.map(e => {
              const dif = e.pesoInicial != null && e.pesoActual != null ? Number(e.pesoActual) - Number(e.pesoInicial) : null
              const pct = dif != null && e.pesoInicial ? Math.round((dif / Number(e.pesoInicial)) * 100) : null
              const desde = e.registros[0]?.fecha
              return (
                <div key={e.ejercicio} className="gt-progreso-ej">
                  <div className="gt-progreso-ej-cab">
                    <strong>{e.ejercicio}</strong>
                    <span className="gt-progreso-ej-peso">{fmtKg(e.pesoActual)}</span>
                  </div>
                  <div className="gt-progreso-ej-dif">
                    {dif != null && dif !== 0 ? (
                      <span className={dif > 0 ? 'sube' : 'baja'}>
                        {dif > 0 ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}
                        {dif > 0 ? '+' : ''}{dif.toLocaleString('es-AR')} kg{pct ? ` (${pct > 0 ? '+' : ''}${pct}%)` : ''}
                      </span>
                    ) : <span>Sin cambios</span>}
                    {desde && <span className="gt-text-muted"> desde el {formatFecha(desde)} · {e.registros.length} {e.registros.length === 1 ? 'registro' : 'registros'}</span>}
                  </div>
                  <LineaCarga e={e} />
                  {e.pesoMaximo != null && Number(e.pesoMaximo) > Number(e.pesoActual ?? 0) && (
                    <small className="gt-text-muted">Su máximo fue {fmtKg(e.pesoMaximo)}</small>
                  )}
                </div>
              )
            })}
          </div>
          {p.ejercicios.length > POR_DEFECTO && (
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 10 }} onClick={() => setVerTodos(v => !v)}>
              {verTodos ? 'Ver menos' : `Ver los ${p.ejercicios.length} ejercicios`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
