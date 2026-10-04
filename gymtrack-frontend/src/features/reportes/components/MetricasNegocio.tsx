import { useEffect, useState } from 'react'
import { getMetricas, type Metricas } from '../services/reporteService'

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

/** Indicadores del negocio: retención, ingreso por socio y ocupación */
export default function MetricasNegocio() {
  const [m, setM] = useState<Metricas | null>(null)
  useEffect(() => { getMetricas().then(setM).catch(() => {}) }, [])
  if (!m) return null

  // Último mes con base para medir retención (el mes en curso puede estar incompleto)
  const conBase = m.meses.filter(x => x.porcentaje != null)
  const ultimoCompleto = conBase.length > 1 ? conBase[conBase.length - 2] : conBase[conBase.length - 1]

  return (
    <>
      <div className="gt-hoy-stats">
        <div className="gt-stat-card">
          <div className="gt-stat-number">{m.sociosVigentes}</div>
          <div className="gt-stat-label">socios con membresía vigente</div>
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number" style={{ fontSize: 26 }}>{pesos(m.ingresoPromedioPorSocio)}</div>
          <div className="gt-stat-label">ingreso promedio por socio (este mes)</div>
        </div>
        <div className="gt-stat-card">
          <div className="gt-stat-number">{ultimoCompleto?.porcentaje != null ? `${ultimoCompleto.porcentaje}%` : '—'}</div>
          <div className="gt-stat-label">
            retención {ultimoCompleto ? `en ${fmtMes(ultimoCompleto.mes)}` : ''}
            <span style={{ display: 'block', fontSize: 11 }}>de los que pagaron el mes anterior, cuántos renovaron</span>
          </div>
        </div>
      </div>

      <div className="gt-hoy-grid" style={{ marginBottom: 20 }}>
        <div className="gt-card">
          <p className="gt-card-title" style={{ marginTop: 0 }}>Retención y altas por mes</p>
          <div className="gt-table-wrap">
            <table className="gt-table">
              <thead><tr><th>Mes</th><th>Renovaron</th><th style={{ width: '40%' }}>Retención</th><th>Nuevos</th></tr></thead>
              <tbody>
                {m.meses.map(x => (
                  <tr key={x.mes}>
                    <td className="gt-fw-600">{fmtMes(x.mes)}</td>
                    <td>{x.base ? `${x.retenidos} de ${x.base}` : '—'}</td>
                    <td>
                      {x.porcentaje != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="gt-barra-pct"><div style={{ width: `${x.porcentaje}%` }} /></div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: 36 }}>{x.porcentaje}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>{x.nuevos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gt-text-muted gt-text-sm" style={{ margin: '8px 0 0' }}>El mes en curso se completa a medida que la gente renueva.</p>
        </div>

        <div className="gt-card">
          <p className="gt-card-title" style={{ marginTop: 0 }}>Ocupación por horario</p>
          <MapaOcupacion m={m} />
        </div>
      </div>
    </>
  )
}
