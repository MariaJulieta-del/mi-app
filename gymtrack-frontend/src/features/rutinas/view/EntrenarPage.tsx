import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Calculator, Check, Expand, Feather, Flame, Link2, PartyPopper, Plus, Star, ThumbsUp, Timer, Trophy, X } from 'lucide-react'
import { useAuth } from '../../../shared/context/AuthContext'
import { obtenerRutina, obtenerEjercicios } from '../services/rutinaService'
import { guardarProgreso, getProgresoRutina } from '../services/progresoService'
import { resolverImgEstatica } from '../hooks/useRutinasDetail'
import { etiquetaDia, OBJETIVO_CONFIG } from '../utils/rutinaUtils'
import type { Rutina, Ejercicio } from '../types/Rutina'
import MaquinasEjercicio from '../components/MaquinasEjercicio'
import CalculadoraDiscos from '../components/CalculadoraDiscos'
import { fechaLocalISO, formatFecha } from '../../../shared/utils/fechas'
import { CargandoPagina, Spinner } from '../../../shared/components/ui'
import { pitido, prepararAudio } from '../../../shared/utils/sonido'
import { mensajeError } from '../../../shared/utils/errores'
import {
  obtenerRecords, registrarSesion, SENSACIONES, unoRM, type RecordPersonal, type Sensacion,
} from '../../socioapp/services/socioAppService'

interface Serie { kg: string; reps: string; hecha: boolean }
interface Ultima { fecha: string; pesoKg: number | null; reps: number | null; series: number | null; rpe: number | null }
interface Sugerencia { kg: number | null; reps: number | null; texto: string }
interface RecordNuevo { ejercicio: string; kg: number; e1rm: number; tipo: 'peso' | 'e1rm' }

/** Esfuerzo percibido: tres opciones simples en vez de la escala de 1 a 10 */
const ESFUERZOS = [
  { rpe: 6, icono: Feather, texto: 'Fácil' },
  { rpe: 8, icono: ThumbsUp, texto: 'Justo' },
  { rpe: 10, icono: Flame, texto: 'Al límite' },
]

/**
 * Progresión según el objetivo de la rutina, si la última vez completó todas las series:
 *  - Fuerza / hipertrofia: subir la carga (2,5 kg; 1 kg en cargas livianas).
 *  - Resistencia / pérdida de grasa / salud: sumar 2 repeticiones con el mismo peso; cuando ya hace
 *    6 o más por encima de lo pedido, subir un poco la carga y volver a las repeticiones base.
 * Si la última vez quedó "al límite", se mantiene la carga.
 */
function sugerir(ej: Ejercicio, ultima: Ultima | undefined, objetivo: string | null | undefined): Sugerencia | null {
  if (!ultima) return null
  const objetivoReps = ej.repeticiones ?? 10
  const completo = (ultima.series ?? 0) >= (ej.series ?? 1) && (ultima.reps ?? 0) >= objetivoReps
  if (!completo) return null
  if ((ultima.rpe ?? 0) >= 10) return { kg: ultima.pesoKg, reps: objetivoReps, texto: 'La última vez fue al límite: mantené el peso' }
  const paso = (ultima.pesoKg ?? 0) < 20 ? 1 : 2.5
  const subir = (kg: number) => Math.round((kg + paso) * 10) / 10
  const progresion = OBJETIVO_CONFIG[objetivo ?? '']?.progresion ?? 'carga'

  if (progresion === 'carga') {
    if (ultima.pesoKg == null) return null
    const kg = subir(ultima.pesoKg)
    return { kg, reps: objetivoReps, texto: `Probá con ${kg.toLocaleString('es-AR')} kg` }
  }
  const reps = (ultima.reps ?? objetivoReps)
  if (reps - objetivoReps >= 6 && ultima.pesoKg != null) {
    const kg = subir(ultima.pesoKg)
    return { kg, reps: objetivoReps, texto: `Subí a ${kg.toLocaleString('es-AR')} kg × ${objetivoReps}` }
  }
  return { kg: ultima.pesoKg, reps: reps + 2, texto: `Probá ${reps + 2} repeticiones` }
}

