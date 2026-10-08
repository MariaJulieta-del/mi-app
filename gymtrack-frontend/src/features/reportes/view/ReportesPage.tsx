import { useSearchParams } from 'react-router-dom'
import { CalendarClock, HeartHandshake, UserRoundSearch, Wallet, type LucideIcon } from 'lucide-react'
import { useReportes } from '../hooks/useReportes'
import { Barra, BarChart, RingChart } from '../components/Graficos'
import { RetencionMensual, OcupacionHoraria } from '../components/MetricasNegocio'
import MotivosBaja from '../components/MotivosBaja'
import IndicadoresDueno, { CohortesRetencion } from '../components/IndicadoresDueno'
import PublicoGimnasio from '../components/PublicoGimnasio'
import FuenteDatos from '../components/FuenteDatos'
import { PageHeader, Segmentado } from '../../../shared/components/ui'

type Seccion = 'dinero' | 'retencion' | 'asistencia' | 'publico'
const SECCIONES: { valor: Seccion; texto: string; icono: LucideIcon; descripcion: string }[] = [
  { valor: 'dinero', texto: 'Dinero', icono: Wallet, descripcion: 'Lo que entra, lo que se gasta y el estado de las membresías.' },
  { valor: 'retencion', texto: 'Retención', icono: HeartHandshake, descripcion: 'Quién renueva, quién se va y por qué, y a quién conviene llamar.' },
  { valor: 'asistencia', texto: 'Asistencia', icono: CalendarClock, descripcion: 'Cuánta gente viene y en qué días y horarios.' },
  { valor: 'publico', texto: 'Público', icono: UserRoundSearch, descripcion: 'Edad y género de los socios y a qué hora viene cada grupo.' },
]

const fmtARS = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fechaCorta = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR')

