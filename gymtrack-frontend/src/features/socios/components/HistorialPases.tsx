import { useEffect, useState } from 'react'
import { Ban, CalendarX, LogIn, Repeat, Ticket } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { fechaLocalISO, formatFecha } from '../../../shared/utils/fechas'

interface Movimiento { fecha: string; hora: string | null; tipo: 'INGRESO' | 'FALTAZO' | 'DENEGADO'; detalle: string; gastaPase: boolean }
interface Ciclo { inicio: string; fin: string; usados: number; total: number | null }
interface Historial {
  tieneMembresia: boolean; plan: string | null; vence: string | null; reservasPorVenir: number
  actual: { libre: boolean; pasesMensuales: number | null; usados: number; restantes: number | null; cicloInicio: string; cicloFin: string } | null
  ciclosAnteriores: Ciclo[]; movimientos: Movimiento[]
}

const POR_TANDA = 8
const dia = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'numeric' })
const mes = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
const siguiente = (iso: string) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + 1); return fechaLocalISO(d) }

const ICONO = {
  INGRESO: LogIn,
  FALTAZO: CalendarX,
  DENEGADO: Ban,
} as const

/**
 * Pases del socio: cuántos le quedan en el mes, cuándo los usó (ingresos y faltazos a clases reservadas)
 * y cómo le fue en los meses anteriores.
 */
export default function HistorialPases({ socioId, esSocio }: { socioId: number | string; esSocio: boolean }) {
  const [h, setH] = useState<Historial | null>(null)
  const [mostrar, setMostrar] = useState(POR_TANDA)

  useEffect(() => {
    axiosInstance.get<Historial>(`/api/v1/membresias/socio/${socioId}/pases`, { params: { dias: 90 } })
      .then(r => setH(r.data)).catch(() => setH(null))
  }, [socioId])

  if (!h || (!h.tieneMembresia && h.movimientos.length === 0)) return null
  const a = h.actual
  const le = esSocio ? 'Te' : 'Le'
  const ultimo = h.movimientos.find(m => m.tipo === 'INGRESO')
  const pct = a && !a.libre && a.pasesMensuales ? Math.min(100, (a.usados / a.pasesMensuales) * 100) : 0
  const tono = !a || a.libre ? 'ok' : (a.restantes ?? 0) === 0 ? 'agotado' : (a.restantes ?? 0) <= 2 ? 'pocos' : 'ok'

  return (
    <section className="gt-card gt-hpases" aria-labelledby="pases-titulo">
      <div className="gt-card-cabecera">
        <h2 id="pases-titulo" className="gt-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ticket size={16} aria-hidden /> Pases
        </h2>
        {ultimo && <span className="gt-text-sm gt-text-muted">Último ingreso: {dia(ultimo.fecha)}{ultimo.hora ? ` · ${ultimo.hora}` : ''}</span>}
      </div>

      {a && (
        <div className={`gt-hpases-actual ${tono}`}>
          {a.libre ? (
            <span><strong>Pase libre</strong> · {a.usados} {a.usados === 1 ? 'día entrenado' : 'días entrenados'} en este ciclo ({mes(a.cicloInicio)} al {mes(a.cicloFin)})</span>
          ) : (
            <>
              <span>
                <strong>{a.restantes === 0 ? `${le} quedaron sin pases` : `${le} ${a.restantes === 1 ? 'queda' : 'quedan'} ${a.restantes} de ${a.pasesMensuales}`}</strong>
                {' '}· usó {a.usados} hasta el {mes(a.cicloFin)}
                {h.vence && siguiente(a.cicloFin) <= h.vence && <> · se renuevan el {mes(siguiente(a.cicloFin))}</>}
                {h.reservasPorVenir > 0 && <> · {h.reservasPorVenir} {h.reservasPorVenir === 1 ? 'clase reservada' : 'clases reservadas'} por venir</>}
              </span>
              <div className="gt-hpases-barra" role="img" aria-label={`Usó ${a.usados} de ${a.pasesMensuales} pases`}>
                <div style={{ width: `${pct}%` }} />
              </div>
            </>
          )}
        </div>
      )}

      {h.ciclosAnteriores.length > 0 && (
        <div className="gt-hpases-ciclos" aria-label="Meses anteriores">
          {h.ciclosAnteriores.map(c => (
            <span key={c.inicio} className="gt-hpases-ciclo" title={`Del ${formatFecha(c.inicio)} al ${formatFecha(c.fin)}`}>
              {mes(c.inicio)} – {mes(c.fin)}: <strong>{c.usados}</strong>{c.total ? ` de ${c.total}` : ` ${c.usados === 1 ? 'día' : 'días'}`}
            </span>
          ))}
        </div>
      )}

      <p className="gt-subtitulo" style={{ marginTop: 14 }}>Últimos 90 días</p>
      {h.movimientos.length === 0 ? (
        <p className="gt-text-sm gt-text-muted" style={{ margin: 0 }}>Todavía no hay ingresos registrados.</p>
      ) : (
        <ol className="gt-hpases-lista">
          {h.movimientos.slice(0, mostrar).map((m, i) => {
            const Icono = m.tipo === 'INGRESO' && !m.gastaPase ? Repeat : ICONO[m.tipo]
            return (
              <li key={`${m.fecha}-${m.hora}-${i}`} className={`gt-hpases-mov ${m.tipo.toLowerCase()}${m.gastaPase ? '' : ' sin-pase'}`}>
                <span className="gt-hpases-icono"><Icono size={14} aria-hidden /></span>
                <span className="gt-hpases-fecha">{dia(m.fecha)}{m.hora && <small>{m.hora}</small>}</span>
                <span className="gt-hpases-detalle">{m.detalle}</span>
                <span className="gt-hpases-efecto">{m.gastaPase ? '−1 pase' : m.tipo === 'DENEGADO' ? 'no entró' : 'sin costo'}</span>
              </li>
            )
          })}
        </ol>
      )}
      {h.movimientos.length > mostrar && (
        <button type="button" className="gt-btn-link" onClick={() => setMostrar(x => x + POR_TANDA * 3)}>
          Ver más ({h.movimientos.length - mostrar})
        </button>
      )}
    </section>
  )
}
