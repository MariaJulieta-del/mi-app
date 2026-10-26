import { useEffect, useMemo, useState } from 'react'
import type { DisciplinaApi } from '../services/disciplinaService'
import { DIAS, DIAS_CORTO, DIAS_LARGO, colorDisciplina, diaDeHoy, minutos, textoCupo } from '../utils/disciplinaUtils'

/** Altura en píxeles de una hora en la grilla */
const PX_HORA = 56

interface Bloque {
  disc: DisciplinaApi
  dia: string
  ini: number
  fin: number
  horaInicio: string
  horaFin: string
  carril: number
  carriles: number
}

/** Reparte en carriles las clases que se superponen el mismo día */
function conCarriles(items: Omit<Bloque, 'carril' | 'carriles'>[]): Bloque[] {
  const orden = [...items].sort((a, b) => a.ini - b.ini || b.fin - a.fin)
  const res: Bloque[] = []
  let grupo: Bloque[] = []
  let finGrupo = -1
  const cerrar = () => { const n = Math.max(1, ...grupo.map(b => b.carril + 1)); grupo.forEach(b => { b.carriles = n }); res.push(...grupo); grupo = [] }
  for (const it of orden) {
    if (it.ini >= finGrupo && grupo.length) cerrar()
    const ocupados = new Set(grupo.filter(b => b.fin > it.ini).map(b => b.carril))
    let carril = 0
    while (ocupados.has(carril)) carril++
    grupo.push({ ...it, carril, carriles: 1 })
    finGrupo = Math.max(finGrupo, it.fin)
  }
  if (grupo.length) cerrar()
  return res
}

function Ocupacion({ d }: { d: DisciplinaApi }) {
  const completa = d.cupoMaximo != null && d.totalInscritos >= d.cupoMaximo
  return (
    <span className="gt-clase-cupo">
      {completa ? 'Completa' : textoCupo(d.totalInscritos, d.cupoMaximo)}
    </span>
  )
}

/**
 * Calendario semanal de clases.
 * Escritorio: columnas por día con la línea de la hora actual. Celular: selector de día + agenda.
 */
export default function HorarioSemanal({ disciplinas, onAbrir }: { disciplinas: DisciplinaApi[]; onAbrir: (d: DisciplinaApi) => void }) {
  const hoy = diaDeHoy()
  const [diaMovil, setDiaMovil] = useState<string>(hoy)
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const bloques = useMemo(() => {
    const porDia: Record<string, Bloque[]> = {}
    for (const dia of DIAS) {
      const items = disciplinas.flatMap(disc => disc.horarios.filter(h => h.dia === dia).map(h => ({
        disc, dia, ini: minutos(h.horaInicio), fin: minutos(h.horaFin), horaInicio: h.horaInicio, horaFin: h.horaFin,
      })))
      porDia[dia] = conCarriles(items)
    }
    return porDia
  }, [disciplinas])

  const todos = Object.values(bloques).flat()
  // Rango visible: de la primera a la última clase (con margen), mínimo 8 a 21 h
  const desde = Math.min(8, ...todos.map(b => Math.floor(b.ini / 60)))
  const hasta = Math.max(21, ...todos.map(b => Math.ceil(b.fin / 60)))
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i)
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
  const lineaAhora = minutosAhora >= desde * 60 && minutosAhora <= hasta * 60 ? ((minutosAhora - desde * 60) / 60) * PX_HORA : null

  if (todos.length === 0) {
    return (
      <div className="gt-empty" style={{ padding: '32px 0' }}>
        Ninguna disciplina tiene horarios cargados todavía. Editá una disciplina y agregale sus días y horarios.
      </div>
    )
  }

  const agendaDia = [...(bloques[diaMovil] ?? [])].sort((a, b) => a.ini - b.ini)

  return (
    <>
      {/* ── Escritorio: grilla ── */}
      <div className="gt-semana" role="region" aria-label="Horario semanal de clases">
        <div className="gt-semana-cab">
          <div />
          {DIAS.map(dia => (
            <div key={dia} className={`gt-semana-dia${dia === hoy ? ' hoy' : ''}`}>
              {DIAS_CORTO[dia]}{dia === hoy && <span className="gt-semana-hoy">hoy</span>}
            </div>
          ))}
        </div>
        <div className="gt-semana-cuerpo" style={{ height: horas.length * PX_HORA }}>
          <div className="gt-semana-horas">
            {horas.map(h => <div key={h} style={{ height: PX_HORA }}>{String(h).padStart(2, '0')}:00</div>)}
          </div>
          {DIAS.map(dia => (
            <div key={dia} className={`gt-semana-col${dia === hoy ? ' hoy' : ''}`}>
              {horas.map(h => <div key={h} className="gt-semana-linea" style={{ top: (h - desde) * PX_HORA }} />)}
              {dia === hoy && lineaAhora != null && <div className="gt-semana-ahora" style={{ top: lineaAhora }} aria-hidden />}
              {bloques[dia].map((b, i) => {
                const top = ((b.ini - desde * 60) / 60) * PX_HORA
                const alto = Math.max(24, ((b.fin - b.ini) / 60) * PX_HORA - 2)
                const ancho = 100 / b.carriles
                return (
                  <button key={`${b.disc.id}-${i}`} type="button" className="gt-clase"
                    onClick={() => onAbrir(b.disc)}
                    style={{ top, height: alto, left: `calc(${b.carril * ancho}% + 2px)`, width: `calc(${ancho}% - 4px)`,
                      ['--c' as string]: colorDisciplina(b.disc.color) }}
                    title={`${b.disc.nombre} · ${DIAS_LARGO[dia]} ${b.horaInicio}–${b.horaFin}${b.disc.instructor ? ` · ${b.disc.instructor}` : ''} · ${textoCupo(b.disc.totalInscritos, b.disc.cupoMaximo)}`}>
                    <span className="gt-clase-nombre">{b.disc.nombre}</span>
                    {alto >= 40 && <span className="gt-clase-hora">{b.horaInicio}–{b.horaFin}</span>}
                    {alto >= 56 && <Ocupacion d={b.disc} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Celular: un día a la vez ── */}
      <div className="gt-agenda">
        <div className="gt-agenda-dias" role="tablist">
          {DIAS.map(dia => {
            const n = bloques[dia].length
            return (
              <button key={dia} type="button" role="tab" aria-selected={dia === diaMovil}
                className={`gt-agenda-dia${dia === diaMovil ? ' activo' : ''}${dia === hoy ? ' hoy' : ''}`}
                onClick={() => setDiaMovil(dia)}>
                <span>{DIAS_CORTO[dia]}</span>
                <small>{n || '–'}</small>
              </button>
            )
          })}
        </div>
        {agendaDia.length === 0 ? (
          <div className="gt-empty" style={{ padding: '20px 0' }}>No hay clases el {DIAS_LARGO[diaMovil].toLowerCase()}.</div>
        ) : agendaDia.map((b, i) => (
          <button key={`${b.disc.id}-${i}`} type="button" className="gt-agenda-clase" onClick={() => onAbrir(b.disc)}
            style={{ ['--c' as string]: colorDisciplina(b.disc.color) }}>
            <span className="gt-agenda-hora">{b.horaInicio}<small>{b.horaFin}</small></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong>{b.disc.nombre}</strong>
              {b.disc.instructor && <small className="gt-text-muted">{b.disc.instructor}</small>}
            </span>
            <Ocupacion d={b.disc} />
          </button>
        ))}
      </div>
    </>
  )
}