/** Reportes del admin, ordenados por tema: cada sección responde una pregunta del negocio */
export default function ReportesPage() {
  const d = useReportes()
  const [params, setParams] = useSearchParams()
  const seccion: Seccion = SECCIONES.find(x => x.valor === params.get('seccion'))?.valor ?? 'dinero'
  const elegir = (v: Seccion) => setParams(v === 'dinero' ? {} : { seccion: v }, { replace: true })
  const info = SECCIONES.find(x => x.valor === seccion)!
  const balanceNeto = d.totalIngresos - d.totalGastosMantenimiento

  return (
    <>
      <PageHeader titulo="Reportes" subtitulo={info.descripcion} />
      <div className="gt-reporte-secciones">
        <Segmentado etiqueta="Sección del reporte" valor={seccion} onChange={elegir}
          opciones={SECCIONES.map(x => ({ valor: x.valor, texto: x.texto, icono: x.icono }))} />
      </div>

      {seccion === 'dinero' && (
        <>
          <IndicadoresDueno />

          <div className="gt-reporte-dos" style={{ alignItems: 'stretch' }}>
            <div className="gt-card" style={{ minWidth: 0 }}>
              <div className="gt-card-cabecera">
                <p className="gt-card-title" style={{ margin: 0 }}>Ingresos por mes</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="gt-numero-destacado">{fmtARS(d.totalIngresos)}</span>
                  <select className="gt-select" style={{ width: 'auto' }} value={d.meses} onChange={e => d.setMeses(Number(e.target.value))} aria-label="Período">
                    {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} meses</option>)}
                  </select>
                </div>
              </div>
              {d.errorI && <div className="gt-alert gt-alert-error">{d.errorI}</div>}
              {d.loadingI ? <p className="gt-text-muted">Cargando…</p> : <BarChart data={d.ingresos} />}
            </div>
            {d.dashStats && (
              <div className="gt-card" style={{ minWidth: 240 }}>
                <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 16 }}>Estado de membresías</p>
                <RingChart activas={d.dashStats.membresiasActivas} vencidas={d.dashStats.membresiasVencidas} />
              </div>
            )}
          </div>

          <div className="gt-card" style={{ marginBottom: 20 }}>
            <p className="gt-card-title" style={{ marginTop: 0 }}>Caja de los últimos {d.meses} meses</p>
            <div className="gt-indicadores gt-indicadores-3">
              <div><strong style={{ color: 'var(--green-text)' }}>{fmtARS(d.totalIngresos)}</strong><span>ingresos por pagos</span></div>
              <div><strong style={{ color: 'var(--red)' }}>{fmtARS(d.totalGastosMantenimiento)}</strong><span>gastos en máquinas</span></div>
              <div><strong style={{ color: balanceNeto >= 0 ? 'var(--green-text)' : 'var(--red)' }}>{fmtARS(balanceNeto)}</strong><span>balance neto</span></div>
            </div>
            {d.gastosPorMaquina.length > 0 && (
              <>
                <p className="gt-subtitulo" style={{ marginTop: 16 }}>Gasto por máquina</p>
                {d.gastosPorMaquina.map((maq, i) => (
                  <div key={i} className="gt-hoy-fila">
                    <span style={{ flex: 1, fontWeight: 600 }}>{maq.nro && <span className="gt-text-muted">[{maq.nro}] </span>}{maq.nombre}</span>
                    <span className="gt-text-muted gt-text-sm">{maq.reps} {maq.reps === 1 ? 'reparación' : 'reparaciones'}</span>
                    <span style={{ fontWeight: 700, minWidth: 90, textAlign: 'right' }}>{fmtARS(maq.costoTotal)}</span>
                  </div>
                ))}
              </>
            )}
            <FuenteDatos>
              <li><b>Ingresos:</b> pagos en estado completado (módulo Pagos), agrupados por el mes en que se cobraron.</li>
              <li><b>Gastos en máquinas:</b> el costo cargado en cada mantenimiento (Máquinas › Mantenimiento).</li>
              <li><b>Estado de membresías:</b> membresías activas contra vencidas en este momento.</li>
            </FuenteDatos>
          </div>
        </>
      )}

      {seccion === 'retencion' && (
        <>
          <RetencionMensual />
          <CohortesRetencion />
          <MotivosBaja />

          <div className="gt-publico-grid">
            <div className="gt-card">
              <div className="gt-card-cabecera">
                <p className="gt-card-title" style={{ margin: 0 }}>Por vencer</p>
                <select className="gt-select" style={{ width: 'auto' }} value={d.diasVencer} onChange={e => d.setDiasVencer(Number(e.target.value))} aria-label="Días">
                  {[7, 15, 30].map(x => <option key={x} value={x}>Próximos {x} días</option>)}
                </select>
              </div>
              {d.proximos.length === 0 ? <div className="gt-empty">No vence ninguna membresía en ese período.</div> : d.proximos.map(p => (
                <button key={p.socioId} type="button" className="gt-reporte-fila" onClick={() => d.navigate(`/socios/${p.socioId}/perfil`)}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong>{p.nombre}</strong>
                    <small>{p.tipoMembresia} · vence el {fechaCorta(p.fechaVencimiento)}</small>
                  </span>
                  <span className={`gt-badge ${p.diasRestantes <= 3 ? 'gt-badge-red' : p.diasRestantes <= 7 ? 'gt-badge-yellow' : 'gt-badge-green'}`}>
                    {p.diasRestantes === 0 ? 'hoy' : `${p.diasRestantes} días`}
                  </span>
                </button>
              ))}
            </div>
            <div className="gt-card">
              <div className="gt-card-cabecera">
                <p className="gt-card-title" style={{ margin: 0 }}>Dejaron de venir</p>
                <select className="gt-select" style={{ width: 'auto' }} value={d.diasInactivo} onChange={e => d.setDiasInactivo(Number(e.target.value))} aria-label="Días sin venir">
                  {[7, 14, 30].map(x => <option key={x} value={x}>Más de {x} días</option>)}
                </select>
              </div>
              {d.sinAsist.length === 0 ? <div className="gt-empty">Todos vinieron en ese período.</div> : d.sinAsist.map(s => (
                <button key={s.socioId} type="button" className="gt-reporte-fila" onClick={() => d.navigate(`/socios/${s.socioId}/perfil`)}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong>{s.nombre}</strong>
                    <small>DNI {s.dni}</small>
                  </span>
                  <span className="gt-text-sm" style={{ color: s.ultimaAsistencia === 'Nunca' ? 'var(--red)' : 'var(--text-muted)' }}>
                    {s.ultimaAsistencia === 'Nunca' ? 'Nunca vino' : `Última: ${fechaCorta(s.ultimaAsistencia)}`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {seccion === 'asistencia' && (
        <>
          <OcupacionHoraria />
          <div className="gt-card" style={{ marginBottom: 20 }}>
            <div className="gt-card-cabecera">
              <p className="gt-card-title" style={{ margin: 0 }}>Ingresos por día</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className="gt-input" type="date" style={{ width: 'auto' }} value={d.desde} onChange={e => d.setDesde(e.target.value)} aria-label="Desde" />
                <span className="gt-text-muted">a</span>
                <input className="gt-input" type="date" style={{ width: 'auto' }} value={d.hasta} onChange={e => d.setHasta(e.target.value)} aria-label="Hasta" />
                <button className="gt-btn gt-btn-primary" onClick={d.cargarAsistencias}>Consultar</button>
              </div>
            </div>
            {d.errorA && <div className="gt-alert gt-alert-error">{d.errorA}</div>}
            {d.loadingA ? <p className="gt-text-muted">Cargando…</p> : (
              <>
                <p className="gt-text-sm gt-text-muted" style={{ margin: '0 0 10px' }}>
                  <strong className="gt-numero-destacado">{d.totalAsistencias.toLocaleString('es-AR')}</strong> ingresos
                  {d.asistencias.length > 0 && ` · ${Math.round(d.totalAsistencias / d.asistencias.length)} por día en promedio`}
                </p>
                {d.asistencias.length === 0 ? <div className="gt-empty">Sin registros para el período seleccionado.</div> : (
                  <div className="gt-table-wrap">
                    <table className="gt-table">
                      <thead><tr><th>Fecha</th><th>Ingresos</th><th style={{ width: '60%' }}>Distribución</th></tr></thead>
                      <tbody>
                        {d.asistencias.map(a => (
                          <tr key={a.fecha}>
                            <td>{new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                            <td className="gt-fw-600">{a.total}</td>
                            <td><Barra valor={a.total} max={d.maxAsist} color="var(--accent)" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            <FuenteDatos>
              <li>Cada ingreso registrado en recepción, con el QR o con el DNI en la pantalla de ingreso, contado por día.</li>
            </FuenteDatos>
          </div>
        </>
      )}

      {seccion === 'publico' && <PublicoGimnasio />}
    </>
  )
}
