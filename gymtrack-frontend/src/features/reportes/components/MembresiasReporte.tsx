import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEstadoMembresias, getPlanesVendidos, type EstadoMembresias, type PlanVendido } from '../services/reporteService'
import { RingChart, type SegmentoAnillo } from './Graficos'
import { useGlobo } from '../../../shared/hooks/useGlobo'
import { Skeleton } from '../../../shared/components/ui'
import FuenteDatos from './FuenteDatos'

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)

/** Qué planes se venden más: cobros por plan en el período, con lo recaudado y los socios que lo tienen hoy */
export function PlanesVendidos() {
  const [meses, setMesesEstado] = useState(6)
  const [planes, setPlanes] = useState<PlanVendido[] | null>(null)
  const [error, setError] = useState(false)
  const g = useGlobo()
  const setMeses = (m: number) => { setPlanes(null); setMesesEstado(m) }

  useEffect(() => {
    getPlanesVendidos(meses).then(p => { setPlanes(p); setError(false) }).catch(() => setError(true))
  }, [meses])

  const totalCobros = planes?.reduce((a, p) => a + p.cobros, 0) ?? 0
  // Con muchos planes se muestran los 5 más vendidos y el resto junto en "Otros"
  const resto = (planes ?? []).slice(5)
  const visibles: PlanVendido[] = planes && resto.length > 1
    ? [...planes.slice(0, 5), {
        tipo: '__otros', nombre: `Otros ${resto.length} planes`, cobros: resto.reduce((a, p) => a + p.cobros, 0),
        monto: resto.reduce((a, p) => a + p.monto, 0), sociosActivos: resto.reduce((a, p) => a + p.sociosActivos, 0),
      }]
    : planes ?? []
  const max = Math.max(1, ...visibles.map(p => p.cobros))

  return (
    <div className="gt-card" style={{ minWidth: 0 }}>
      <div className="gt-card-cabecera">
        <p className="gt-card-title" style={{ margin: 0 }}>Planes más vendidos</p>
        <select className="gt-select" style={{ width: 'auto' }} value={meses} onChange={e => setMeses(Number(e.target.value))} aria-label="Período de los planes">
          {[1, 3, 6, 12].map(m => <option key={m} value={m}>{m === 1 ? 'Último mes' : `${m} meses`}</option>)}
        </select>
      </div>
      {error && <div className="gt-alert gt-alert-error">No se pudieron cargar los planes.</div>}
      {!planes && !error && <Skeleton alto={120} />}
      {planes && planes.length === 0 && <div className="gt-empty">No hubo cobros en el período.</div>}
      {planes && planes.length > 0 && (
        <div className="gt-planes-vendidos">
          {visibles.map((p, i) => {
            const detalle = (
              <>
                <strong>{p.nombre}</strong>
                <span>{p.cobros} {p.cobros === 1 ? 'cobro' : 'cobros'} · {pct(p.cobros, totalCobros)}% de las ventas</span>
                <span>{pesos(p.monto)} recaudados · {pesos(p.cobros ? p.monto / p.cobros : 0)} por cobro</span>
                <small>{p.sociosActivos} {p.sociosActivos === 1 ? 'socio lo tiene' : 'socios lo tienen'} vigente hoy</small>
              </>
            )
            return (
              <div key={p.tipo} className="gt-plan-fila" tabIndex={0} {...g.props(detalle)}>
                <span className="gt-plan-nombre">{i === 0 && p.tipo !== '__otros' && <span className="gt-plan-top" aria-label="El más vendido">★</span>}{p.nombre}</span>
                <div className="gt-plan-barra"><div style={{ width: `${(p.cobros / max) * 100}%`, opacity: i === 0 ? 1 : 0.55 }} /></div>
                <span className="gt-plan-valor"><strong>{p.cobros}</strong> <span className="gt-text-muted">({pct(p.cobros, totalCobros)}%)</span></span>
              </div>
            )
          })}
        </div>
      )}
      {g.globo}
      <FuenteDatos>
        <li>Cada pago completado del período (módulo Pagos), agrupado por el plan que se cobró: las altas y las renovaciones cuentan como una venta.</li>
        <li>El plan queda guardado en cada pago, así un socio que después cambia de plan no mueve los números viejos.</li>
      </FuenteDatos>
    </div>
  )
}

