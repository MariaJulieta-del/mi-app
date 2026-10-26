import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Search, Wallet } from 'lucide-react'
import { listarPagos } from '../services/pagoService'
import type { Pago } from '../types/Pago'
import { METODOS, pesos } from '../utils/dinero'
import { EmptyState, Pill, Resumen, Segmentado, SkeletonTarjetas } from '../../../shared/components/ui'
import { descargarCSV } from '../../../shared/utils/csv'
import { fechaLocalISO, formatFecha } from '../../../shared/utils/fechas'
import { useNombrePlan } from '../../../shared/hooks/useNombrePlan'

type Periodo = 'hoy' | 'semana' | 'mes' | 'todo' | 'rango'
const PERIODOS: { valor: Periodo; texto: string }[] = [
  { valor: 'hoy', texto: 'Hoy' }, { valor: 'semana', texto: '7 días' }, { valor: 'mes', texto: 'Este mes' },
  { valor: 'todo', texto: '12 meses' }, { valor: 'rango', texto: 'Fechas' },
]
const TONO_ESTADO: Record<string, 'ok' | 'danger' | 'neutral' | 'warn'> = { ACTIVA: 'ok', VENCIDA: 'danger', CANCELADA: 'neutral' }

function rangoDe(p: Periodo, desde: string, hasta: string): [string, string] {
  const hoy = new Date()
  const iso = fechaLocalISO
  if (p === 'hoy') return [iso(hoy), iso(hoy)]
  if (p === 'semana') { const d = new Date(hoy); d.setDate(d.getDate() - 6); return [iso(d), iso(hoy)] }
  if (p === 'mes') return [iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), iso(hoy)]
  if (p === 'rango') return [desde, hasta]
  // "12 meses": lo que el servidor devuelve sin fechas
  return ['', '']
}