/** Fuera del componente: el reloj se lee solo en los eventos */
const marcaDeTiempo = () => Date.now()

const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))
const kgTxt = (n: number) => `${n.toLocaleString('es-AR')} kg`

/** Agrupa los ejercicios del día: los seguidos con la misma superserie van juntos en un paso */
function agrupar(ejs: Ejercicio[]): Ejercicio[][] {
  const grupos: Ejercicio[][] = []
  for (const e of ejs) {
    const ult = grupos[grupos.length - 1]
    if (ult && e.superserie != null && ult[0].superserie === e.superserie) ult.push(e)
    else grupos.push([e])
  }
  return grupos
}

/**
 * Modo entrenamiento: un paso por pantalla (un ejercicio, o varios si van en superserie),
 * tilde por serie, descanso con aviso, lo que hizo la vez anterior, esfuerzo, récords
 * y al final cómo se sintió (lo ve el profe).
 */
export default function EntrenarPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const esSocio = user?.rol === 'SOCIO'
  const rutinaId = Number(id)
  const socioId = esSocio ? user?.socioId ?? null : (params.get('socioId') ? Number(params.get('socioId')) : null)
  const dia = Number(params.get('dia') ?? 1)
  const [hoyISO] = useState(() => fechaLocalISO())
  const claveLocal = `gt-entreno-${rutinaId}-${dia}-${hoyISO}`

  const [rutina, setRutina] = useState<Rutina | null>(null)
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [calentamiento, setCalentamiento] = useState<Ejercicio[]>([])
  /** Si la rutina tiene entrada en calor, va primero (se puede saltear). null = cargando */
  const [conCalor, setConCalor] = useState<boolean | null>(null)
  const [ultimas, setUltimas] = useState<Record<number, Ultima>>({})
  const [series, setSeries] = useState<Record<number, Serie[]>>({})
  const [rpe, setRpe] = useState<Record<number, number>>({})
  const [paso, setPaso] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [terminado, setTerminado] = useState(false)
  const [inicio] = useState(() => Date.now())
  const [fin, setFin] = useState<number | null>(null)
  const [imagenGrande, setImagenGrande] = useState<{ url: string; nombre: string } | null>(null)
  const [discos, setDiscos] = useState<number | null>(null)

  // Récords: los de antes de hoy, y los que batió en esta sesión
  const [records, setRecords] = useState<Map<string, RecordPersonal>>(new Map())
  const [nuevos, setNuevos] = useState<RecordNuevo[]>([])
  const [festejo, setFestejo] = useState<RecordNuevo | null>(null)

  // Final
  const [sensacion, setSensacion] = useState<Sensacion | null>(null)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Descanso
  const [descansoFin, setDescansoFin] = useState<number | null>(null)
  const [descansoTotal, setDescansoTotal] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())

  // ── Carga ──
  useEffect(() => {
    if (!socioId) return
    obtenerRecords(socioId, true)
      .then(rs => setRecords(new Map(rs.map(r => [r.ejercicio.trim().toLowerCase(), r]))))
      .catch(() => {})
    Promise.all([obtenerRutina(rutinaId, socioId), obtenerEjercicios(rutinaId, socioId), getProgresoRutina(socioId, rutinaId).catch(() => ({}))])
      .then(([r, ejs, prog]) => {
        setRutina(r)
        const delDia = ejs.filter(e => !e.esCalentamiento && (e.dia ?? 1) === dia).sort((a, b) => a.orden - b.orden)
        setEjercicios(delDia)
        const calor = ejs.filter(e => e.esCalentamiento).sort((a, b) => a.orden - b.orden)
        setCalentamiento(calor)
        const hoy = fechaLocalISO()
        const ult: Record<number, Ultima> = {}
        for (const [ejId, regs] of Object.entries(prog as Record<string, Array<{ fecha: string; pesoKg: number | null; repeticionesReales: number | null; seriesRealizadas: number | null; rpe?: number | null }>>)) {
          const previo = regs.find(r => r.fecha !== hoy)
          if (previo) ult[Number(ejId)] = { fecha: previo.fecha, pesoKg: previo.pesoKg, reps: previo.repeticionesReales, series: previo.seriesRealizadas, rpe: previo.rpe ?? null }
        }
        setUltimas(ult)

        // Retomar un entrenamiento de hoy si se recargó la página
        let guardado: { series: Record<number, Serie[]>; paso: number; conCalor?: boolean; rpe?: Record<number, number> } | null = null
        try { guardado = JSON.parse(localStorage.getItem(claveLocal) ?? 'null') } catch { /* sin almacenamiento */ }
        const inicial: Record<number, Serie[]> = {}
        for (const e of delDia) {
          const sug = sugerir(e, ult[e.id!], r.objetivo)
          const kg = sug?.kg ?? ult[e.id!]?.pesoKg ?? e.pesoKg ?? null
          const reps = sug?.reps ?? e.repeticiones ?? 10
          inicial[e.id!] = guardado?.series[e.id!] ?? Array.from({ length: e.series ?? 3 }, () => ({
            kg: kg != null ? String(kg) : '', reps: String(reps), hecha: false,
          }))
        }
        for (const e of calor) {
          inicial[e.id!] = guardado?.series[e.id!] ?? Array.from({ length: e.series ?? 1 }, () => ({
            kg: '', reps: String(e.repeticiones ?? 10), hecha: false,
          }))
        }
        setSeries(inicial)
        if (guardado?.rpe) setRpe(guardado.rpe)
        const gruposMain = agrupar(delDia).length
        if (guardado && guardado.conCalor !== undefined) {
          const hizoCalor = guardado.conCalor && calor.length > 0
          setConCalor(hizoCalor)
          setPaso(Math.min(guardado.paso, (hizoCalor ? calor.length : 0) + gruposMain - 1))
        } else {
          setConCalor(calor.length > 0)
          setPaso(0)
        }
      })
      .catch(() => setError('No se pudo cargar la rutina'))
  }, [rutinaId, socioId, dia]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ejercicios.length === 0 || conCalor === null) return
    try { localStorage.setItem(claveLocal, JSON.stringify({ series, paso, conCalor, rpe })) } catch { /* sin almacenamiento */ }
  }, [series, paso, conCalor, rpe]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mantener la pantalla encendida mientras entrena (si el navegador lo permite)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [])

  // Reloj del descanso: al terminar suena y vibra
  useEffect(() => {
    if (descansoFin == null) return
    const t = setInterval(() => {
      const n = Date.now()
      setAhora(n)
      if (n >= descansoFin) {
        setDescansoFin(null)
        pitido()
        navigator.vibrate?.([250, 120, 250, 120, 400])
      }
    }, 250)
    return () => clearInterval(t)
  }, [descansoFin])

  // El cartel de récord se va solo
  useEffect(() => {
    if (!festejo) return
    const t = setTimeout(() => setFestejo(null), 3500)
    return () => clearTimeout(t)
  }, [festejo])

  const pasos = useMemo<Ejercicio[][]>(
    () => [...(conCalor ? calentamiento.map(c => [c]) : []), ...agrupar(ejercicios)],
    [conCalor, calentamiento, ejercicios],
  )
  const grupo = pasos[paso] ?? []
  const esCalor = !!grupo[0]?.esCalentamiento
  const esSuperserie = grupo.length > 1
  const objetivo = rutina?.objetivo ? OBJETIVO_CONFIG[rutina.objetivo] : null

  const resumen = useMemo(() => {
    let seriesHechas = 0, volumen = 0, ejerciciosHechos = 0
    for (const e of ejercicios) {
      const hechas = (series[e.id!] ?? []).filter(s => s.hecha)
      if (hechas.length) ejerciciosHechos++
      seriesHechas += hechas.length
      volumen += hechas.reduce((acc, s) => acc + (num(s.kg) ?? 0) * (num(s.reps) ?? 0), 0)
    }
    return { seriesHechas, volumen: Math.round(volumen), ejerciciosHechos }
  }, [ejercicios, series])

  const actualizar = (ejId: number, i: number, campo: keyof Serie, valor: string | boolean) =>
    setSeries(prev => ({ ...prev, [ejId]: prev[ejId].map((s, j) => (j === i ? { ...s, [campo]: valor } : s)) }))

  const tildar = (e: Ejercicio, i: number) => {
    prepararAudio()
    const filas = series[e.id!] ?? []
    const marcar = !filas[i].hecha
    actualizar(e.id!, i, 'hecha', marcar)
    if (!marcar) return
    // Descanso: en superserie, recién cuando terminó esa vuelta en todos los ejercicios
    const vueltaCompleta = grupo.every(x => x.id === e.id || (series[x.id!] ?? [])[i]?.hecha)
    const quedanSeries = grupo.some(x => (series[x.id!] ?? []).length - 1 > i)
    const seg = Math.max(...grupo.map(x => x.descansoSeg ?? 0))
    if (vueltaCompleta && quedanSeries && seg > 0) {
      const n = marcaDeTiempo()
      setDescansoFin(n + seg * 1000)
      setDescansoTotal(seg)
      setAhora(n)
    }
  }

  /** Guarda los ejercicios del paso actual (los que tengan al menos una serie hecha) y detecta récords */
  const guardarPaso = async () => {
    if (!socioId || esCalor) return   // la entrada en calor no se registra como progreso
    for (const e of grupo) {
      const hechas = (series[e.id!] ?? []).filter(s => s.hecha)
      if (hechas.length === 0) continue
      const pesos = hechas.map(s => num(s.kg)).filter((n): n is number => n != null)
      const reps = hechas.map(s => num(s.reps)).filter((n): n is number => n != null)
      await guardarProgreso({
        socioId, rutinaEjercicioId: e.id!,
        pesoKg: pesos.length ? Math.max(...pesos) : null,
        repeticionesReales: reps.length ? Math.min(...reps) : null,
        seriesRealizadas: hechas.length,
        rpe: rpe[e.id!] ?? null,
      })
      // ¿Récord? Mejor serie de hoy contra lo mejor de antes
      const mejor = hechas.reduce<{ kg: number; e1rm: number } | null>((acc, s) => {
        const k = num(s.kg), r = num(s.reps)
        if (!k || k <= 0) return acc
        const e1 = unoRM(k, r ?? 1)
        return !acc || e1 > acc.e1rm ? { kg: k, e1rm: e1 } : acc
      }, null)
      const pesoHoy = pesos.length ? Math.max(...pesos) : 0
      const antes = records.get(e.nombreEjercicio.trim().toLowerCase())
      if (mejor && antes && !nuevos.some(n => n.ejercicio === e.nombreEjercicio)) {
        let nuevo: RecordNuevo | null = null
        if (antes.pesoMax != null && pesoHoy > Number(antes.pesoMax)) nuevo = { ejercicio: e.nombreEjercicio, kg: pesoHoy, e1rm: mejor.e1rm, tipo: 'peso' }
        else if (antes.e1rm != null && mejor.e1rm > Number(antes.e1rm)) nuevo = { ejercicio: e.nombreEjercicio, kg: mejor.kg, e1rm: mejor.e1rm, tipo: 'e1rm' }
        if (nuevo) {
          setNuevos(prev => [...prev, nuevo!])
          setFestejo(nuevo)
          navigator.vibrate?.([80, 60, 80, 60, 200])
        }
      }
    }
  }

  const irA = async (nuevo: number) => {
    setGuardando(true); setError(null)
    try {
      await guardarPaso()
      setDescansoFin(null)
      if (nuevo >= pasos.length) {
        setTerminado(true)
        setFin(Date.now())
        try { localStorage.removeItem(claveLocal) } catch { /* sin almacenamiento */ }
      } else {
        setPaso(Math.max(0, nuevo))
        window.scrollTo({ top: 0 })
      }
    } catch {
      setError('No se pudo guardar. Revisá la conexión y probá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const volver = rutina ? `/rutinas/${rutinaId}${esSocio ? `?dia=${dia}` : `?socioId=${socioId}`}` : '/'

  const terminar = async () => {
    if (!rutina) return
    setEnviando(true)
    try {
      await registrarSesion({
        socioId: esSocio ? null : socioId, rutinaId, dia,
        duracionMin: Math.max(1, Math.round(((fin ?? Date.now()) - inicio) / 60000)),
        series: resumen.seriesHechas, volumenKg: resumen.volumen, records: nuevos.length,
        sensacion, comentario: comentario.trim() || undefined,
      })
      navigate(esSocio ? '/progreso' : volver)
    } catch (e: unknown) {
      setError(mensajeError(e, 'No se pudo guardar el entrenamiento'))
    } finally { setEnviando(false) }
  }

  if (!socioId) return <div className="gt-alert gt-alert-error">Falta el socio</div>
  if (error && !rutina) return <div className="gt-alert gt-alert-error">{error}</div>
  if (!rutina) return <CargandoPagina resumen={false} filas={4} />
  if (ejercicios.length === 0) {
    return (
      <div className="gt-card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p>Este día no tiene ejercicios.</p>
        <Link to={volver} className="gt-btn gt-btn-secondary">Volver a la rutina</Link>
      </div>
    )
  }

  // ── Resumen final ──
  if (terminado) {
    const minutos = Math.max(1, Math.round(((fin ?? inicio) - inicio) / 60000))
    return (
      <div className="gt-entreno">
        <div className="gt-card gt-entreno-fin">
          <p className="gt-entreno-fin-emoji" aria-hidden>{nuevos.length ? <Trophy size={48} /> : <PartyPopper size={48} />}</p>
          <h1>¡Entrenamiento terminado!</h1>
          <p className="gt-text-muted" style={{ margin: 0 }}>{rutina.nombre} · {etiquetaDia(rutina.diasSemana, dia)}</p>
          <div className="gt-progreso-stats" style={{ margin: '18px 0' }}>
            <div><span className="gt-progreso-num">{resumen.ejerciciosHechos}/{ejercicios.length}</span><span className="gt-stat-label">ejercicios</span></div>
            <div><span className="gt-progreso-num">{resumen.seriesHechas}</span><span className="gt-stat-label">series</span></div>
            <div><span className="gt-progreso-num">{minutos}′</span><span className="gt-stat-label">duración</span></div>
          </div>
          {resumen.volumen > 0 && (
            <p className="gt-text-muted" style={{ marginTop: 0 }}>Levantaste <strong style={{ color: 'var(--text-primary)' }}>{resumen.volumen.toLocaleString('es-AR')} kg</strong> en total.</p>
          )}
          {nuevos.length > 0 && (
            <div className="gt-entreno-records">
              <strong><Star size={16} aria-hidden /> {nuevos.length === 1 ? 'Nuevo récord' : `${nuevos.length} récords nuevos`}</strong>
              {nuevos.map(n => <span key={n.ejercicio}>{n.ejercicio}: {kgTxt(n.kg)}{n.tipo === 'e1rm' ? ` (1RM ≈ ${kgTxt(n.e1rm)})` : ''}</span>)}
            </div>
          )}

          <div className="gt-entreno-feedback">
            <p style={{ fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>¿Cómo te sentiste?</p>
            <div className="gt-sensaciones" role="radiogroup" aria-label="Cómo te sentiste">
              {SENSACIONES.map(s => (
                <button key={s.valor} type="button" role="radio" aria-checked={sensacion === s.valor}
                  className={`gt-sensacion${sensacion === s.valor ? ' activa' : ''}`} onClick={() => setSensacion(s.valor)}>
                  <s.icono size={22} aria-hidden />{s.texto}
                </button>
              ))}
            </div>
            <textarea className="gt-textarea" rows={2} maxLength={500} value={comentario} onChange={e => setComentario(e.target.value)}
              placeholder="¿Algo para contarle al profe? (opcional) Ej: me molestó el hombro en el press" style={{ marginTop: 10 }} />
            <p className="gt-text-sm gt-text-muted" style={{ margin: '6px 0 0' }}>Lo ve tu profe para ajustar la rutina.</p>
          </div>
          {error && <div className="gt-alert gt-alert-error" style={{ marginTop: 10 }}>{error}</div>}
          <button type="button" className="gt-btn gt-btn-primary gt-entreno-btn-grande" disabled={enviando} onClick={terminar}>
            {enviando ? <><Spinner /> Guardando…</> : 'Listo'}
          </button>
        </div>
      </div>
    )
  }

  const restante = descansoFin != null ? Math.max(0, Math.ceil((descansoFin - ahora) / 1000)) : 0
  const ultimoPaso = paso === pasos.length - 1

  return (
    <div className="gt-entreno">
      {/* Encabezado y avance */}
      <div className="gt-entreno-cab">
        <Link to={volver} className="gt-icon-btn" aria-label="Salir del entrenamiento"><X size={18} /></Link>
        <span className="gt-text-muted gt-text-sm" style={{ flex: 1, textAlign: 'center' }}>
          {objetivo && <>{objetivo.label} · </>}{etiquetaDia(rutina.diasSemana, dia)}
        </span>
        <span className="gt-entreno-contador">{paso + 1}/{pasos.length}</span>
      </div>
      <div className="gt-entreno-avance" aria-hidden>
        {pasos.map((g, i) => {
          const hechas = g.some(e => (series[e.id!] ?? []).some(s => s.hecha))
          return <span key={g[0].id} className={[i === paso ? 'actual' : hechas ? 'hecho' : '', g[0].esCalentamiento ? 'calor' : ''].join(' ').trim()} />
        })}
      </div>

      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      {esCalor && (
        <div className="gt-entreno-aviso calor">
          <span><Flame size={16} aria-hidden /> Entrada en calor · {paso + 1} de {calentamiento.length}</span>
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => { setDescansoFin(null); setConCalor(false); setPaso(0); window.scrollTo({ top: 0 }) }}>
            Saltear →
          </button>
        </div>
      )}
      {esSuperserie && (
        <div className="gt-entreno-aviso">
          <span><Link2 size={16} aria-hidden /> Superserie: hacé una serie de cada uno, sin descanso entre ellos. El descanso va al terminar la vuelta.</span>
        </div>
      )}

      {grupo.map((ej, idx) => (
        <TarjetaEjercicio key={ej.id} ej={ej} etiqueta={esSuperserie ? `${String.fromCharCode(65 + idx)}` : null}
          esCalor={esCalor} filas={series[ej.id!] ?? []} ultima={ultimas[ej.id!]} sugerida={sugerir(ej, ultimas[ej.id!], rutina.objetivo)}
          record={records.get(ej.nombreEjercicio.trim().toLowerCase())} rpe={rpe[ej.id!]}
          onRpe={v => setRpe(prev => ({ ...prev, [ej.id!]: v }))}
          onCambiar={(i, campo, valor) => actualizar(ej.id!, i, campo, valor)}
          onTildar={i => tildar(ej, i)}
          onAgregarSerie={() => setSeries(prev => ({ ...prev, [ej.id!]: [...prev[ej.id!], { ...(prev[ej.id!][prev[ej.id!].length - 1] ?? { kg: '', reps: '10' }), hecha: false }] }))}
          onImagen={(url) => setImagenGrande({ url, nombre: ej.nombreEjercicio })}
          onDiscos={kg => setDiscos(kg)} />
      ))}

      {/* Navegación: abajo, al alcance del pulgar */}
      <div className="gt-entreno-nav">
        <button type="button" className="gt-btn gt-btn-secondary" disabled={paso === 0 || guardando} onClick={() => irA(paso - 1)} aria-label="Anterior">←</button>
        <button type="button" className="gt-btn gt-btn-primary gt-entreno-btn-grande" disabled={guardando} onClick={() => irA(paso + 1)}>
          {guardando ? <><Spinner /> Guardando…</> : ultimoPaso ? 'Terminar ✓' : esCalor && !pasos[paso + 1]?.[0]?.esCalentamiento ? 'Empezar la rutina →' : 'Siguiente →'}
        </button>
      </div>

      {/* GIF en pantalla completa */}
      {imagenGrande && (
        <div role="dialog" aria-label={imagenGrande.nombre} onClick={() => setImagenGrande(null)} className="gt-entreno-visor">
          <p>{imagenGrande.nombre}</p>
          <img src={imagenGrande.url} alt={imagenGrande.nombre} />
          <button type="button" className="gt-btn gt-btn-secondary" style={{ marginTop: 16 }}>✕ Cerrar</button>
        </div>
      )}

      {discos != null && <CalculadoraDiscos kgInicial={discos} onCerrar={() => setDiscos(null)} />}

      {/* Récord nuevo */}
      {festejo && (
        <div className="gt-festejo" role="status" onClick={() => setFestejo(null)}>
          <span className="gt-festejo-icono" aria-hidden><Trophy size={30} /></span>
          <strong>¡Nuevo récord!</strong>
          <span>{festejo.ejercicio}: {kgTxt(festejo.kg)}{festejo.tipo === 'e1rm' ? ` · 1RM ≈ ${kgTxt(festejo.e1rm)}` : ''}</span>
        </div>
      )}

      {/* Descanso */}
      {descansoFin != null && (
        <div className="gt-descanso" role="timer" aria-live="polite">
          <div className="gt-descanso-reloj" style={{ ['--pct' as string]: `${descansoTotal ? (restante / descansoTotal) * 100 : 0}%` }}>
            <Timer size={18} aria-hidden />
          </div>
          <div style={{ flex: 1 }}>
            <div className="gt-text-sm" style={{ opacity: .85 }}>Descanso</div>
            <div className="gt-descanso-tiempo">{Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="gt-descanso-btn" onClick={() => { setDescansoFin(f => (f ?? Date.now()) + 15000); setDescansoTotal(t => t + 15) }}>+15 s</button>
            <button type="button" className="gt-descanso-btn" onClick={() => setDescansoFin(null)}>Saltar</button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Un ejercicio dentro del paso: video, máquina, lo de la vez anterior, series y esfuerzo */
function TarjetaEjercicio({ ej, etiqueta, esCalor, filas, ultima, sugerida, record, rpe, onRpe, onCambiar, onTildar, onAgregarSerie, onImagen, onDiscos }: {
  ej: Ejercicio
  etiqueta: string | null
  esCalor: boolean
  filas: Serie[]
  ultima: Ultima | undefined
  sugerida: Sugerencia | null
  record: RecordPersonal | undefined
  rpe: number | undefined
  onRpe: (v: number) => void
  onCambiar: (i: number, campo: keyof Serie, valor: string | boolean) => void
  onTildar: (i: number) => void
  onAgregarSerie: () => void
  onImagen: (url: string) => void
  onDiscos: (kg: number) => void
}) {
  const imgUrl = ej.imagenUrl || resolverImgEstatica(ej.nombreEjercicio)
  const hechas = filas.filter(s => s.hecha).length
  const kgActual = num(filas.find(s => !s.hecha)?.kg ?? filas[filas.length - 1]?.kg ?? '') ?? 0

  return (
    <div className="gt-card gt-entreno-ej">
      {imgUrl && (
        <button key={imgUrl} type="button" className="gt-entreno-img-btn" onClick={() => onImagen(imgUrl)} aria-label={`Ver ${ej.nombreEjercicio} en grande`}>
          <img src={imgUrl} alt={ej.nombreEjercicio} className="gt-entreno-img"
            onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }} />
          <span className="gt-entreno-zoom"><Expand size={12} aria-hidden /> Ver en grande</span>
        </button>
      )}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {etiqueta && <span className="gt-entreno-letra">{etiqueta}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="gt-entreno-nombre">{ej.nombreEjercicio}</h1>
            <p className="gt-text-muted" style={{ margin: '2px 0 0' }}>
              {ej.series ?? 3} × {ej.repeticiones ?? 10}{ej.descansoSeg ? ` · descanso ${ej.descansoSeg}s` : ''}
              {hechas > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700 }}> · {hechas}/{filas.length} hechas</span>}
            </p>
          </div>
          {!esCalor && <button type="button" className="gt-icon-btn" onClick={() => onDiscos(kgActual)} aria-label="Calculadora de discos" title="Calculadora de discos"><Calculator size={17} /></button>}
        </div>
        {(ej.maquinas?.length ?? 0) > 0 && <div style={{ marginTop: 10 }}><MaquinasEjercicio maquinas={ej.maquinas} grande /></div>}
        {ej.notas && <p className="gt-text-sm" style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>{ej.notas}</p>}
        {ej.descripcionEjercicio && (
          <details style={{ marginTop: 8 }}>
            <summary className="gt-text-sm" style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}>¿Cómo se hace?</summary>
            <p className="gt-text-sm" style={{ margin: '6px 0 0', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{ej.descripcionEjercicio}</p>
          </details>
        )}

        {!esCalor && (ultima || record?.pesoMax != null) && (
          <div className="gt-entreno-ultima">
            {ultima && <span>Última vez ({formatFecha(ultima.fecha)}): <strong>{ultima.pesoKg ?? '—'} kg × {ultima.reps ?? '—'}</strong></span>}
            {record?.pesoMax != null && <span className="gt-entreno-record"><Star size={13} aria-hidden /> Récord: {kgTxt(Number(record.pesoMax))}</span>}
            {sugerida && <span className="gt-chip" style={{ background: 'var(--green-bg)', color: 'var(--green-text)' }}>{sugerida.texto}</span>}
          </div>
        )}

        {/* Series */}
        <div className="gt-entreno-series">
          <div className="gt-entreno-serie cabecera"><span>Serie</span><span>{esCalor ? '' : 'Kg'}</span><span>Reps</span><span /></div>
          {filas.map((s, i) => (
            <div key={i} className={`gt-entreno-serie${s.hecha ? ' hecha' : ''}`}>
              <span className="gt-entreno-n">{i + 1}</span>
              {esCalor
                ? <span className="gt-text-muted" style={{ textAlign: 'center' }}>—</span>
                : <input className="gt-input" inputMode="decimal" value={s.kg} aria-label={`Kilos serie ${i + 1}`}
                    onChange={e => onCambiar(i, 'kg', e.target.value)} placeholder="—" />}
              <input className="gt-input" inputMode="numeric" value={s.reps} aria-label={`Repeticiones serie ${i + 1}`}
                onChange={e => onCambiar(i, 'reps', e.target.value)} />
              <button type="button" className="gt-entreno-check" aria-pressed={s.hecha} aria-label={`Marcar serie ${i + 1} como hecha`}
                onClick={() => onTildar(i)}><Check size={22} strokeWidth={3} /></button>
            </div>
          ))}
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onAgregarSerie}>
            <Plus size={14} aria-hidden /> Serie
          </button>
        </div>

        {/* Esfuerzo (aparece cuando ya hizo alguna serie) */}
        {!esCalor && hechas > 0 && (
          <div className="gt-esfuerzo">
            <span className="gt-text-sm" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>¿Cómo te salió?</span>
            <div className="gt-esfuerzo-opciones" role="radiogroup" aria-label="Esfuerzo">
              {ESFUERZOS.map(o => (
                <button key={o.rpe} type="button" role="radio" aria-checked={rpe === o.rpe} className={rpe === o.rpe ? 'activo' : ''} onClick={() => onRpe(o.rpe)}>
                  <o.icono size={14} aria-hidden /> {o.texto}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