/** Estado de las membresías de los socios activos y cuánto las usan */
export function EstadoMembresiasReporte() {
  const [e, setE] = useState<EstadoMembresias | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { getEstadoMembresias().then(setE).catch(() => setError(true)) }, [])

  if (error) return <div className="gt-alert gt-alert-error">No se pudo cargar el estado de las membresías.</div>
  if (!e) return <div className="gt-card" style={{ marginBottom: 20 }}><Skeleton alto={140} /></div>

  const alDiaSinPorVencer = e.alDia - e.porVencer
  const segmentos: SegmentoAnillo[] = [
    { valor: alDiaSinPorVencer, color: 'var(--green-text)', etiqueta: 'Al día', detalle: `Membresía vigente por más de ${e.diasPorVencer} días` },
    { valor: e.porVencer, color: 'var(--yellow-text)', etiqueta: `Vencen en ${e.diasPorVencer} días`, detalle: 'Al día, pero conviene avisarles para que renueven' },
    { valor: e.vencidas, color: 'var(--red)', etiqueta: 'Vencidas', detalle: 'No pueden entrar hasta que paguen' },
    { valor: e.canceladas, color: 'var(--text-xmuted)', etiqueta: 'Canceladas', detalle: 'La membresía se canceló a mano' },
    { valor: e.sinMembresia, color: 'var(--border)', etiqueta: 'Sin membresía', detalle: 'Socios cargados que nunca tuvieron plan' },
  ]
  const usoAlDia = pct(e.alDiaQueVinieron, e.alDia)

  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <div className="gt-card-cabecera">
        <p className="gt-card-title" style={{ margin: 0 }}>Estado de membresías y uso</p>
        <span className="gt-text-sm gt-text-muted"><strong className="gt-numero-destacado">{e.sociosActivos}</strong> socios activos</span>
      </div>
      <div className="gt-estado-mem">
        <RingChart segmentos={segmentos} centro="socios" />
        <div className="gt-indicadores gt-indicadores-2">
          <div>
            <strong style={{ color: usoAlDia >= 60 ? 'var(--green-text)' : 'var(--yellow-text)' }}>{usoAlDia}%</strong>
            <span>de los que están al día vinieron</span>
            <small>{e.alDiaQueVinieron} de {e.alDia} en los últimos {e.diasUso} días</small>
          </div>
          <div>
            <strong style={{ color: e.alDiaSinVenir > 0 ? 'var(--yellow-text)' : undefined }}>{e.alDiaSinVenir}</strong>
            <span>pagan pero no vienen</span>
            <small>Riesgo de que no renueven · <Link to="/reportes?seccion=retencion">ver a quién llamar</Link></small>
          </div>
          <div>
            <strong style={{ color: e.vencidas > 0 ? 'var(--red)' : undefined }}>{e.vencidas}</strong>
            <span>con la cuota vencida</span>
            <small><Link to="/socios?vista=vencidas">Ver la lista y avisarles</Link></small>
          </div>
          <div>
            <strong>{e.vencidasQueSiguenViniendo}</strong>
            <span>vencidos que intentaron entrar</span>
            <small>Vinieron en los últimos {e.diasUso} días: cobro fácil en recepción</small>
          </div>
        </div>
      </div>
      <FuenteDatos>
        <li><b>Estado:</b> la membresía más reciente de cada socio activo (los dados de baja no cuentan).</li>
        <li><b>Vinieron / no vienen:</b> ingresos aceptados en recepción o con el QR en los últimos {e.diasUso} días.</li>
        <li><b>Intentaron entrar:</b> socios con la cuota vencida que pasaron por el ingreso (aunque se les negara la entrada).</li>
      </FuenteDatos>
    </div>
  )
}