/** Todos los cobros con búsqueda, filtros rápidos, totales por medio de pago y exportación */
export default function MovimientosCaja({ fechaInicial }: { fechaInicial?: string | null }) {
  const nombrePlan = useNombrePlan()
  /** Pagos cargados y para qué período (mientras llega el nuevo período se muestra 'cargando') */
  const [cargados, setCargados] = useState<{ clave: string; pagos: Pago[] } | null>(null)
  const [error, setError] = useState(false)
  const [periodo, setPeriodo] = useState<Periodo>(fechaInicial ? 'rango' : 'hoy')
  const [desde, setDesde] = useState(fechaInicial ?? '')
  const [hasta, setHasta] = useState(fechaInicial ?? '')
  const [metodo, setMetodo] = useState<string | null>(null)
  const [buscar, setBuscar] = useState('')

  const [d0, d1] = rangoDe(periodo, desde, hasta)
  const rangoIncompleto = periodo === 'rango' && (!desde || !hasta || desde > hasta)

  // Solo el período elegido; si cambia, la consulta anterior se cancela y no pisa el resultado
  useEffect(() => {
    if (rangoIncompleto) return
    const ctrl = new AbortController()
    listarPagos(d0 || undefined, d1 || undefined, ctrl.signal)
      .then(data => { setCargados({ clave: `${d0}|${d1}`, pagos: data }); setError(false) })
      .catch(() => { if (!ctrl.signal.aborted) setError(true) })
    return () => ctrl.abort()
  }, [d0, d1, rangoIncompleto])

  const pagos = cargados && cargados.clave === `${d0}|${d1}` ? cargados.pagos : null
  const enPeriodo = useMemo(() => (rangoIncompleto ? [] : pagos ?? []), [pagos, rangoIncompleto])
  const q = buscar.trim().toLowerCase()
  const visibles = enPeriodo.filter(p =>
    (!metodo || p.metodoPago === metodo) &&
    (!q || (p.socioNombre ?? '').toLowerCase().includes(q) || nombrePlan(p.tipoMembresia).toLowerCase().includes(q)))

  const completados = enPeriodo.filter(p => p.estadoPago !== 'CANCELADO' && p.estadoPago !== 'PENDIENTE')
  const total = completados.reduce((s, p) => s + Number(p.monto), 0)
  const porMetodo = (m: string) => completados.filter(p => p.metodoPago === m).reduce((s, p) => s + Number(p.monto), 0)

  const exportar = () => descargarCSV(`pagos-${d0 || 'ultimos-12-meses'}`,
    ['Fecha', 'Hora', 'Socio', 'Plan', 'Monto', 'Medio', 'Estado', 'Observaciones'],
    visibles.map(p => [p.fechaPago?.slice(0, 10), p.fechaPago?.slice(11, 16), p.socioNombre, nombrePlan(p.tipoMembresia), Number(p.monto), p.metodoPago, p.estadoPago, p.observaciones]))

  return (
    <>
      <div className="gt-toolbar-fila" style={{ marginBottom: 12 }}>
        <Segmentado etiqueta="Período" valor={periodo} onChange={setPeriodo} opciones={PERIODOS} />
        {periodo === 'rango' && (
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <input type="date" className="gt-input" style={{ width: 'auto' }} value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} aria-label="Desde" />
            <span className="gt-text-muted">a</span>
            <input type="date" className="gt-input" style={{ width: 'auto' }} value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} aria-label="Hasta" />
          </span>
        )}
      </div>

      <Resumen items={[
        { valor: pesos(total), texto: `cobrado · ${completados.length} ${completados.length === 1 ? 'pago' : 'pagos'}`, onClick: () => setMetodo(null), activo: metodo == null },
        ...METODOS.map(m => ({ valor: pesos(porMetodo(m.valor)), texto: m.texto.toLowerCase(), onClick: () => setMetodo(metodo === m.valor ? null : m.valor), activo: metodo === m.valor })),
      ]} />

      <div className="gt-toolbar-fila" style={{ marginBottom: 12 }}>
        <div className="gt-busqueda" style={{ maxWidth: 420 }}>
          <Search size={16} aria-hidden />
          <input className="gt-input" placeholder="Buscar socio o plan" value={buscar} onChange={e => setBuscar(e.target.value)} aria-label="Buscar" />
        </div>
        <button type="button" className="gt-btn gt-btn-secondary" style={{ marginLeft: 'auto' }} onClick={exportar} disabled={visibles.length === 0}><Download size={16} aria-hidden /> Exportar</button>
      </div>

      {error && <div className="gt-alert gt-alert-error">No se pudieron cargar los pagos.</div>}
      {rangoIncompleto ? (
        <p className="gt-text-muted gt-text-sm">Elegí desde y hasta para ver los cobros de esas fechas.</p>
      ) : !pagos ? (!error && <SkeletonTarjetas cantidad={3} alto={56} />) : visibles.length === 0 ? (
        <div className="gt-card"><EmptyState icono={Wallet} titulo={enPeriodo.length === 0 ? 'No hay cobros en este período' : 'Nada coincide con el filtro'}
          accion={<Link to="/pagos/nuevo" className="gt-btn gt-btn-primary">Registrar pago</Link>} /></div>
      ) : (
        <div tabIndex={0} role="region" aria-label="Movimientos de caja" className="gt-table-wrap gt-card" style={{ padding: 0 }}>
          <table className="gt-table gt-tabla-tarjetas">
            <thead><tr><th>Fecha</th><th>Socio</th><th>Plan</th><th>Medio</th><th style={{ textAlign: 'right' }}>Monto</th></tr></thead>
            <tbody>
              {visibles.map(p => (
                <tr key={p.id} style={p.estadoPago === 'CANCELADO' ? { opacity: 0.55 } : undefined}>
                  <td data-label="Fecha" style={{ whiteSpace: 'nowrap' }}><span>{formatFecha(p.fechaPago)}<span className="gt-text-muted gt-text-sm"> {p.fechaPago?.slice(11, 16)}</span></span></td>
                  <td className="gt-td-titulo">
                    {p.socioId ? <Link to={`/socios/${p.socioId}/perfil`} className="gt-fw-600" style={{ color: 'var(--text-primary)' }}>{p.socioNombre ?? '—'}</Link> : (p.socioNombre ?? '—')}
                    {p.observaciones && <div className="gt-text-sm gt-text-muted">{p.observaciones}</div>}
                  </td>
                  <td data-label="Plan">
                    {p.tipoMembresia ? nombrePlan(p.tipoMembresia) : `#${p.membresiaId}`}{' '}
                    {p.estadoMembresia && <Pill tono={TONO_ESTADO[p.estadoMembresia] ?? 'neutral'}>{p.estadoMembresia.toLowerCase()}</Pill>}
                  </td>
                  <td data-label="Medio">{METODOS.find(m => m.valor === p.metodoPago)?.texto ?? p.metodoPago}</td>
                  <td data-label="Monto" style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {pesos(Number(p.monto))}
                    {p.estadoPago === 'CANCELADO' && <div className="gt-text-sm gt-text-muted" style={{ fontWeight: 400 }}>anulado</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
