import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, LayoutTemplate } from 'lucide-react'
import { CargandoPagina, EmptyState, Pill } from '../../../shared/components/ui'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import { DIFICULTAD_CONFIG, OBJETIVO_CONFIG, etiquetaDia, ordenarDias } from '../../rutinas/utils/rutinaUtils'
import type { Ejercicio, Rutina } from '../../rutinas/types/Rutina'
import { ejerciciosDePlantilla, elegirPlantilla, plantillasParaSocio } from '../../rutinas/services/pedidosService'
import { useSocioApp } from '../SocioAppContext'

/** Plantillas del gimnasio: el socio mira los ejercicios y elige una como su rutina */
export default function SocioPlantillasPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { recargar } = useSocioApp()
  const [plantillas, setPlantillas] = useState<Rutina[] | null>(null)
  const [filtro, setFiltro] = useState('')
  const [abierta, setAbierta] = useState<number | null>(null)
  const [ejercicios, setEjercicios] = useState<Record<number, Ejercicio[]>>({})
  const [elegir, setElegir] = useState<Rutina | null>(null)
  const [eligiendo, setEligiendo] = useState(false)

  useEffect(() => { plantillasParaSocio().then(setPlantillas).catch(() => setPlantillas([])) }, [])

  const verEjercicios = (r: Rutina) => {
    const id = r.id!
    setAbierta(a => (a === id ? null : id))
    if (!ejercicios[id]) ejerciciosDePlantilla(id).then(e => setEjercicios(x => ({ ...x, [id]: e }))).catch(() => {})
  }

  const confirmar = async () => {
    if (!elegir || eligiendo) return
    setEligiendo(true)
    try {
      await elegirPlantilla(elegir.id!)
      await recargar()
      toast.success('¡Listo!', `"${elegir.nombre}" ya es tu rutina`)
      navigate('/mi-rutina')
    } catch (err) {
      toast.error('No se pudo elegir', mensajeError(err, 'Probá de nuevo'))
    } finally { setEligiendo(false); setElegir(null) }
  }

  if (!plantillas) return <CargandoPagina resumen={false} filas={3} />
  const objetivos = Array.from(new Set(plantillas.map(p => p.objetivo).filter((o): o is string => !!o)))
  const lista = plantillas.filter(p => !filtro || p.objetivo === filtro)

  return (
    <div className="gt-socio-pagina">
      <header className="gt-socio-titulo">
        <Link to="/mi-rutina" className="gt-socio-volver"><ArrowLeft size={16} aria-hidden /> Mi rutina</Link>
        <h1>Plantillas del gimnasio</h1>
        <p>Rutinas armadas por los profes. Elegí una y la empezás hoy.</p>
      </header>

      {objetivos.length > 1 && (
        <div className="gt-socio-filtros" role="radiogroup" aria-label="Objetivo">
          <button type="button" role="radio" aria-checked={!filtro} className={`gt-chip-btn${!filtro ? ' activo' : ''}`} onClick={() => setFiltro('')}>Todas</button>
          {objetivos.map(o => (
            <button key={o} type="button" role="radio" aria-checked={filtro === o} className={`gt-chip-btn${filtro === o ? ' activo' : ''}`} onClick={() => setFiltro(o)}>
              {OBJETIVO_CONFIG[o]?.emoji} {OBJETIVO_CONFIG[o]?.label ?? o}
            </button>
          ))}
        </div>
      )}

      {lista.length === 0 ? (
        <div className="gt-card">
          <EmptyState icono={LayoutTemplate} titulo="Todavía no hay plantillas"
            texto="Podés pedirle a tu profe una rutina a medida desde Mi rutina." />
        </div>
      ) : lista.map(p => {
        const obj = p.objetivo ? OBJETIVO_CONFIG[p.objetivo] : null
        const dif = p.dificultad ? DIFICULTAD_CONFIG[p.dificultad] : null
        const ejs = (ejercicios[p.id!] ?? []).filter(e => !e.esCalentamiento)
        const diasEj = Array.from(new Set(ejs.map(e => e.dia ?? 1))).sort((a, b) => a - b)
        const dias = ordenarDias(p.diasSemana)
        return (
          <article key={p.id} className="gt-card gt-socio-plantilla">
            <div className="gt-socio-bloque-cab" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <h2>{p.nombre}</h2>
                <p className="gt-text-sm gt-text-muted" style={{ margin: '4px 0 0' }}>
                  {p.cantidadEjercicios} {p.cantidadEjercicios === 1 ? 'ejercicio' : 'ejercicios'} · {Math.max(p.cantidadDias ?? 1, dias.length, 1)} {Math.max(p.cantidadDias ?? 1, dias.length, 1) === 1 ? 'día' : 'días'} por semana
                  {dif && ` · Nivel ${dif.label.toLowerCase()}`}
                </p>
              </div>
              {obj && <Pill tono="info">{obj.emoji} {obj.label}</Pill>}
            </div>
            {p.descripcion && <p className="gt-text-sm" style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>{p.descripcion}</p>}

            {abierta === p.id && (
              <div className="gt-socio-plantilla-ejs">
                {ejercicios[p.id!] === undefined ? <p className="gt-text-sm gt-text-muted">Cargando…</p> : diasEj.map(n => (
                  <div key={n}>
                    <p className="gt-preview-dia">{etiquetaDia(p.diasSemana, n)}</p>
                    <ol>
                      {ejs.filter(e => (e.dia ?? 1) === n).map(e => (
                        <li key={e.id}>{e.nombreEjercicio} <span className="gt-text-muted">— {e.series ?? '?'}×{e.repeticiones ?? '?'}</span></li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            <div className="gt-socio-plantilla-acciones">
              <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => verEjercicios(p)} aria-expanded={abierta === p.id}>
                {abierta === p.id ? <><ChevronUp size={14} aria-hidden /> Ocultar ejercicios</> : <><ChevronDown size={14} aria-hidden /> Ver ejercicios</>}
              </button>
              <button type="button" className="gt-btn gt-btn-primary gt-btn-sm" onClick={() => setElegir(p)}>Elegir esta</button>
            </div>
          </article>
        )
      })}

      <ConfirmModal open={elegir !== null} title={`Empezar "${elegir?.nombre ?? ''}"`}
        message="Pasa a ser tu rutina actual. La anterior queda guardada en Rutinas anteriores. Si después querés una a medida, se la podés pedir a tu profe."
        confirmLabel={eligiendo ? 'Eligiendo…' : 'Elegir esta rutina'} cancelLabel="Volver" onConfirm={confirmar} onCancel={() => setElegir(null)} />
    </div>
  )
}
