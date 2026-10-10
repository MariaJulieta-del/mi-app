import type { ReactNode } from 'react'
import type { IngresoMes } from '../hooks/useReportes'
import { useGlobo } from '../../../shared/hooks/useGlobo'

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`

/** Barra horizontal de progreso; con `globo` muestra el detalle al pasar el mouse */
export function Barra({ valor, max, color, globo }: { valor: number; max: number; color: string; globo?: ReactNode }) {
  const g = useGlobo()
  const pct = max === 0 ? 0 : Math.round((valor / max) * 100)
  return (
    <div className="gt-barra-hover" style={{ background: 'var(--border)', borderRadius: 4, height: 8, overflow: 'hidden' }}
      {...(globo ? { ...g.props(globo), tabIndex: 0 } : {})}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      {g.globo}
    </div>
  )
}

/** Barra de porcentaje fina (retención, público) con globo de detalle */
export function BarraPct({ pct, globo }: { pct: number; globo: ReactNode }) {
  const g = useGlobo()
  return (
    <div className="gt-barra-pct gt-barra-hover" tabIndex={0} {...g.props(globo)}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      {g.globo}
    </div>
  )
}

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGOS = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function BarChart({ data }: { data: IngresoMes[] }) {
  const g = useGlobo()
  if (data.length === 0) return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>Sin datos de ingresos</div>
  const max = Math.max(...data.map(d => d.total), 1)
  const W = 560, H = 160, PAD = { left: 64, right: 12, top: 14, bottom: 30 }
  const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom
  const barW = Math.min(40, (chartW / data.length) - 8)
  const gap = chartW / data.length
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => ({ p, val: max * p }))
  const fmtMes = (s: string) => { const [y, m] = s.split('-'); return `${MESES[parseInt(m)]} ${y.slice(2)}` }
  const fmtMesLargo = (s: string) => { const [y, m] = s.split('-'); return `${MESES_LARGOS[parseInt(m)]} ${y}` }
  const fmtMoney = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
  const total = data.reduce((a, d) => a + d.total, 0)
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }} role="img" aria-label="Ingresos por mes">
        {yTicks.map(({ p, val }) => { const y = PAD.top + chartH - p * chartH; return (
          <g key={p}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray={p === 0 ? 'none' : '3,3'} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="var(--text-muted)">{fmtMoney(val)}</text>
          </g>
        ) })}
        {data.map((d, i) => {
          const x = PAD.left + i * gap + gap / 2 - barW / 2, barH = (d.total / max) * chartH, y = PAD.top + chartH - barH, isLast = i === data.length - 1
          const previo = i > 0 ? data[i - 1].total : null
          const variacion = previo ? Math.round(((d.total - previo) / previo) * 100) : null
          const detalle = (
            <>
              <strong>{fmtMesLargo(d.mes)}</strong>
              <span>{pesos(d.total)} cobrados</span>
              {variacion != null && <span className={variacion >= 0 ? 'sube' : 'baja'}>{variacion >= 0 ? '▲' : '▼'} {Math.abs(variacion)}% contra el mes anterior</span>}
              {total > 0 && <span>{Math.round((d.total / total) * 100)}% del período</span>}
              {isLast && <small>Mes en curso: se completa a medida que se cobra</small>}
            </>
          )
          return (
            <g key={d.mes} className="gt-svg-barra" tabIndex={0} {...g.props(detalle)}>
              {/* Zona de hover de toda la columna, así es fácil apuntar aunque la barra sea baja */}
              <rect x={PAD.left + i * gap} y={PAD.top} width={gap} height={chartH} fill="transparent" />
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={isLast ? 'var(--accent)' : 'var(--border)'} opacity={isLast ? 1 : 0.75} className="gt-svg-barra-rect" />
              {isLast && <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill="var(--accent)" fontWeight="600">{fmtMoney(d.total)}</text>}
              <text x={x + barW / 2} y={PAD.top + chartH + 16} textAnchor="middle" fontSize="9" fill={isLast ? 'var(--text-secondary)' : 'var(--text-muted)'} fontWeight={isLast ? '600' : '400'}>{fmtMes(d.mes)}</text>
            </g>
          )
        })}
      </svg>
      {g.globo}
    </>
  )
}

export interface SegmentoAnillo { valor: number; color: string; etiqueta: string; detalle?: string }

/** Anillo con leyenda; cada porción y cada fila de la leyenda muestran su detalle al pasar el mouse */
export function RingChart({ segmentos, centro = 'total' }: { segmentos: SegmentoAnillo[]; centro?: string }) {
  const g = useGlobo()
  const suma = segmentos.reduce((a, s) => a + s.valor, 0)
  const total = suma || 1
  const r = 44, cx = 56, cy = 56, stroke = 14, circumference = 2 * Math.PI * r
  // Cada porción empieza donde terminan las anteriores
  const arcs = segmentos.map((seg, i) => {
    const dash = (seg.valor / total) * circumference
    const offset = segmentos.slice(0, i).reduce((a, s) => a + (s.valor / total) * circumference, 0)
    return { ...seg, dash, offset, gap: circumference - dash }
  })
  const pct = (v: number) => Math.round((v / total) * 100)
  const globo = (s: SegmentoAnillo) => (
    <>
      <strong>{s.etiqueta}</strong>
      <span>{s.valor} de {suma} ({pct(s.valor)}%)</span>
      {s.detalle && <small>{s.detalle}</small>}
    </>
  )
  return (
    <div className="gt-anillo">
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }} role="img" aria-label={segmentos.map(s => `${s.etiqueta}: ${s.valor}`).join(', ')}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {arcs.filter(a => a.valor > 0).map(arc => (
          <circle key={arc.etiqueta} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={stroke} className="gt-anillo-porcion"
            strokeDasharray={`${arc.dash} ${arc.gap}`} strokeDashoffset={circumference / 4 - arc.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} {...g.props(globo(arc))} />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">{suma}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{centro}</text>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        {segmentos.map(s => (
          <div key={s.etiqueta} className="gt-anillo-fila" tabIndex={0} {...g.props(globo(s))}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{s.etiqueta}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.valor}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>({pct(s.valor)}%)</span>
          </div>
        ))}
      </div>
      {g.globo}
    </div>
  )
}
