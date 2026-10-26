import { useEffect, useState } from 'react'
import { Award, BrickWall, CalendarCheck, Dumbbell, Flame, type LucideIcon, Medal, Rocket, Sparkles, Sprout, Star, Sunrise, Target, Trophy } from 'lucide-react'
import { CargandoPagina, Pill } from '../../../shared/components/ui'
import { useToast } from '../../../shared/hooks/useToast'
import { formatFecha } from '../../../shared/utils/fechas'
import ProgresoSocio from '../../seguimiento/components/ProgresoSocio'
import { useSocioApp } from '../SocioAppContext'
import {
  obtenerLogros, obtenerRanking, obtenerRecords, participarRanking, sesionesDelSocio, SENSACIONES,
  type Logros, type Ranking, type RecordPersonal, type Sesion,
} from '../services/socioAppService'

const kg = (n: number | null) => (n == null ? '—' : `${Number(n).toLocaleString('es-AR')} kg`)

/** Progreso del socio: logros, desafío del mes, récords, cargas, ranking e historial */
/** Ícono de cada insignia (el backend manda el código) */
const ICONOS_INSIGNIA: Record<string, LucideIcon> = {
  PRIMER_DIA: Sprout, DIAS_10: Dumbbell, DIAS_25: Flame, DIAS_50: Rocket, DIAS_100: Trophy,
  RACHA_4: CalendarCheck, RACHA_12: BrickWall, RECORD_1: Star, RECORD_10: Sparkles,
  DESAFIO_1: Target, TEMPRANO_10: Sunrise,
}
function IconoInsignia({ codigo }: { codigo: string }) {
  const Icono = ICONOS_INSIGNIA[codigo] ?? Award
  return <Icono size={22} />
}
/** Oro, plata y bronce del ranking */
const COLOR_MEDALLA = ['#D4A017', '#9CA3AF', '#B87333']

