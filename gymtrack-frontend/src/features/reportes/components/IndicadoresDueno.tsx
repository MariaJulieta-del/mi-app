import { useEffect, useState } from 'react'
import { HeartHandshake } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import FuenteDatos from './FuenteDatos'
import { celdaPct } from '../utils/celdas'

interface Indicadores {
  ingresoMensualRecurrente: number
  ticketPromedio: number
  sociosVigentes: number
  bajaMensualPromedio: number | null
  valorPorSocio: number | null
  vidaPromedioMeses: number | null
  antiguedadPromedioMeses: number
  bajasPorMes: { mes: string; perdidos: number; base: number; tasa: number | null }[]
  cohortes: { mes: string; altas: number; retencion: (number | null)[] }[]
}
interface ResumenRetencion { avisosApp: number; tareasHechas: number; tareasPendientes: number; volvieron: number }

const pesos = (n: number | null | undefined) => (n == null ? '—' : `$${Math.round(Number(n)).toLocaleString('es-AR')}`)
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const mesCorto = (ym: string) => { const [y, m] = ym.split('-'); return `${MESES[Number(m) - 1]} ${y.slice(2)}` }


function useIndicadores() {
  const [d, setD] = useState<Indicadores | null>(null)
  useEffect(() => { axiosInstance.get<Indicadores>('/api/v1/reportes/indicadores').then(r => setD(r.data)).catch(() => {}) }, [])
  return d
}

/** Los cuatro números del negocio: lo que entra por mes, cuánto se va, cuánto deja un socio y la antigüedad */
export default function IndicadoresDueno() {
  const d = useIndicadores()
  if (!d) return null

  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <p className="gt-card-title" style={{ marginTop: 0 }}>Indicadores del negocio</p>
      <div className="gt-indicadores">
        <div>
          <strong>{pesos(d.ingresoMensualRecurrente)}</strong>
          <span>ingreso mensual recurrente</span>
          <small>{d.sociosVigentes} socios vigentes · {pesos(d.ticketPromedio)} promedio por socio</small>
        </div>
        <div>
          <strong>{d.bajaMensualPromedio == null ? '—' : `${d.bajaMensualPromedio.toLocaleString('es-AR')}%`}</strong>
          <span>se van por mes</span>
          <small>de los que estaban el mes anterior (promedio)</small>
        </div>
        <div>
          <strong>{pesos(d.valorPorSocio)}</strong>
          <span>deja un socio en total</span>
          <small>{d.vidaPromedioMeses ? `se queda ${d.vidaPromedioMeses.toLocaleString('es-AR')} meses en promedio` : 'falta historia para estimarlo'}</small>
        </div>
        <div>
          <strong>{d.antiguedadPromedioMeses.toLocaleString('es-AR')}</strong>
          <span>meses de antigüedad</span>
          <small>promedio de los socios activos</small>
        </div>
      </div>
      <FuenteDatos>
        <li><b>Ingreso mensual recurrente:</b> suma del precio de cada membresía vigente llevado a 30 días (un trimestral cuenta un tercio por mes).</li>
        <li><b>Se van por mes:</b> de los socios que tenían membresía el mes anterior, cuántos ya no la tienen o se dieron de baja. Promedio de los últimos 5 meses cerrados.</li>
        <li><b>Deja un socio:</b> ingreso promedio por socio × cuántos meses se queda (1 ÷ el porcentaje que se va por mes).</li>
        <li><b>Antigüedad:</b> días desde que se cargó cada socio activo en el sistema.</li>
      </FuenteDatos>
    </div>
  )
}

/** ¿Se quedan los nuevos? Retención por mes de alta + lo que hizo el staff para recuperar socios */
export function CohortesRetencion() {
  const d = useIndicadores()
  const [ret, setRet] = useState<ResumenRetencion | null>(null)
  useEffect(() => { axiosInstance.get<ResumenRetencion>('/api/v1/retencion/resumen').then(r => setRet(r.data)).catch(() => {}) }, [])
  if (!d) return null

  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <div className="gt-reporte-dos" style={{ marginBottom: 0 }}>
        <div style={{ minWidth: 0 }}>
          <p className="gt-card-title" style={{ marginTop: 0 }}>¿Se quedan los nuevos?</p>
          <div className="gt-table-wrap">
            <table className="gt-table gt-cohortes">
              <thead><tr><th>Empezaron</th><th>Altas</th><th>1 mes</th><th>2 meses</th><th>3 meses</th></tr></thead>
              <tbody>
                {d.cohortes.map(c => (
                  <tr key={c.mes}>
                    <td>{mesCorto(c.mes)}</td>
                    <td>{c.altas}</td>
                    {c.retencion.map((v, i) => <td key={i} style={celdaPct(v)}>{v == null ? '—' : `${v}%`}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="gt-text-sm gt-text-muted" style={{ margin: '6px 0 0' }}>Porcentaje de los que empezaron cada mes que siguen con la membresía al día.</p>
        </div>
        {ret && (
          <div className="gt-retencion-resumen">
            <p className="gt-subtitulo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><HeartHandshake size={14} aria-hidden /> Recupero (30 días)</p>
            <div><strong>{ret.avisosApp}</strong><span>avisos automáticos en la app</span></div>
            <div><strong>{ret.tareasHechas}</strong><span>socios contactados por el staff</span></div>
            <div><strong>{ret.volvieron}</strong><span>volvieron a entrenar después</span></div>
            {ret.tareasPendientes > 0 && <div><strong style={{ color: 'var(--yellow-text)' }}>{ret.tareasPendientes}</strong><span>tareas pendientes (en "Hoy")</span></div>}
          </div>
        )}
      </div>
      <FuenteDatos>
        <li><b>Empezaron:</b> el mes del primer pago de cada socio.</li>
        <li><b>1, 2 y 3 meses:</b> qué porcentaje de esos socios tenía una membresía que cubría algún día de ese mes (y no se había dado de baja).</li>
        <li><b>Recupero:</b> sale de las tareas de retención que se generan solas cada mañana (socios que dejan de venir, rutina vieja, membresía por vencer) y de si el socio volvió a pasar por el ingreso después del contacto.</li>
      </FuenteDatos>
    </div>
  )
}
