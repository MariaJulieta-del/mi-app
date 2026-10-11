import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Rutina, Ejercicio } from '../types/Rutina'
import { obtenerEjercicios } from '../services/rutinaService'
import { TREN_CONFIG, TREN_DEFAULT, DIFICULTAD_CONFIG, OBJETIVO_CONFIG, DIAS_ORDER, etiquetaDia, esPlantilla } from '../utils/rutinaUtils'

const DIA_CORTO: Record<string, string> = {
  Lunes: 'L', Martes: 'M', Miércoles: 'X', Jueves: 'J', Viernes: 'V', Sábado: 'S', Domingo: 'D',
}

interface Props {
  rutina: Rutina
  /** Botones al pie de la tarjeta */
  acciones?: ReactNode
  /** Tarjeta seleccionable (asistente) */
  seleccionada?: boolean
  onSeleccionar?: () => void
  /** Mostrar a qué socio pertenece */
  mostrarSocio?: boolean
  /** Toda la tarjeta abre el detalle */
  href?: string
}

/**
 * Tarjeta de rutina/plantilla: trenes, dificultad, días, cantidad de ejercicios
 * y una vista previa desplegable de los ejercicios organizados por día.
 */
export default function RutinaCard({ rutina, acciones, seleccionada, onSeleccionar, mostrarSocio, href }: Props) {
  const [abierta, setAbierta] = useState(false)
  const [ejercicios, setEjercicios] = useState<Ejercicio[] | null>(null)
  const [cargando, setCargando] = useState(false)

  const tren = rutina.trenes?.[0] ? (TREN_CONFIG[rutina.trenes[0]] ?? TREN_DEFAULT) : TREN_DEFAULT
  const dif = rutina.dificultad ? DIFICULTAD_CONFIG[rutina.dificultad] : null
  const obj = rutina.objetivo ? OBJETIVO_CONFIG[rutina.objetivo] : null

  const togglePreview = async () => {
    setAbierta(a => !a)
    if (ejercicios === null && rutina.id) {
      setCargando(true)
      try { setEjercicios(await obtenerEjercicios(rutina.id, rutina.socioId ?? null)) }
      catch { setEjercicios([]) }
      finally { setCargando(false) }
    }
  }

  const principales = (ejercicios ?? []).filter(e => !e.esCalentamiento)
  const dias = Array.from(new Set(principales.map(e => e.dia ?? 1))).sort((a, b) => a - b)

  return (
    <div className={`gt-rutina-card${seleccionada ? ' selected' : ''}`}>
      <div style={{ height: 5, background: tren.color }} />
      <div
        style={{ padding: '14px 16px', flex: 1, cursor: onSeleccionar ? 'pointer' : 'default' }}
        onClick={onSeleccionar}
        role={onSeleccionar ? 'button' : undefined}
        tabIndex={onSeleccionar ? 0 : undefined}
        onKeyDown={e => { if (onSeleccionar && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSeleccionar() } }}
      >
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {(rutina.trenes?.length ? rutina.trenes : ['']).map(t => {
            const cfg = TREN_CONFIG[t] ?? TREN_DEFAULT
            return <span key={t || 'x'} className="gt-chip" style={{ background: cfg.bg, color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
          })}
          {obj && <span className="gt-chip" style={{ background: obj.bg, color: obj.color }}>{obj.emoji} {obj.label}</span>}
          {dif && <span className="gt-chip" style={{ background: dif.bg, color: dif.color }}>Dificultad {dif.label.toLowerCase()}</span>}
          {!esPlantilla(rutina) && rutina.semanasMax != null && (
            rutina.paraRenovar
              ? <span className="gt-chip gt-chip-renovar" title={`Lleva ${rutina.semanasActual} semanas con estos ejercicios (el límite es ${rutina.semanasMax})`}>⏰ Renovar · {rutina.semanasActual} sem.</span>
              : <span className="gt-chip gt-chip-semana" title={`Se renueva a las ${rutina.semanasMax} semanas`}>Semana {(rutina.semanasActual ?? 0) + 1} de {rutina.semanasMax}</span>
          )}
          {esPlantilla(rutina) && rutina.visibleSocios === false && (
            <span className="gt-chip gt-chip-semana" title="Los socios no la ven en su app">Oculta para socios</span>
          )}
          {!esPlantilla(rutina) && rutina.elegidaPorSocio && (
            <span className="gt-chip" style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)' }} title="El socio la eligió de las plantillas desde su app">La eligió el socio</span>
          )}
          {mostrarSocio && !esPlantilla(rutina) && (
            <span className="gt-chip" style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)' }}>👤 {rutina.socioNombre}</span>
          )}
        </div>

        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
          {seleccionada && '✓ '}
          {href ? <Link to={href} className="gt-rutina-card-link">{rutina.nombre}</Link> : rutina.nombre}
        </p>
        {rutina.descripcion && (
          <p className="gt-text-muted" style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.4 }}>
            {rutina.descripcion.length > 90 ? rutina.descripcion.slice(0, 90) + '…' : rutina.descripcion}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {(rutina.diasSemana?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', gap: 3 }} aria-label={`Días: ${rutina.diasSemana!.join(', ')}`}>
              {DIAS_ORDER.map(d => (
                <span key={d} className={`gt-dia-dot${rutina.diasSemana!.includes(d) ? ' on' : ''}`} title={d}>{DIA_CORTO[d]}</span>
              ))}
            </div>
          )}
          <span className="gt-text-muted gt-text-sm">
            {rutina.cantidadEjercicios ?? 0} ejercicios
            {(rutina.cantidadDias ?? 0) > 1 && ` · ${rutina.cantidadDias} días`}
          </span>
        </div>
      </div>

      {abierta && (
        <div className="gt-rutina-preview">
          {cargando ? <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>Cargando ejercicios…</p>
            : principales.length === 0 ? <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>Todavía no tiene ejercicios.</p>
            : dias.map(n => (
              <div key={n} style={{ marginBottom: 8 }}>
                <p className="gt-preview-dia">{etiquetaDia(rutina.diasSemana, n)}</p>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {principales.filter(e => (e.dia ?? 1) === n).map(e => (
                    <li key={e.id} className="gt-text-sm" style={{ color: 'var(--text-secondary)', padding: '1px 0' }}>
                      {e.nombreEjercicio}
                      <span className="gt-text-muted"> — {e.series ?? '?'}×{e.repeticiones ?? '?'}{e.descansoSeg ? ` · ${e.descansoSeg}s` : ''}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
        </div>
      )}

      <div className="gt-rutina-card-actions">
        <button type="button" onClick={togglePreview}>{abierta ? 'Ocultar ejercicios' : 'Ver ejercicios'}</button>
        {acciones}
      </div>
    </div>
  )
}
