import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight, ClipboardList, Play } from 'lucide-react'
import { CargandoPagina, EmptyState, Pill } from '../../../shared/components/ui'
import { formatFecha } from '../../../shared/utils/fechas'
import { OBJETIVO_CONFIG, ordenarDias } from '../../rutinas/utils/rutinaUtils'
import type { Rutina } from '../../rutinas/types/Rutina'
import { useSocioApp } from '../SocioAppContext'
import { diaDeHoy } from '../utils'
import PedidoRutinaSocio from '../components/PedidoRutinaSocio'

/** Las rutinas del socio: la actual con sus días para entrenar, y las anteriores */
export default function SocioRutinaPage() {
  const { rutinas, cargando } = useSocioApp()
  if (cargando) return <CargandoPagina resumen={false} filas={3} />

  if (rutinas.length === 0) {
    return (
      <div className="gt-socio-pagina">
        <header className="gt-socio-titulo"><h1>Mi rutina</h1></header>
        <div className="gt-card">
          <EmptyState icono={ClipboardList} titulo="Todavía no tenés rutina"
            texto="Elegí una de las plantillas del gimnasio o pedile a tu profe una a medida." />
        </div>
        <PedidoRutinaSocio />
      </div>
    )
  }
  const [actual, ...anteriores] = rutinas

  return (
    <div className="gt-socio-pagina">
      <header className="gt-socio-titulo">
        <h1>Mi rutina</h1>
        <p>Elegí el día y tocá Entrenar</p>
      </header>
      <RutinaActual r={actual} />
      <PedidoRutinaSocio />
      {anteriores.length > 0 && (
        <section className="gt-card gt-socio-bloque">
          <div className="gt-socio-bloque-cab"><h3>Rutinas anteriores</h3></div>
          {anteriores.map(r => (
            <Link key={r.id} to={`/rutinas/${r.id}`} className="gt-socio-fila-link">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{r.nombre}</strong>
                <small>{r.fechaCreacion ? `Desde el ${formatFecha(r.fechaCreacion)}` : ''}{r.semanasActual != null ? ` · ${r.semanasActual} ${r.semanasActual === 1 ? 'semana' : 'semanas'}` : ''}{r.cantidadEjercicios ? ` · ${r.cantidadEjercicios} ejercicios` : ''}</small>
              </span>
              <ChevronRight size={18} aria-hidden />
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}

function RutinaActual({ r }: { r: Rutina }) {
  const [ahora] = useState(() => Date.now())
  const dias = ordenarDias(r.diasSemana)
  const cantidadDias = Math.max(dias.length, r.cantidadDias ?? 1, 1)
  const hoy = diaDeHoy()
  const obj = r.objetivo ? OBJETIVO_CONFIG[r.objetivo] : null
  // Desde cuándo hace esta rutina: la última vez que el profe le cambió los ejercicios (o cuando se la armó)
  const desde = r.fechaRenovacion ?? r.fechaCreacion ?? null
  const semanas = r.semanasActual ?? (desde ? Math.floor((ahora - new Date(desde).getTime()) / (7 * 86400000)) : null)

  return (
    <section className="gt-card gt-socio-rutina">
      <div className="gt-socio-bloque-cab" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{r.nombre}</h2>
          <p className="gt-text-sm gt-text-muted" style={{ margin: '4px 0 0' }}>
            {r.cantidadEjercicios ?? 0} {r.cantidadEjercicios === 1 ? 'ejercicio' : 'ejercicios'} · {cantidadDias} {cantidadDias === 1 ? 'día' : 'días'}
          </p>
        </div>
        {obj && <Pill tono="info" icono={obj.icono}>{obj.label}</Pill>}
      </div>
      {semanas != null && <AntiguedadRutina semanas={semanas} max={r.semanasMax ?? null} desde={desde} renovar={!!r.paraRenovar} />}
      {r.descripcion && <p className="gt-text-sm" style={{ color: 'var(--text-secondary)' }}>{r.descripcion}</p>}
      {r.notasProfe && (
        <div className="gt-notas-profe" role="note">
          <strong>Indicaciones de tu profe</strong>
          <p>{r.notasProfe}</p>
        </div>
      )}
      <div className="gt-socio-dias-rutina">
        {Array.from({ length: cantidadDias }, (_, i) => {
          const n = i + 1
          const nombre = dias[i]
          const esHoy = nombre === hoy
          return (
            <div key={n} className={`gt-socio-dia-rutina${esHoy ? ' hoy' : ''}`}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>Día {n}{nombre ? ` · ${nombre}` : ''}</strong>
                {esHoy && <small>Te toca hoy</small>}
              </span>
              <Link to={`/rutinas/${r.id}?dia=${n}`} className="gt-btn gt-btn-secondary gt-btn-sm">Ver</Link>
              <Link to={`/rutinas/${r.id}/entrenar?dia=${n}`} className={`gt-btn gt-btn-sm ${esHoy ? 'gt-btn-primary' : 'gt-btn-secondary'}`}>
                <Play size={14} aria-hidden /> Entrenar
              </Link>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Cuánto hace que hace la misma rutina y cuánto le falta para renovarla (el límite lo pone el gimnasio) */
function AntiguedadRutina({ semanas, max, desde, renovar }: { semanas: number; max: number | null; desde: string | null; renovar: boolean }) {
  const actual = semanas + 1
  const pct = max ? Math.min(100, (actual / max) * 100) : 0
  const faltan = max ? max - semanas : null
  return (
    <div className={`gt-socio-antiguedad${renovar ? ' renovar' : faltan != null && faltan <= 1 ? ' pronto' : ''}`}>
      <CalendarClock size={18} aria-hidden />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong>
          {renovar ? `Hace ${semanas} semanas que hacés esta rutina` : max ? `Semana ${actual} de ${max}` : `Semana ${actual} con esta rutina`}
        </strong>
        <span>
          {desde && <>La hacés desde el {formatFecha(desde)}. </>}
          {renovar ? 'Ya es momento de cambiarla: pedile a tu profe que te la renueve para seguir progresando.'
            : faltan != null ? (faltan <= 1 ? 'Esta es la última semana: después toca renovarla.' : `Te quedan ${faltan} semanas antes de renovarla.`) : ''}
        </span>
        {max != null && (
          <div className="gt-socio-antiguedad-barra" role="img" aria-label={`Semana ${Math.min(actual, max)} de ${max}`}>
            <div style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
