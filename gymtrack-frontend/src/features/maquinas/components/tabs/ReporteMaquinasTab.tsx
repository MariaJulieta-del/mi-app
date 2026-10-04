import type { Mantenimiento } from '../../types/Mantenimiento'

interface Props {
  mantenimientos: Mantenimiento[]
}

export default function ReporteMaquinasTab({ mantenimientos }: Props) {
  const conCosto = mantenimientos.filter(
    m => m.tipo === 'REALIZADO' && m.costo != null && Number(m.costo) > 0
  )

  const totalGastado = conCosto.reduce((acc, m) => acc + Number(m.costo ?? 0), 0)
  const totalReparaciones = mantenimientos.filter(m => m.tipo === 'REALIZADO').length

  const porMaquina: Record<number, { nombre: string; nro: string | null; reps: number; costoTotal: number }> = {}
  for (const m of conCosto) {
    const id = m.maquinaId
    if (!porMaquina[id]) {
      porMaquina[id] = { nombre: m.maquinaNombre ?? '', nro: m.maquinaNroMaquina ?? null, reps: 0, costoTotal: 0 }
    }
    porMaquina[id].reps += 1
    porMaquina[id].costoTotal += Number(m.costo ?? 0)
  }
  const rankMaquinas = Object.values(porMaquina).sort((a, b) => b.costoTotal - a.costoTotal)

  const detalle = [...conCosto].sort((a, b) => {
    const fa = a.fechaMantenimiento ?? ''
    const fb = b.fechaMantenimiento ?? ''
    return fb.localeCompare(fa)
  })

  const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div style={{ border: '1.5px solid #D97706', borderRadius: '0 8px 8px 8px', background: 'var(--bg-surface)', padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
        📊 Reporte de gastos en mantenimiento
      </h3>

      {conCosto.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>💰</p>
          <p style={{ margin: 0, fontSize: 14 }}>Todavía no hay reparaciones con costo registrado.</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#D1D5DB' }}>
            Al registrar un mantenimiento como REALIZADO con un costo, aparecerá aquí.
          </p>
        </div>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total gastado', value: fmt(totalGastado), color: 'var(--red)', bg: 'var(--red-light)' },
              { label: 'Reparaciones c/ costo', value: String(conCosto.length), color: 'var(--yellow-text)', bg: 'var(--yellow-bg)' },
              { label: 'Total reparaciones', value: String(totalReparaciones), color: 'var(--text-muted)', bg: 'var(--bg-surface-2)' },
              { label: 'Costo promedio', value: conCosto.length ? fmt(totalGastado / conCosto.length) : '—', color: 'var(--purple-text)', bg: 'var(--purple-bg)' },
            ].map(card => (
              <div key={card.label} style={{
                background: card.bg, border: `1.5px solid ${card.color}30`,
                borderRadius: 10, padding: '14px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Ranking por máquina */}
          {rankMaquinas.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Gasto por máquina
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-2)' }}>
                      {['Máquina', 'Reparaciones', 'Costo total', 'Costo prom.'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Máquina' ? 'left' : 'right', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankMaquinas.map((maq, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {maq.nro ? <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>[{maq.nro}]</span> : null}
                          {maq.nombre}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{maq.reps}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: maq.costoTotal >= 50000 ? '#DC2626' : 'var(--text-primary)' }}>
                          {fmt(maq.costoTotal)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {fmt(maq.costoTotal / maq.reps)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalle */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Detalle de reparaciones con costo
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detalle.map(m => (
                <div key={m.id} style={{
                  border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                  background: 'var(--bg-surface-2)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {m.maquinaNroMaquina ? <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>[{m.maquinaNroMaquina}]</span> : null}
                      {m.maquinaNombre}
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{m.descripcion}</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {m.fechaMantenimiento && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          📅 {new Date(m.fechaMantenimiento + 'T00:00:00').toLocaleDateString('es-AR')}
                        </span>
                      )}
                      {m.tecnico && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔧 {m.tecnico}</span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 16, color: 'var(--red)', flexShrink: 0,
                    background: 'var(--red-light)', border: '1px solid var(--border)', borderRadius: 8,
                    padding: '6px 12px', whiteSpace: 'nowrap',
                  }}>
                    {fmt(Number(m.costo))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
