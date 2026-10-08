import type { IngresoMes } from '../hooks/useReportes'

export function Barra({ valor, max, color }: { valor: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((valor / max) * 100)
  return (
    <div style={{ background: 'var(--border)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

export function BarChart({ data }: { data: IngresoMes[] }) {
  if (data.length === 0) return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>Sin datos de ingresos</div>
  const max = Math.max(...data.map(d => d.total), 1)
  const W = 560, H = 160, PAD = { left: 64, right: 12, top: 14, bottom: 30 }
  const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom
  const barW = Math.min(40, (chartW / data.length) - 8)
  const gap = chartW / data.length
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => ({ p, val: max * p }))
  const fmtMes = (s: string) => { const [y,m]=s.split('-'); const ms=['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']; return `${ms[parseInt(m)]} ${y.slice(2)}` }
  const fmtMoney = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n/1000)}k` : `$${n}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
      {yTicks.map(({ p, val }) => { const y=PAD.top+chartH-p*chartH; return (
        <g key={p}>
          <line x1={PAD.left} y1={y} x2={PAD.left+chartW} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray={p===0?'none':'3,3'} />
          <text x={PAD.left-6} y={y+4} textAnchor="end" fontSize="9" fill="var(--text-muted)">{fmtMoney(val)}</text>
        </g>
      )})}
      {data.map((d, i) => {
        const x=PAD.left+i*gap+gap/2-barW/2, barH=(d.total/max)*chartH, y=PAD.top+chartH-barH, isLast=i===data.length-1
        return (
          <g key={d.mes}>
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill={isLast?'var(--accent)':'var(--border)'} opacity={isLast?1:0.75} />
            {isLast && <text x={x+barW/2} y={y-5} textAnchor="middle" fontSize="9" fill="var(--accent)" fontWeight="600">{fmtMoney(d.total)}</text>}
            <text x={x+barW/2} y={PAD.top+chartH+16} textAnchor="middle" fontSize="9" fill={isLast?'var(--text-secondary)':'var(--text-muted)'} fontWeight={isLast?'600':'400'}>{fmtMes(d.mes)}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function RingChart({ activas, vencidas }: { activas: number; vencidas: number }) {
  const total = activas + vencidas || 1
  const r = 44, cx = 56, cy = 56, stroke = 14, circumference = 2 * Math.PI * r
  const segments = [
    { val: activas,    color: 'var(--green-text)', label: 'Activas' },
    { val: vencidas,   color: 'var(--red)', label: 'Vencidas' },
  ]
  let offset = 0
  const arcs = segments.map(seg => {
    const frac = seg.val / total, dash = frac * circumference
    const arc = { ...seg, dash, offset, gap: circumference - dash }; offset += dash; return arc
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={arc.color} strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${arc.gap}`} strokeDashoffset={circumference/4 - arc.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
        ))}
        <text x={cx} y={cy-5} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize="9" fill="var(--text-muted)">total</text>
      </svg>
      <div style={{ flex: 1 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.val}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({Math.round(s.val/total*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

