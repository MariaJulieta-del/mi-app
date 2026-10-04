import { useReportes, type IngresoMes, type EdadRango } from '../hooks/useReportes'
import MetricasNegocio from '../components/MetricasNegocio'

function Barra({ valor, max, color }: { valor: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((valor / max) * 100)
  return (
    <div style={{ background: 'var(--border)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  )
}

function BarChart({ data }: { data: IngresoMes[] }) {
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

function AgeChart({ data }: { data: EdadRango[] }) {
  if (data.length === 0) return <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>No hay socios con fecha de nacimiento cargada</div>
  const max = Math.max(...data.map(d => d.cantidad), 1)
  const total = data.reduce((s, d) => s + d.cantidad, 0)
  const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#818cf8','#c4b5fd','#4f46e5']
  const W = 520, H = 160, PAD = { left: 52, right: 12, top: 14, bottom: 30 }
  const chartW = W - PAD.left - PAD.right, chartH = H - PAD.top - PAD.bottom
  const barW = Math.min(48, (chartW / data.length) - 10), gap = chartW / data.length
  const yTicks = [0, 0.5, 1].map(p => ({ p, val: Math.round(max * p) }))
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
        {yTicks.map(({ p, val }) => { const y=PAD.top+chartH-p*chartH; return (
          <g key={p}>
            <line x1={PAD.left} y1={y} x2={PAD.left+chartW} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray={p===0?'none':'3,3'} />
            <text x={PAD.left-6} y={y+4} textAnchor="end" fontSize="9" fill="var(--text-muted)">{val}</text>
          </g>
        )})}
        {data.map((d, i) => {
          const x=PAD.left+i*gap+gap/2-barW/2, barH=(d.cantidad/max)*chartH, y=PAD.top+chartH-barH, color=COLORS[i%COLORS.length]
          return (
            <g key={d.rango}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} opacity="0.85" />
              <text x={x+barW/2} y={y-5} textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{d.cantidad}</text>
              <text x={x+barW/2} y={PAD.top+chartH+16} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontWeight="600">{d.rango}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={d.rango} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i%COLORS.length] }} />
            <span style={{ color: 'var(--text-secondary)' }}>{d.rango} años</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.cantidad}</span>
            <span style={{ color: 'var(--text-muted)' }}>({Math.round(d.cantidad/total*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RingChart({ activas, vencidas }: { activas: number; vencidas: number }) {
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

export default function ReportesPage() {
  const d = useReportes()
  const fmtARS = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const balanceNeto = d.totalIngresos - d.totalGastosMantenimiento

  return (
    <>
      <h1 className="gt-page-title">Reportes</h1>

      {/* ── Indicadores del negocio ── */}
      <MetricasNegocio />

      {/* ── Caja: ingresos vs gastos ── */}
      <div className="gt-card" style={{ marginBottom: 20, borderLeft: '4px solid var(--accent)' }}>
        <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 14 }}>💰 Caja — últimos {d.meses} meses</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: '12px 0', background: '#F0FDF4', borderRadius: 10, border: '1.5px solid #6EE7B7' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#15803D' }}>{fmtARS(d.totalIngresos)}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 3 }}>✅ Ingresos (pagos)</div>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 0', background: '#FEF2F2', borderRadius: 10, border: '1.5px solid #FECACA' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>{fmtARS(d.totalGastosMantenimiento)}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 3 }}>🔧 Gastos en máquinas</div>
          </div>
          <div style={{
            textAlign: 'center', padding: '12px 0', borderRadius: 10, border: `1.5px solid ${balanceNeto >= 0 ? '#6EE7B7' : '#FECACA'}`,
            background: balanceNeto >= 0 ? '#F0FDF4' : '#FEF2F2',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: balanceNeto >= 0 ? '#15803D' : '#DC2626' }}>{fmtARS(balanceNeto)}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 3 }}>
              {balanceNeto >= 0 ? '📈 Balance neto positivo' : '📉 Balance neto negativo'}
            </div>
          </div>
        </div>
        {d.gastosMantenimiento.length === 0 && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>No hay gastos de mantenimiento registrados aún.</p>
        )}
        {d.gastosPorMaquina.length > 0 && (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Gasto por máquina
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {d.gastosPorMaquina.map((maq, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ flex: 1, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {maq.nro ? <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>[{maq.nro}]</span> : null}
                    {maq.nombre}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{maq.reps} repar.</span>
                  <span style={{ fontWeight: 700, color: maq.costoTotal >= 50000 ? '#DC2626' : 'var(--text-primary)', minWidth: 90, textAlign: 'right' }}>
                    {fmtARS(maq.costoTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
        <div className="gt-card" style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p className="gt-card-title" style={{ margin: 0 }}>Ingresos últimos {d.meses} meses</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>${d.ingresos.reduce((s, i) => s + i.total, 0).toLocaleString('es-AR')}</span>
              <select className="gt-select" style={{ width: 'auto' }} value={d.meses} onChange={e => d.setMeses(Number(e.target.value))}>
                {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} meses</option>)}
              </select>
            </div>
          </div>
          <BarChart data={d.ingresos} />
        </div>
        {d.dashStats && (
          <div className="gt-card" style={{ minWidth: 240 }}>
            <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 16 }}>Estado de membresías</p>
            <RingChart activas={d.dashStats.membresiasActivas} vencidas={d.dashStats.membresiasVencidas} />
          </div>
        )}
      </div>

      <div className="gt-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="gt-card-title" style={{ margin: 0 }}>Distribución de edades de socios activos</p>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.edades.reduce((s, e) => s + e.cantidad, 0)} socios con fecha de nacimiento cargada</span>
        </div>
        <AgeChart data={d.edades} />
      </div>

      <div className="gt-card" style={{ marginBottom: 20 }}>
        <p className="gt-card-title" style={{ marginTop: 0 }}>Detalle de ingresos por mes</p>
        {d.errorI && <div className="gt-alert gt-alert-error">{d.errorI}</div>}
        {d.loadingI ? <p className="gt-text-muted">Cargando...</p> : (
          <>
            <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 22, color: '#1B5E44' }}>Total: ${d.totalIngresos.toLocaleString('es-AR')}</div>
            {d.ingresos.length === 0 ? <div className="gt-empty">Sin datos para el período seleccionado.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.ingresos.map(i => (
                  <div key={i.mes}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{i.mes}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>${i.total.toLocaleString('es-AR')}</span>
                    </div>
                    <Barra valor={i.total} max={d.maxIngreso} color="#1B5E44" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="gt-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <p className="gt-card-title" style={{ margin: 0 }}>Asistencias por día</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label className="gt-label" style={{ margin: 0 }}>Desde</label>
              <input className="gt-input" type="date" style={{ width: 'auto' }} value={d.desde} onChange={e => d.setDesde(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <label className="gt-label" style={{ margin: 0 }}>Hasta</label>
              <input className="gt-input" type="date" style={{ width: 'auto' }} value={d.hasta} onChange={e => d.setHasta(e.target.value)} />
            </div>
            <button className="gt-btn gt-btn-primary" onClick={d.cargarAsistencias}>Consultar</button>
          </div>
        </div>
        {d.errorA && <div className="gt-alert gt-alert-error">{d.errorA}</div>}
        {d.loadingA ? <p className="gt-text-muted">Cargando...</p> : (
          <>
            <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 22, color: '#1B5E44' }}>Total: {d.totalAsistencias.toLocaleString('es-AR')} ingresos</div>
            {d.asistencias.length === 0 ? <div className="gt-empty">Sin registros para el período seleccionado.</div> : (
              <div className="gt-table-wrap">
                <table className="gt-table">
                  <thead><tr><th>Fecha</th><th>Ingresos</th><th style={{ width: '60%' }}>Distribución</th></tr></thead>
                  <tbody>
                    {d.asistencias.map(a => (
                      <tr key={a.fecha}>
                        <td>{new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                        <td className="gt-fw-600">{a.total}</td>
                        <td><Barra valor={a.total} max={d.maxAsist} color="#6366f1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div className="gt-card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="gt-card-title" style={{ margin: 0 }}>Membresías próximas a vencer</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="gt-label" style={{ margin: 0 }}>En los próximos</label>
            <select className="gt-select" style={{ width: 'auto' }} value={d.diasVencer} onChange={e => d.setDiasVencer(Number(e.target.value))}>
              {[7, 15, 30].map(x => <option key={x} value={x}>{x} días</option>)}
            </select>
          </div>
        </div>
        {d.proximos.length === 0 ? <div className="gt-empty">No hay membresías próximas a vencer en ese período.</div> : (
          <div className="gt-table-wrap">
            <table className="gt-table">
              <thead><tr><th>Socio</th><th>DNI</th><th>Plan</th><th>Vence</th><th>Días restantes</th></tr></thead>
              <tbody>
                {d.proximos.map(p => (
                  <tr key={p.socioId} style={{ cursor: 'pointer' }} onClick={() => d.navigate(`/socios/${p.socioId}/perfil`)}>
                    <td className="gt-fw-600">{p.nombre}</td>
                    <td>{p.dni}</td>
                    <td>{p.tipoMembresia}</td>
                    <td>{new Date(p.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                    <td>
                      <span className={`gt-badge ${p.diasRestantes <= 3 ? 'gt-badge-red' : p.diasRestantes <= 7 ? 'gt-badge-yellow' : 'gt-badge-green'}`}>
                        {p.diasRestantes} días
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="gt-card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="gt-card-title" style={{ margin: 0 }}>Socios sin asistencias recientes</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="gt-label" style={{ margin: 0 }}>Sin venir hace más de</label>
            <select className="gt-select" style={{ width: 'auto' }} value={d.diasInactivo} onChange={e => d.setDiasInactivo(Number(e.target.value))}>
              {[7, 14, 30].map(x => <option key={x} value={x}>{x} días</option>)}
            </select>
          </div>
        </div>
        {d.sinAsist.length === 0 ? <div className="gt-empty">Todos los socios tienen asistencias recientes.</div> : (
          <div className="gt-table-wrap">
            <table className="gt-table">
              <thead><tr><th>Socio</th><th>DNI</th><th>Última asistencia</th></tr></thead>
              <tbody>
                {d.sinAsist.map(s => (
                  <tr key={s.socioId} style={{ cursor: 'pointer' }} onClick={() => d.navigate(`/socios/${s.socioId}/perfil`)}>
                    <td className="gt-fw-600">{s.nombre}</td>
                    <td>{s.dni}</td>
                    <td style={{ color: s.ultimaAsistencia === 'Nunca' ? '#DC2626' : '#6B7280' }}>
                      {s.ultimaAsistencia === 'Nunca' ? 'Nunca asistió' : new Date(s.ultimaAsistencia + 'T00:00:00').toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