export default function SocioProgresoPage() {
  const { socioId } = useSocioApp()
  const toast = useToast()
  const [logros, setLogros] = useState<Logros | null>(null)
  const [records, setRecords] = useState<RecordPersonal[]>([])
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [verTodasIns, setVerTodasIns] = useState(false)
  const [cambiando, setCambiando] = useState(false)

  useEffect(() => {
    obtenerLogros(socioId).then(setLogros).catch(() => {})
    obtenerRecords(socioId).then(setRecords).catch(() => {})
    obtenerRanking().then(setRanking).catch(() => {})
    sesionesDelSocio(socioId).then(setSesiones).catch(() => {})
  }, [socioId])

  const cambiarRanking = async (participa: boolean) => {
    setCambiando(true)
    try {
      await participarRanking(participa)
      setLogros(l => (l ? { ...l, rankingVisible: participa } : l))
      setRanking(await obtenerRanking())
      toast.success(participa ? 'Ahora aparecés en el ranking' : 'Ya no aparecés en el ranking')
    } catch { toast.error('No se pudo cambiar') } finally { setCambiando(false) }
  }

  if (!logros) return <CargandoPagina filas={4} />
  const obtenidas = logros.insignias.filter(i => i.obtenida)
  const insignias = verTodasIns ? logros.insignias : [...obtenidas, ...logros.insignias.filter(i => !i.obtenida).slice(0, 3)]
  const d = logros.desafio

  return (
    <div className="gt-socio-pagina">
      <header className="gt-socio-titulo">
        <h1>Mi progreso</h1>
        <p>Cada entrenamiento suma</p>
      </header>

      <div className="gt-socio-stats">
        <div><Medal size={20} aria-hidden /><strong>{logros.diasEntrenados}</strong><span>días entrenados</span></div>
        <div><Flame size={20} aria-hidden /><strong>{logros.rachaActual}</strong><span>{logros.rachaActual === 1 ? 'semana' : 'semanas'} de racha</span></div>
        <div><Star size={20} aria-hidden /><strong>{logros.records}</strong><span>{logros.records === 1 ? 'récord' : 'récords'}</span></div>
      </div>

      {/* Desafío del mes */}
      <section className={`gt-card gt-socio-bloque gt-desafio${d.completado ? ' completo' : ''}`}>
        <div className="gt-socio-bloque-cab">
          <h2><Target size={18} aria-hidden /> Desafío del mes</h2>
          {d.completado ? <Pill tono="ok" icono={Trophy}>¡Cumplido!</Pill> : <span className="gt-text-sm gt-text-muted">quedan {d.diasRestantes} días</span>}
        </div>
        <p style={{ margin: '0 0 10px', fontWeight: 600 }}>{d.titulo}</p>
        <div className="gt-desafio-puntos" role="meter" aria-valuemin={0} aria-valuemax={d.meta} aria-valuenow={d.actual} aria-label={`${d.actual} de ${d.meta} días`}>
          {Array.from({ length: d.meta }, (_, i) => <span key={i} className={i < d.actual ? 'hecho' : ''} />)}
        </div>
        <p className="gt-text-sm gt-text-muted" style={{ margin: '8px 0 0' }}>
          {d.completado ? `Ganaste ${logros.desafiosGanados} ${logros.desafiosGanados === 1 ? 'desafío' : 'desafíos'} hasta ahora.` : `Llevás ${d.actual} de ${d.meta}. ¡Te faltan ${d.meta - d.actual}!`}
        </p>
      </section>

      {/* Insignias */}
      <section className="gt-card gt-socio-bloque">
        <div className="gt-socio-bloque-cab">
          <h2><Award size={18} aria-hidden /> Insignias</h2>
          <span className="gt-text-sm gt-text-muted">{obtenidas.length} de {logros.insignias.length}</span>
        </div>
        <div className="gt-insignias">
          {insignias.map(i => (
            <div key={i.codigo} className={`gt-insignia${i.obtenida ? ' obtenida' : ''}`} title={i.descripcion}>
              <span className="gt-insignia-icono" aria-hidden><IconoInsignia codigo={i.codigo} /></span>
              <strong>{i.titulo}</strong>
              <small>{i.obtenida ? i.descripcion : `${i.progreso}/${i.meta}`}</small>
              {!i.obtenida && <span className="gt-barra-progreso" aria-hidden><span style={{ width: `${(i.progreso / i.meta) * 100}%` }} /></span>}
            </div>
          ))}
        </div>
        {logros.insignias.length > insignias.length && (
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" style={{ marginTop: 10 }} onClick={() => setVerTodasIns(true)}>Ver todas</button>
        )}
      </section>

      {/* Récords */}
      {records.length > 0 && (
        <section className="gt-card gt-socio-bloque">
          <div className="gt-socio-bloque-cab"><h2><Star size={18} aria-hidden /> Mis récords</h2></div>
          <div className="gt-records">
            {records.filter(r => r.pesoMax != null).slice(0, 8).map(r => (
              <div key={r.ejercicio} className="gt-record">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>{r.ejercicio}</strong>
                  <small>{r.fechaPeso ? formatFecha(r.fechaPeso) : ''}</small>
                </span>
                <span className="gt-record-valor">
                  <strong>{kg(r.pesoMax)}</strong>
                  {r.e1rm != null && <small title="Peso máximo estimado para una sola repetición">1RM ≈ {kg(r.e1rm)}</small>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cargas y asistencia */}
      <ProgresoSocio socioId={socioId} titulo="Cargas y asistencia" />

      {/* Ranking */}
      {ranking && (
        <section className="gt-card gt-socio-bloque" style={{ marginTop: 16 }}>
          <div className="gt-socio-bloque-cab">
            <h2><Trophy size={18} aria-hidden /> Ranking del mes</h2>
            <label className="gt-switch">
              <input type="checkbox" checked={logros.rankingVisible} disabled={cambiando} onChange={e => cambiarRanking(e.target.checked)} />
              <span>Aparecer</span>
            </label>
          </div>
          <p className="gt-text-sm gt-text-muted" style={{ marginTop: 0 }}>
            Días entrenados este mes entre los socios que eligen aparecer (se muestra nombre e inicial).
          </p>
          {ranking.top.length === 0
            ? <p className="gt-text-sm gt-text-muted">Todavía nadie se sumó este mes. ¡Sé el primero!</p>
            : (
              <ol className="gt-ranking">
                {ranking.top.map(p => (
                  <li key={p.socioId} className={p.esVos ? 'vos' : ''}>
                    <span className="gt-ranking-pos">{p.posicion <= 3 ? <Medal size={18} aria-label={`${p.posicion}°`} style={{ color: COLOR_MEDALLA[p.posicion - 1] }} /> : p.posicion}</span>
                    <span style={{ flex: 1 }}>{p.nombre}{p.esVos ? ' (vos)' : ''}</span>
                    <strong>{p.dias} {p.dias === 1 ? 'día' : 'días'}</strong>
                  </li>
                ))}
              </ol>
            )}
          {ranking.tuPuesto && !ranking.top.some(p => p.esVos) && (
            <p className="gt-text-sm" style={{ margin: '8px 0 0' }}>Estás en el puesto <strong>{ranking.tuPuesto.posicion}</strong> de {ranking.participantes} con {ranking.tuPuesto.dias} días.</p>
          )}
        </section>
      )}

      {/* Historial */}
      {sesiones.length > 0 && (
        <section className="gt-card gt-socio-bloque">
          <div className="gt-socio-bloque-cab"><h2>Últimos entrenamientos</h2></div>
          {sesiones.slice(0, 10).map(s => {
            const sen = SENSACIONES.find(x => x.valor === s.sensacion)
            return (
              <div key={s.id} className="gt-sesion-fila">
                <span className="gt-sesion-emoji" aria-hidden>{sen ? <sen.icono size={18} /> : <Dumbbell size={18} />}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong>{s.rutinaNombre ?? 'Entrenamiento'}{s.dia ? ` · Día ${s.dia}` : ''}</strong>
                  <small>{formatFecha(s.fecha)}{s.duracionMin ? ` · ${s.duracionMin} min` : ''}{s.series ? ` · ${s.series} series` : ''}{s.volumenKg ? ` · ${Number(s.volumenKg).toLocaleString('es-AR')} kg` : ''}</small>
                </span>
                {s.records > 0 && <Pill tono="warn" icono={Star}>{s.records}</Pill>}
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
