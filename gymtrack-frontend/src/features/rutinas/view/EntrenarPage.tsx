import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { obtenerRutina, obtenerEjercicios } from '../services/rutinaService'
import { guardarProgreso, getProgresoRutina } from '../services/progresoService'
import { resolverImgEstatica } from '../hooks/useRutinasDetail'
import { etiquetaDia, OBJETIVO_CONFIG } from '../utils/rutinaUtils'
import type { Rutina, Ejercicio } from '../types/Rutina'
import { fechaLocalISO, formatFecha } from '../../../shared/utils/fechas'

interface Serie { kg: string; reps: string; hecha: boolean }
interface Ultima { fecha: string; pesoKg: number | null; reps: number | null; series: number | null }

interface Sugerencia { kg: number | null; reps: number | null; texto: string }

/**
 * Progresión según el objetivo de la rutina, si la última vez completó todas las series:
 *  - Fuerza / hipertrofia: subir la carga (2,5 kg; 1 kg en cargas livianas).
 *  - Resistencia / pérdida de grasa / salud: sumar 2 repeticiones con el mismo peso; cuando ya hace
 *    6 o más por encima de lo pedido, subir un poco la carga y volver a las repeticiones base.
 */
function sugerir(ej: Ejercicio, ultima: Ultima | undefined, objetivo: string | null | undefined): Sugerencia | null {
  if (!ultima) return null
  const objetivoReps = ej.repeticiones ?? 10
  const completo = (ultima.series ?? 0) >= (ej.series ?? 1) && (ultima.reps ?? 0) >= objetivoReps
  if (!completo) return null
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

const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

/**
 * Modo entrenamiento: un ejercicio por pantalla, tilde por serie,
 * descanso automático y lo que hizo la vez anterior.
 * Cada ejercicio se guarda al pasar al siguiente.
 */
export default function EntrenarPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const rutinaId = Number(id)
  const socioId = user?.rol === 'SOCIO' ? user.socioId ?? null : (params.get('socioId') ? Number(params.get('socioId')) : null)
  const dia = Number(params.get('dia') ?? 1)
  const [hoyISO] = useState(() => fechaLocalISO())
  const claveLocal = `gt-entreno-${rutinaId}-${dia}-${hoyISO}`

  const [rutina, setRutina] = useState<Rutina | null>(null)
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [ultimas, setUltimas] = useState<Record<number, Ultima>>({})
  const [series, setSeries] = useState<Record<number, Serie[]>>({})
  const [paso, setPaso] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [terminado, setTerminado] = useState(false)
  const [inicio] = useState(() => Date.now())
  const [fin, setFin] = useState<number | null>(null)

  // Descanso
  const [descansoFin, setDescansoFin] = useState<number | null>(null)
  const [ahora, setAhora] = useState(() => Date.now())

  // ── Carga ──
  useEffect(() => {
    if (!socioId) return
    Promise.all([obtenerRutina(rutinaId, socioId), obtenerEjercicios(rutinaId, socioId), getProgresoRutina(socioId, rutinaId).catch(() => ({}))])
      .then(([r, ejs, prog]) => {
        setRutina(r)
        const delDia = ejs.filter(e => !e.esCalentamiento && (e.dia ?? 1) === dia).sort((a, b) => a.orden - b.orden)
        setEjercicios(delDia)
        const hoy = fechaLocalISO()
        const ult: Record<number, Ultima> = {}
        for (const [ejId, regs] of Object.entries(prog as Record<string, Array<{ fecha: string; pesoKg: number | null; repeticionesReales: number | null; seriesRealizadas: number | null }>>)) {
          const previo = regs.find(r => r.fecha !== hoy)
          if (previo) ult[Number(ejId)] = { fecha: previo.fecha, pesoKg: previo.pesoKg, reps: previo.repeticionesReales, series: previo.seriesRealizadas }
        }
        setUltimas(ult)

        // Retomar un entrenamiento de hoy si se recargó la página
        let guardado: { series: Record<number, Serie[]>; paso: number } | null = null
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
        setSeries(inicial)
        if (guardado) setPaso(Math.min(guardado.paso, delDia.length - 1))
      })
      .catch(() => setError('No se pudo cargar la rutina'))
  }, [rutinaId, socioId, dia]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ejercicios.length === 0) return
    try { localStorage.setItem(claveLocal, JSON.stringify({ series, paso })) } catch { /* sin almacenamiento */ }
  }, [series, paso]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mantener la pantalla encendida mientras entrena (si el navegador lo permite)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
    return () => { lock?.release().catch(() => {}) }
  }, [])

  // Reloj del descanso
  useEffect(() => {
    if (descansoFin == null) return
    const t = setInterval(() => {
      const n = Date.now()
      setAhora(n)
      if (n >= descansoFin) {
        setDescansoFin(null)
        navigator.vibrate?.([200, 100, 200])
      }
    }, 250)
    return () => clearInterval(t)
  }, [descansoFin])

  const ej = ejercicios[paso]
  const filas = ej ? series[ej.id!] ?? [] : []
  const ultima = ej ? ultimas[ej.id!] : undefined
  const sugerida = ej ? sugerir(ej, ultima, rutina?.objetivo) : null
  const objetivo = rutina?.objetivo ? OBJETIVO_CONFIG[rutina.objetivo] : null
  const imgUrl = ej ? (ej.imagenUrl || resolverImgEstatica(ej.nombreEjercicio)) : undefined

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

  const actualizar = (i: number, campo: keyof Serie, valor: string | boolean) => {
    if (!ej) return
    setSeries(prev => ({ ...prev, [ej.id!]: prev[ej.id!].map((s, j) => (j === i ? { ...s, [campo]: valor } : s)) }))
  }

  const tildar = (i: number) => {
    const marcar = !filas[i].hecha
    actualizar(i, 'hecha', marcar)
    // Al completar una serie (que no sea la última) arranca el descanso
    if (marcar && i < filas.length - 1 && (ej?.descansoSeg ?? 0) > 0) {
      setDescansoFin(Date.now() + (ej!.descansoSeg! * 1000))
      setAhora(Date.now())
    }
  }

  /** Guarda el ejercicio actual (si hizo al menos una serie) */
  const guardarActual = async () => {
    if (!ej || !socioId) return
    const hechas = filas.filter(s => s.hecha)
    if (hechas.length === 0) return
    const pesos = hechas.map(s => num(s.kg)).filter((n): n is number => n != null)
    const reps = hechas.map(s => num(s.reps)).filter((n): n is number => n != null)
    await guardarProgreso({
      socioId, rutinaEjercicioId: ej.id!,
      pesoKg: pesos.length ? Math.max(...pesos) : null,
      repeticionesReales: reps.length ? Math.min(...reps) : null,
      seriesRealizadas: hechas.length,
    })
  }

  const irA = async (nuevo: number) => {
    setGuardando(true); setError(null)
    try {
      await guardarActual()
      setDescansoFin(null)
      if (nuevo >= ejercicios.length) {
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

  const volver = rutina ? `/rutinas/${rutinaId}${user?.rol === 'SOCIO' ? '' : `?socioId=${socioId}`}` : '/'

  if (!socioId) return <div className="gt-alert gt-alert-error">Falta el socio</div>
  if (error && !rutina) return <div className="gt-alert gt-alert-error">{error}</div>
  if (!rutina) return <p className="gt-text-muted">Cargando entrenamiento…</p>
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
        <div className="gt-card" style={{ textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ fontSize: 56, margin: 0 }}>🎉</p>
          <h1 style={{ margin: '6px 0 4px', fontSize: 24, color: 'var(--text-primary)' }}>¡Entrenamiento terminado!</h1>
          <p className="gt-text-muted" style={{ margin: 0 }}>{rutina.nombre} · {etiquetaDia(rutina.diasSemana, dia)}</p>
          <div className="gt-progreso-stats" style={{ margin: '20px 0' }}>
            <div><span className="gt-progreso-num">{resumen.ejerciciosHechos}/{ejercicios.length}</span><span className="gt-stat-label">ejercicios</span></div>
            <div><span className="gt-progreso-num">{resumen.seriesHechas}</span><span className="gt-stat-label">series</span></div>
            <div><span className="gt-progreso-num">{minutos}′</span><span className="gt-stat-label">duración</span></div>
          </div>
          {resumen.volumen > 0 && (
            <p className="gt-text-muted" style={{ marginTop: 0 }}>Levantaste <strong style={{ color: 'var(--text-primary)' }}>{resumen.volumen.toLocaleString('es-AR')} kg</strong> en total.</p>
          )}
          <button type="button" className="gt-btn gt-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate(user?.rol === 'SOCIO' ? '/' : volver)}>
            Listo
          </button>
        </div>
      </div>
    )
  }

  const restante = descansoFin != null ? Math.max(0, Math.ceil((descansoFin - ahora) / 1000)) : 0

  return (
    <div className="gt-entreno">
      {/* Encabezado y avance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Link to={volver} className="gt-btn gt-btn-secondary gt-btn-sm">✕ Salir</Link>
        <span className="gt-text-muted gt-text-sm">
          {objetivo && <>{objetivo.emoji} {objetivo.label} · </>}{etiquetaDia(rutina.diasSemana, dia)} · {paso + 1} de {ejercicios.length}
        </span>
      </div>
      <div className="gt-entreno-avance" aria-hidden>
        {ejercicios.map((e, i) => {
          const hechas = (series[e.id!] ?? []).filter(s => s.hecha).length
          return <span key={e.id} className={i === paso ? 'actual' : hechas ? 'hecho' : ''} />
        })}
      </div>

      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      {/* Ejercicio */}
      <div className="gt-card" style={{ padding: 0, overflow: 'hidden' }}>
        {imgUrl && <img src={imgUrl} alt={ej.nombreEjercicio} className="gt-entreno-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        <div style={{ padding: '14px 16px' }}>
          <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>{ej.nombreEjercicio}</h1>
          <p className="gt-text-muted" style={{ margin: '4px 0 0' }}>
            {ej.series ?? 3} series × {ej.repeticiones ?? 10} reps{ej.descansoSeg ? ` · descanso ${ej.descansoSeg}s` : ''}
            {ej.maquinasNombres && ej.maquinasNombres.length > 0 && ` · ⚙️ ${ej.maquinasNombres.join(', ')}`}
          </p>
          {ej.notas && <p className="gt-text-sm" style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>📝 {ej.notas}</p>}

          {ultima && (
            <div className="gt-entreno-ultima">
              <span>La última vez ({formatFecha(ultima.fecha)}): <strong>{ultima.pesoKg ?? '—'} kg × {ultima.reps ?? '—'}</strong>{ultima.series ? `, ${ultima.series} series` : ''}</span>
              {sugerida && <span className="gt-chip" style={{ background: 'var(--green-bg)', color: 'var(--green-text)' }}>💪 {sugerida.texto}</span>}
            </div>
          )}

          {/* Series */}
          <div className="gt-entreno-series">
            <div className="gt-entreno-serie cabecera"><span>Serie</span><span>Kg</span><span>Reps</span><span /></div>
            {filas.map((s, i) => (
              <div key={i} className={`gt-entreno-serie${s.hecha ? ' hecha' : ''}`}>
                <span className="gt-entreno-n">{i + 1}</span>
                <input className="gt-input" inputMode="decimal" value={s.kg} aria-label={`Kilos serie ${i + 1}`}
                  onChange={e => actualizar(i, 'kg', e.target.value)} placeholder="—" />
                <input className="gt-input" inputMode="numeric" value={s.reps} aria-label={`Repeticiones serie ${i + 1}`}
                  onChange={e => actualizar(i, 'reps', e.target.value)} />
                <button type="button" className="gt-entreno-check" aria-pressed={s.hecha} aria-label={`Marcar serie ${i + 1} como hecha`}
                  onClick={() => tildar(i)}>✓</button>
              </div>
            ))}
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ alignSelf: 'flex-start' }}
              onClick={() => setSeries(prev => ({ ...prev, [ej.id!]: [...prev[ej.id!], { ...(filas[filas.length - 1] ?? { kg: '', reps: '10' }), hecha: false }] }))}>
              + Agregar serie
            </button>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="gt-entreno-nav">
        <button type="button" className="gt-btn gt-btn-secondary" disabled={paso === 0 || guardando} onClick={() => irA(paso - 1)}>← Anterior</button>
        <button type="button" className="gt-btn gt-btn-primary" disabled={guardando} onClick={() => irA(paso + 1)} style={{ flex: 1, justifyContent: 'center' }}>
          {guardando ? 'Guardando…' : paso === ejercicios.length - 1 ? 'Terminar ✓' : 'Siguiente →'}
        </button>
      </div>

      {/* Descanso */}
      {descansoFin != null && (
        <div className="gt-descanso" role="timer" aria-live="polite">
          <div>
            <div className="gt-text-sm" style={{ opacity: .85 }}>Descanso</div>
            <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => setDescansoFin(f => (f ?? Date.now()) + 15000)}>+15 s</button>
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => setDescansoFin(null)}>Saltar</button>
          </div>
        </div>
      )}
    </div>
  )
}
