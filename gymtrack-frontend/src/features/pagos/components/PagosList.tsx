import { Link } from 'react-router-dom'
import { usePagos, type Filtro, type Tab } from '../hooks/usePagos'

function btnStyle(f: Filtro, active: Filtro) {
  return {
    padding: '6px 14px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 13,
    fontWeight: active === f ? 600 : 400,
    background: active === f ? '#1B5E44' : 'var(--bg-surface-2)',
    color: active === f ? '#fff' : 'var(--text-secondary)',
    borderColor: active === f ? '#1B5E44' : 'var(--border)',
    transition: 'all .15s',
  }
}

function tabStyle(t: Tab, active: Tab) {
  return {
    padding: '8px 20px', borderRadius: '8px 8px 0 0', border: '1px solid',
    borderBottom: active === t ? '2px solid var(--accent)' : '1px solid var(--border)',
    cursor: 'pointer', fontSize: 14, fontWeight: active === t ? 700 : 400,
    background: active === t ? 'var(--bg-surface)' : 'var(--bg-surface-2)',
    color: active === t ? 'var(--accent)' : 'var(--text-muted)',
    borderColor: 'var(--border)', marginRight: 4,
    position: 'relative' as const, bottom: -1,
  }
}

export default function PagosList() {
  const p = usePagos()

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Caja</h1>
        {p.tab === 'ingresos' && (
          <Link to="/pagos/nuevo" className="gt-btn gt-btn-primary">+ Registrar pago</Link>
        )}
        {p.tab === 'cierre' && p.esAdmin && p.resumen && !p.resumen.cerrada && (
          <button className="gt-btn gt-btn-primary" style={{ background: '#1B5E44', borderColor: '#1B5E44' }}
            onClick={() => p.setShowFormCierre(s => !s)}>
            {p.showFormCierre ? '✕ Cancelar' : '🔒 Cerrar caja del día'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button style={tabStyle('ingresos', p.tab)} onClick={() => p.setTab('ingresos')}>💰 Ingresos</button>
        {p.esAdmin && (
          <button style={tabStyle('cierre', p.tab)} onClick={() => p.setTab('cierre')}>🔒 Cierre de caja</button>
        )}
      </div>

      {/* ════ INGRESOS ════ */}
      {p.tab === 'ingresos' && (
        <>
          {p.esProfesor ? (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1B5E44', background: 'var(--green-bg)', border: '1px solid var(--accent-border)', borderRadius: 6, padding: '5px 14px' }}>
                📅 Pagos de hoy
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {p.pagosFiltrados.length} pago{p.pagosFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: p.filtro === 'rango' ? 10 : 0 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4 }}>Período:</span>
                {(['hoy', 'semana', 'mes', 'todos'] as Filtro[]).map(f => (
                  <button key={f} style={btnStyle(f, p.filtro)} onClick={() => p.setFiltro(f)}>
                    {f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Esta semana' : f === 'mes' ? 'Este mes' : 'Todos'}
                  </button>
                ))}
                <button style={btnStyle('rango', p.filtro)} onClick={() => p.setFiltro('rango')}>
                  📅 {p.labelRango}
                </button>
                {p.filtro !== 'todos' && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>
                    · {p.pagosFiltrados.length} pago{p.pagosFiltrados.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {p.filtro === 'rango' && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', background: 'var(--green-bg)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--green-text)', fontWeight: 600 }}>Desde:</span>
                  <input type="date" className="gt-input" style={{ width: 160, fontSize: 13, padding: '4px 8px' }}
                    value={p.desde} onChange={e => p.setDesde(e.target.value)} max={p.hasta || undefined} />
                  <span style={{ fontSize: 13, color: 'var(--green-text)', fontWeight: 600 }}>Hasta:</span>
                  <input type="date" className="gt-input" style={{ width: 160, fontSize: 13, padding: '4px 8px' }}
                    value={p.hasta} onChange={e => p.setHasta(e.target.value)} min={p.desde || undefined} />
                  {(p.desde || p.hasta) && (
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
                      onClick={() => { p.setDesde(''); p.setHasta('') }}>
                      ✕ Limpiar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {p.pagosFiltrados.length > 0 && (
            <div className="gt-stats-row">
              <div className="gt-stat-card">
                <div className="gt-stat-number">${p.totalIngresos.toLocaleString('es-AR')}</div>
                <div className="gt-stat-label">Total recaudado (completados)</div>
              </div>
              <div className="gt-stat-card">
                <div className="gt-stat-number">{p.pagosFiltrados.length}</div>
                <div className="gt-stat-label">
                  {p.filtro === 'hoy' ? 'Pagos de hoy' : p.filtro === 'semana' ? 'Pagos esta semana' : p.filtro === 'mes' ? 'Pagos este mes' : 'Pagos registrados'}
                </div>
              </div>
            </div>
          )}

          {p.error && <div className="gt-alert gt-alert-error">{p.error}</div>}
          {p.cargando ? (
            <p className="gt-text-muted">Cargando...</p>
          ) : p.pagosFiltrados.length === 0 ? (
            <div className="gt-empty">
              {p.filtro === 'todos' ? 'No hay pagos registrados.' : 'No hay pagos para el período seleccionado.'}
            </div>
          ) : (
            <div className="gt-table-wrap">
              <table className="gt-table">
                <thead>
                  <tr>
                    <th>Socio</th><th>Plan</th><th>Estado membresía</th>
                    <th>Fecha</th><th>Monto</th><th>Método</th><th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {p.pagosFiltrados.map(pago => {
                    const estado = pago.estadoMembresia ?? ''
                    const badgeClass =
                      estado === 'ACTIVA'         ? 'gt-badge gt-badge-green'  :
                      estado === 'VENCIDA'         ? 'gt-badge gt-badge-red'    :
                      estado === 'CANCELADA'       ? 'gt-badge gt-badge-gray'   :
                      'gt-badge gt-badge-gray'
                    return (
                      <tr key={pago.id}>
                        <td className="gt-fw-600">{pago.socioNombre ?? '—'}</td>
                        <td>{pago.tipoMembresia ?? `#${pago.membresiaId}`}</td>
                        <td>{estado ? <span className={badgeClass}>{estado}</span> : '—'}</td>
                        <td>{pago.fechaPago?.slice(0, 10)}</td>
                        <td>${Number(pago.monto).toLocaleString('es-AR')}</td>
                        <td>{pago.metodoPago}</td>
                        <td className="gt-text-muted">{pago.observaciones ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════ CIERRE DE CAJA ════ */}
      {p.tab === 'cierre' && p.esAdmin && (
        <>
          {p.msgCierre && (
            <div className="gt-alert" style={{ background: 'var(--green-bg)', borderColor: 'var(--accent-border)', color: 'var(--green-text)', marginBottom: 16 }}>
              {p.msgCierre}
              <button onClick={() => p.setMsgCierre(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}
          {p.errorCierre && <div className="gt-alert gt-alert-error" style={{ marginBottom: 16 }}>{p.errorCierre}</div>}

          {p.cargandoCierre ? (
            <p className="gt-text-muted">Cargando resumen del día…</p>
          ) : p.resumen ? (
            <>
              {/* Panel principal */}
              <div style={{ borderRadius: 12, border: p.resumen.cerrada ? '2px solid var(--accent-border)' : '2px solid var(--accent)', background: p.resumen.cerrada ? 'var(--green-bg)' : 'var(--bg-surface-2)', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: p.resumen.cerrada ? 'var(--green-bg)' : '#1B5E44', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: p.resumen.cerrada ? 'var(--green-text)' : 'var(--text-primary)' }}>
                      {p.resumen.cerrada ? '✅ Caja cerrada' : '🟢 Caja abierta — hoy'}
                    </span>
                    <span style={{ fontSize: 13, color: p.resumen.cerrada ? 'var(--green-text)' : 'var(--accent-light)', marginLeft: 12 }}>
                      {new Date(p.resumen.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: p.resumen.cerrada ? 'var(--text-muted)' : 'var(--green-text)' }}>
                    {p.resumen.cantidadPagos} pago{p.resumen.cantidadPagos !== 1 ? 's' : ''} registrados
                  </span>
                </div>

                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ingresos del día</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { icon: '💵', label: 'Efectivo',       val: p.resumen.totalEfectivo },
                        { icon: '💳', label: 'Tarjeta',        val: p.resumen.totalTarjeta },
                        { icon: '🏦', label: 'Transferencia',  val: p.resumen.totalTransferencia },
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{row.icon} {row.label}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${Number(row.val).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Total ingresos</span>
                        <span style={{ fontWeight: 800, color: '#1B5E44' }}>${Number(p.resumen.totalIngresos).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--green-bg)', borderRadius: 10, padding: 14, border: '1.5px solid var(--accent-border)' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>💵 Efectivo en caja</p>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#1B5E44' }}>${Number(p.resumen.totalEfectivo).toLocaleString('es-AR')}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>lo que debería haber físicamente</div>
                  </div>

                  {p.resumen.cerrada && p.resumen.montoContado != null && (
                    <div style={{ background: Math.abs(Number(p.resumen.diferencia)) < 1 ? 'var(--green-bg)' : 'var(--red-light)', borderRadius: 10, padding: 14, border: `1.5px solid ${Math.abs(Number(p.resumen.diferencia)) < 1 ? 'var(--accent-border)' : 'var(--red)'}` }}>
                      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Conteo físico</p>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>${Number(p.resumen.montoContado).toLocaleString('es-AR')}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, color: Number(p.resumen.diferencia) === 0 ? '#16A34A' : Number(p.resumen.diferencia) > 0 ? '#D97706' : '#DC2626' }}>
                        {Number(p.resumen.diferencia) === 0 ? '✅ Cuadra perfectamente' :
                          Number(p.resumen.diferencia) > 0 ? `⬆ Sobrante: $${Number(p.resumen.diferencia).toLocaleString('es-AR')}` :
                          `⬇ Faltante: $${Math.abs(Number(p.resumen.diferencia)).toLocaleString('es-AR')}`}
                      </div>
                    </div>
                  )}
                </div>

                {p.resumen.cerrada && p.resumen.observaciones && (
                  <div style={{ padding: '0 20px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                    📝 {p.resumen.observaciones}
                    {p.resumen.creadoPor && <span style={{ marginLeft: 8 }}>— {p.resumen.creadoPor}</span>}
                  </div>
                )}
              </div>

              {/* Formulario de cierre */}
              {!p.resumen.cerrada && p.showFormCierre && (
                <div style={{ background: 'var(--green-bg)', border: '2px solid var(--accent)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: '#1B5E44' }}>🔒 Cerrar caja del día</p>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    El sistema calculó <strong>${Number(p.resumen.totalEfectivo).toLocaleString('es-AR')}</strong> en efectivo. Ingresá cuánto contás físicamente para registrar si cuadra o hay diferencia.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                        Monto contado físicamente <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
                      </label>
                      <input type="number" className="gt-input" style={{ width: '100%' }}
                        placeholder={`Calculado: $${Number(p.resumen.totalEfectivo).toLocaleString('es-AR')}`}
                        value={p.montoContado} onChange={e => p.setMontoContado(e.target.value)} min={0} step="0.01" />
                      {p.montoContado && (
                        <div style={{ fontSize: 12, marginTop: 4, fontWeight: 700, color: (Number(p.montoContado) - Number(p.resumen.totalEfectivo)) === 0 ? '#16A34A' : (Number(p.montoContado) - Number(p.resumen.totalEfectivo)) > 0 ? '#D97706' : '#DC2626' }}>
                          {Number(p.montoContado) - Number(p.resumen.totalEfectivo) === 0 ? '✅ Cuadra' :
                            Number(p.montoContado) - Number(p.resumen.totalEfectivo) > 0
                              ? `⬆ Sobrante: $${(Number(p.montoContado) - Number(p.resumen.totalEfectivo)).toLocaleString('es-AR')}`
                              : `⬇ Faltante: $${Math.abs(Number(p.montoContado) - Number(p.resumen.totalEfectivo)).toLocaleString('es-AR')}`}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Observaciones</label>
                      <input type="text" className="gt-input" style={{ width: '100%' }}
                        placeholder="Ej: todo en orden, falta billete de $X..."
                        value={p.obsCierre} onChange={e => p.setObsCierre(e.target.value)} />
                    </div>
                  </div>
                  <button className="gt-btn gt-btn-primary" style={{ background: '#1B5E44', borderColor: '#1B5E44' }}
                    disabled={p.cerrando} onClick={p.handleCerrarCaja}>
                    {p.cerrando ? 'Cerrando…' : '🔒 Confirmar cierre'}
                  </button>
                </div>
              )}

              {/* Historial */}
              <div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}
                  onClick={() => p.setShowHistorial(s => !s)}>
                  {p.showHistorial ? '▲ Ocultar historial' : '▼ Ver historial de cierres anteriores'}
                </button>
                {p.showHistorial && (
                  p.historial.length === 0 ? (
                    <p className="gt-text-muted">No hay cierres anteriores.</p>
                  ) : (
                    <div className="gt-table-wrap">
                      <table className="gt-table">
                        <thead>
                          <tr>
                            <th>Fecha</th><th>Efectivo</th><th>Tarjeta / Trans.</th>
                            <th>Total ingresos</th><th>Contado</th><th>Diferencia</th><th>Cerró</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.historial.map(h => (
                            <tr key={h.id}>
                              <td>{new Date(h.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                              <td>${Number(h.totalEfectivo).toLocaleString('es-AR')}</td>
                              <td>${(Number(h.totalTarjeta) + Number(h.totalTransferencia)).toLocaleString('es-AR')}</td>
                              <td style={{ fontWeight: 700, color: '#1B5E44' }}>${Number(h.totalIngresos).toLocaleString('es-AR')}</td>
                              <td>{h.montoContado != null ? `$${Number(h.montoContado).toLocaleString('es-AR')}` : '—'}</td>
                              <td style={{ fontWeight: 700, color: h.diferencia == null ? 'var(--text-muted)' : Number(h.diferencia) === 0 ? '#16A34A' : Number(h.diferencia) > 0 ? '#D97706' : '#DC2626' }}>
                                {h.diferencia == null ? '—' : Number(h.diferencia) === 0 ? '✅ Cuadra' : Number(h.diferencia) > 0 ? `+$${Number(h.diferencia).toLocaleString('es-AR')}` : `-$${Math.abs(Number(h.diferencia)).toLocaleString('es-AR')}`}
                              </td>
                              <td className="gt-text-muted">{h.creadoPor ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </>
  )
}
