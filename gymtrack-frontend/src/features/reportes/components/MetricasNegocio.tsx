import { useEffect, useState } from 'react'
import { getMetricas, type Metricas } from '../services/reporteService'
import FuenteDatos from './FuenteDatos'
import { BarraPct } from './Graficos'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fmtMes = (ym: string) => { const [y, m] = ym.split('-'); return `${MESES[Number(m) - 1]} ${y.slice(2)}` }
const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`

/** Mapa de calor: promedio de ingresos por día y hora. Una sola escala (claro → oscuro). */
function MapaOcupacion({ m }: { m: Metricas }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null)
  const max = Math.max(0, ...m.ocupacion.flat())
  if (max === 0) return <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>Todavía no hay ingresos suficientes para mostrar la ocupación.</p>

  // Solo las horas en que hubo movimiento
  const horasConDatos = Array.from({ length: 24 }, (_, h) => h).filter(h => m.ocupacion.some(f => f[h] > 0))
  const desde = Math.min(...horasConDatos), hasta = Math.max(...horasConDatos)
  const horas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
  // 5 escalones de un mismo tono
  const nivel = (v: number) => (v === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)))

  let pico = { d: 0, h: 0, v: 0 }
  m.ocupacion.forEach((f, d) => f.forEach((v, h) => { if (v > pico.v) pico = { d, h, v } }))

  return (
    <div>
      <p className="gt-text-sm" style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>
        Horario pico: <strong>{DIAS[pico.d]} {pico.h}:00</strong> con ~{pico.v.toLocaleString('es-AR')} ingresos promedio.
      </p>
      <div className="gt-heatmap" style={{ gridTemplateColumns: `36px repeat(${horas.length}, minmax(18px, 1fr))` }}
        onMouseLeave={() => setHover(null)} role="table" aria-label="Ingresos promedio por día y hora">
        <span />
        {horas.map(h => <span key={h} className="gt-heatmap-h">{h % 2 === 0 ? h : ''}</span>)}
        {DIAS.map((dia, d) => (
          <div key={dia} style={{ display: 'contents' }} role="row">
            <span className="gt-heatmap-d">{dia}</span>
            {horas.map(h => {
              const v = m.ocupacion[d][h]
              return (
                <span key={h} role="cell" className={`gt-heatmap-c n${nivel(v)}${hover?.d === d && hover?.h === h ? ' activo' : ''}`}
                  onMouseEnter={() => setHover({ d, h })}
                  aria-label={`${dia} ${h}:00, ${v} ingresos promedio`} />
              )
            })}
          </div>
        ))}
      </div>
      <p className="gt-text-muted gt-text-sm" style={{ margin: '8px 0 0', minHeight: 18 }}>
        {hover
          ? <>{DIAS[hover.d]} {hover.h}:00–{hover.h + 1}:00 · <strong style={{ color: 'var(--text-primary)' }}>{m.ocupacion[hover.d][hover.h].toLocaleString('es-AR')}</strong> ingresos promedio por semana</>
          : `Promedio de las últimas ${m.semanasOcupacion} semanas. Más oscuro = más gente.`}
      </p>
    </div>
  )
}

function useMetricas() {
  const [m, setM] = useState<Metricas | null>(null)
  useEffect(() => { getMetricas().then(setM).catch(() => {}) }, [])
  return m
}

/** Retención mes a mes: de los que pagaron el mes anterior, cuántos renovaron, y cuántos nuevos entraron */
export function RetencionMensual() {
  const m = useMetricas()
  if (!m) return null

  // Último mes con base para medir retención (el mes en curso puede estar incompleto)
  const conBase = m.meses.filter(x => x.porcentaje != null)
  const ultimoCompleto = conBase.length > 1 ? conBase[conBase.length - 2] : conBase[conBase.length - 1]

  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <div className="gt-card-cabecera">
        <p className="gt-card-title" style={{ margin: 0 }}>Retención y altas por mes</p>
        {ultimoCompleto?.porcentaje != null && (
          <span className="gt-text-sm gt-text-muted"><strong className="gt-numero-destacado">{ultimoCompleto.porcentaje}%</strong> renovó en {fmtMes(ultimoCompleto.mes)}</span>
        )}
      </div>
      <div className="gt-table-wrap">
        <table className="gt-table">
          <thead><tr><th>Mes</th><th>Renovaron</th><th style={{ width: '40%' }}>Retención</th><th>Nuevos</th><th>Recaudado</th></tr></thead>
          <tbody>
            {m.meses.map(x => (
              <tr key={x.mes}>
                <td className="gt-fw-600">{fmtMes(x.mes)}</td>
                <td>{x.base ? `${x.retenidos} de ${x.base}` : '—'}</td>
                <td>
                  {x.porcentaje != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarraPct pct={x.porcentaje} globo={<>
                        <strong>{fmtMes(x.mes)}</strong>
                        <span>Renovaron {x.retenidos} de los {x.base} que pagaron el mes anterior ({x.porcentaje}%)</span>
                        <span>{x.base - x.retenidos} no renovaron · {x.nuevos} {x.nuevos === 1 ? 'socio nuevo' : 'socios nuevos'}</span>
                      </>} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 36 }}>{x.porcentaje}%</span>
                    </div>
                  ) : '—'}
                </td>
                <td>{x.nuevos}</td>
                <td>{pesos(Number(x.recaudado))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FuenteDatos>
        <li><b>Renovaron:</b> socios que tienen un pago completado en el mes anterior y también en ese mes (sale de Pagos).</li>
        <li><b>Nuevos:</b> socios cuyo primer pago fue en ese mes.</li>
        <li>El mes en curso se completa a medida que la gente renueva.</li>
      </FuenteDatos>
    </div>
  )
}

/** Ocupación por día y hora (mapa de calor) */
export function OcupacionHoraria() {
  const m = useMetricas()
  if (!m) return null
  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <p className="gt-card-title" style={{ marginTop: 0 }}>Ocupación por día y horario</p>
      <MapaOcupacion m={m} />
      <FuenteDatos>
        <li>Sale de los ingresos registrados en recepción o con el QR (solo entradas permitidas), de las últimas {m.semanasOcupacion} semanas.</li>
        <li>Cada casillero es el promedio de ingresos de ese día de la semana en esa hora.</li>
      </FuenteDatos>
    </div>
  )
}
