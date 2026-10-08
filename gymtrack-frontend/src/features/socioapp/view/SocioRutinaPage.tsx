import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList, Play } from 'lucide-react'
import { CargandoPagina, EmptyState, Pill } from '../../../shared/components/ui'
import { formatFecha } from '../../../shared/utils/fechas'
import { OBJETIVO_CONFIG, ordenarDias } from '../../rutinas/utils/rutinaUtils'
import type { Rutina } from '../../rutinas/types/Rutina'
import { useSocioApp } from '../SocioAppContext'
import { diaDeHoy } from '../utils'

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
            texto="Pedile a tu profe que te arme una. Vas a ver cada ejercicio con su video y la máquina donde hacerlo." />
        </div>
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
      {anteriores.length > 0 && (
        <section className="gt-card gt-socio-bloque">
          <div className="gt-socio-bloque-cab"><h3>Rutinas anteriores</h3></div>
          {anteriores.map(r => (
            <Link key={r.id} to={`/rutinas/${r.id}`} className="gt-socio-fila-link">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{r.nombre}</strong>
                <small>{r.fechaCreacion ? `Desde el ${formatFecha(r.fechaCreacion)}` : ''}{r.cantidadEjercicios ? ` · ${r.cantidadEjercicios} ejercicios` : ''}</small>
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
  const semanas = r.fechaCreacion ? Math.floor((ahora - new Date(r.fechaCreacion).getTime()) / (7 * 86400000)) : null

  return (
    <section className="gt-card gt-socio-rutina">
      <div className="gt-socio-bloque-cab" style={{ alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>{r.nombre}</h2>
          <p className="gt-text-sm gt-text-muted" style={{ margin: '4px 0 0' }}>
            {r.cantidadEjercicios ?? 0} ejercicios · {cantidadDias} {cantidadDias === 1 ? 'día' : 'días'}
            {semanas != null && ` · hace ${semanas === 0 ? 'menos de una semana' : `${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`}`}
          </p>
        </div>
        {obj && <Pill tono="info">{obj.emoji} {obj.label}</Pill>}
      </div>
      {r.descripcion && <p className="gt-text-sm" style={{ color: 'var(--text-secondary)' }}>{r.descripcion}</p>}
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
