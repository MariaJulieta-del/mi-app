import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Pago } from '../types/Pago'
import { listarPagos } from '../services/pagoService'

type Filtro = 'todos' | 'hoy' | 'semana' | 'mes' | 'rango'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function toLocalDate(dateStr: string) {
  // Evita desfase de zona horaria: trata la fecha como local
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function PagosList() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  useEffect(() => {
    listarPagos()
      .then(data => {
        // Ordenar del más nuevo al más antiguo
        const sorted = [...data].sort((a, b) => {
          const da = new Date(a.fechaPago ?? '').getTime()
          const db = new Date(b.fechaPago ?? '').getTime()
          return db - da
        })
        setPagos(sorted)
      })
      .catch(() => setError('Error al cargar los pagos'))
      .finally(() => setCargando(false))
  }, [])

  const pagosFiltrados = useMemo(() => {
    const hoy = startOfDay(new Date())
    return pagos.filter(p => {
      if (!p.fechaPago) return filtro === 'todos'
      const fp = startOfDay(toLocalDate(p.fechaPago.slice(0, 10)))
      if (filtro === 'hoy') return fp.getTime() === hoy.getTime()
      if (filtro === 'semana') {
        const hace7 = new Date(hoy); hace7.setDate(hace7.getDate() - 6)
        return fp >= hace7 && fp <= hoy
      }
      if (filtro === 'mes') {
        return fp.getFullYear() === hoy.getFullYear() && fp.getMonth() === hoy.getMonth()
      }
      if (filtro === 'rango') {
        if (desde && fp < toLocalDate(desde)) return false
        if (hasta && fp > toLocalDate(hasta)) return false
        return true
      }
      return true
    })
  }, [pagos, filtro, desde, hasta])

  const totalCompletado = pagosFiltrados
    .filter(p => p.estadoPago === 'COMPLETADO')
    .reduce((sum, p) => sum + p.monto, 0)

  const btnStyle = (f: Filtro) => ({
    padding: '6px 14px',
    borderRadius: 6,
    border: '1px solid',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: filtro === f ? 600 : 400,
    background: filtro === f ? '#1B5E44' : '#fff',
    color: filtro === f ? '#fff' : '#374151',
    borderColor: filtro === f ? '#1B5E44' : '#D1D5DB',
    transition: 'all .15s',
  })

  const labelRango = useMemo(() => {
    if (filtro !== 'rango' || (!desde && !hasta)) return 'Rango de fechas'
    if (desde && hasta) return `${desde} → ${hasta}`
    if (desde) return `Desde ${desde}`
    return `Hasta ${hasta}`
  }, [filtro, desde, hasta])

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Pagos</h1>
        <Link to="/pagos/nuevo" className="gt-btn gt-btn-primary">+ Registrar pago</Link>
      </div>

      {/* Filtros de período */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: filtro === 'rango' ? 10 : 0 }}>
          <span style={{ fontSize: 13, color: '#6B7280', marginRight: 4 }}>Período:</span>
          {(['hoy', 'semana', 'mes', 'todos'] as Filtro[]).map(f => (
            <button key={f} style={btnStyle(f)} onClick={() => setFiltro(f)}>
              {f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Esta semana' : f === 'mes' ? 'Este mes' : 'Todos'}
            </button>
          ))}
          <button style={btnStyle('rango')} onClick={() => setFiltro('rango')}>
            📅 {labelRango}
          </button>
          {filtro !== 'todos' && (
            <span style={{ fontSize: 13, color: '#6B7280', marginLeft: 4 }}>
              · {pagosFiltrados.length} pago{pagosFiltrados.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Inputs de rango */}
        {filtro === 'rango' && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8,
            padding: '10px 14px', marginTop: 8,
          }}>
            <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Desde:</span>
            <input type="date" className="gt-input" style={{ width: 160, fontSize: 13, padding: '4px 8px' }}
              value={desde} onChange={e => setDesde(e.target.value)} max={hasta || undefined} />
            <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Hasta:</span>
            <input type="date" className="gt-input" style={{ width: 160, fontSize: 13, padding: '4px 8px' }}
              value={hasta} onChange={e => setHasta(e.target.value)} min={desde || undefined} />
            {(desde || hasta) && (
              <button style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13 }}
                onClick={() => { setDesde(''); setHasta('') }}>
                ✕ Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tarjeta resumen */}
      {pagosFiltrados.length > 0 && (
        <div className="gt-stats-row">
          <div className="gt-stat-card">
            <div className="gt-stat-number">${totalCompletado.toLocaleString('es-AR')}</div>
            <div className="gt-stat-label">Total recaudado (completados)</div>
          </div>
          <div className="gt-stat-card">
            <div className="gt-stat-number">{pagosFiltrados.length}</div>
            <div className="gt-stat-label">
              {filtro === 'hoy' ? 'Pagos de hoy' : filtro === 'semana' ? 'Pagos esta semana' : filtro === 'mes' ? 'Pagos este mes' : 'Pagos registrados'}
            </div>
          </div>
        </div>
      )}

      {error && <div className="gt-alert gt-alert-error">{error}</div>}
      {cargando ? (
        <p className="gt-text-muted">Cargando...</p>
      ) : pagosFiltrados.length === 0 ? (
        <div className="gt-empty">
          {filtro === 'todos' ? 'No hay pagos registrados.' : `No hay pagos para ${filtro === 'hoy' ? 'hoy' : filtro === 'semana' ? 'esta semana' : 'este mes'}.`}
        </div>
      ) : (
        <div className="gt-table-wrap">
          <table className="gt-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Plan</th>
                <th>Estado membresía</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.map(p => {
                const memEstado = p.estadoMembresia ?? ''
                const memColor =
                  memEstado === 'ACTIVA' ? 'gt-badge gt-badge-green' :
                  memEstado === 'VENCIDA' ? 'gt-badge gt-badge-red' :
                  memEstado === 'CANCELADA' ? 'gt-badge gt-badge-gray' :
                  memEstado === 'PENDIENTE_PAGO' ? 'gt-badge gt-badge-yellow' :
                  'gt-badge gt-badge-gray'
                return (
                  <tr key={p.id}>
                    <td className="gt-fw-600">{p.socioNombre ?? '—'}</td>
                    <td>{p.tipoMembresia ?? `#${p.membresiaId}`}</td>
                    <td>
                      {memEstado
                        ? <span className={memColor}>{memEstado}</span>
                        : '—'}
                    </td>
                    <td>{p.fechaPago?.slice(0, 10)}</td>
                    <td>${Number(p.monto).toLocaleString('es-AR')}</td>
                    <td>{p.metodoPago}</td>
                    <td className="gt-text-muted">{p.observaciones ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
