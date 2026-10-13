import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import type { Maquina } from '../../maquinas/services/maquinaService'
import type { Ejercicio, Rutina } from '../../rutinas/types/Rutina'
import { resolverImg } from '../utils/socioUtils'
import { ordenarDias } from '../../rutinas/utils/rutinaUtils'
import MaquinasEjercicio from '../../rutinas/components/MaquinasEjercicio'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const hoyIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()

interface Props {
  rutinas: Rutina[]
  ejerciciosPorRutina: Record<number, Ejercicio[]>
  cargandoEjs: boolean
  maquinas: Maquina[]
  socioId: number
  diaSeleccionado: number
  setDiaSeleccionado: (idx: number) => void
  expandedEjs: Set<number>
  toggleExpandedEj: (ejId: number) => void
  progresoHoy: Record<number, { seriesRealizadas?: number; repeticionesReales?: number; pesoKg?: number }>
  setProgresoHoy: React.Dispatch<React.SetStateAction<Record<number, { seriesRealizadas?: number; repeticionesReales?: number; pesoKg?: number }>>>
  guardandoProgreso: number | null
  onGuardarProgreso: (ejId: number) => void
}

type EjDia = { ej: Ejercicio; rutinaNombre: string; rutinaId: number }

function buildPorDia(rutinas: Rutina[], ejerciciosPorRutina: Record<number, Ejercicio[]>): Record<number, EjDia[]> {
  const porDia: Record<number, EjDia[]> = {}
  rutinas.forEach(r => {
    const ejs = (ejerciciosPorRutina[r.id!] ?? []).filter(e => !e.esCalentamiento)
    const diasR = ordenarDias(r.diasSemana)
    ejs.forEach(e => {
      const idx = (e.dia ?? 1) - 1
      let diaIdx: number
      if (diasR.length > 0) {
        const nombreDia = diasR[idx]
        if (!nombreDia) return
        diaIdx = DIAS_SEMANA.indexOf(nombreDia)
        if (diaIdx === -1) return
      } else {
        diaIdx = idx
        if (diaIdx < 0 || diaIdx > 6) return
      }
      if (!porDia[diaIdx]) porDia[diaIdx] = []
      porDia[diaIdx].push({ ej: e, rutinaNombre: r.nombre, rutinaId: r.id! })
    })
  })
  return porDia
}

export default function MiSemanaView({
  rutinas, ejerciciosPorRutina, cargandoEjs, maquinas, socioId,
  diaSeleccionado, setDiaSeleccionado,
  expandedEjs, toggleExpandedEj,
  progresoHoy, setProgresoHoy, guardandoProgreso, onGuardarProgreso,
}: Props) {
  const porDia = buildPorDia(rutinas, ejerciciosPorRutina)
  const diasDisponibles = Object.keys(porDia).map(Number)
  const ejsHoy = porDia[diaSeleccionado] ?? []

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>
        Mi semana
      </h2>

      {/* Selector de días */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {DIAS_SEMANA.map((dia, idx) => {
          const tienEjs = diasDisponibles.includes(idx)
          const esHoy = idx === hoyIdx
          const seleccionado = idx === diaSeleccionado
          return (
            <button key={dia} type="button"
              onClick={() => setDiaSeleccionado(idx)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '2px solid', cursor: 'pointer',
                fontWeight: 700, fontSize: 13,
                borderColor: seleccionado ? 'var(--accent)' : esHoy ? 'var(--accent)' : 'var(--border)',
                background: seleccionado ? 'var(--accent)' : 'var(--bg-surface)',
                color: seleccionado ? 'var(--on-accent)' : esHoy ? 'var(--accent)' : tienEjs ? 'var(--text-primary)' : 'var(--text-muted)',
                opacity: tienEjs || seleccionado ? 1 : 0.5,
              }}>
              {dia.slice(0, 3)}
              {esHoy && !seleccionado && <span style={{ fontSize: 9, display: 'block', marginTop: -2 }}>hoy</span>}
            </button>
          )
        })}
      </div>

      {/* Ejercicios del día */}
      {cargandoEjs ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando...</p>
      ) : ejsHoy.length === 0 ? (
        <div className="gt-list-card" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
          <p style={{ margin: 0, fontSize: 14 }}>No hay ejercicios asignados para {DIAS_SEMANA[diaSeleccionado]}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ejsHoy.map(({ ej, rutinaNombre, rutinaId }, idx2) => {
            const img = ej.imagenUrl || resolverImg(ej.nombreEjercicio)
            const ejId = ej.id ?? idx2
            const abierto = expandedEjs.has(ejId)
            // Si el profe no le asoció máquinas al ejercicio, se sugieren las que trabajan esos músculos
            const maqRecomendadas = (ej.maquinas ?? []).length === 0 && (ej.grupos ?? []).length > 0
              ? maquinas.filter(m => (m.grupos ?? []).some(g => (ej.grupos ?? []).includes(g))).slice(0, 5)
              : []

            return (
              <div key={ejId} className="gt-list-card" style={{ padding: 0, overflow: 'hidden' }}>
                <button type="button"
                  onClick={() => toggleExpandedEj(ejId)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                    {idx2 + 1}
                  </div>
                  {img
                    ? <img src={img} alt={ej.nombreEjercicio} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                    : <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--bg-surface-2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--text-muted)' }}><Dumbbell size={22} aria-hidden /></div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                      {ej.nombreEjercicio}
                    </p>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {[
                        ej.series ? `${ej.series} series` : null,
                        ej.repeticiones ? `${ej.repeticiones} reps` : null,
                        ej.pesoKg ? `${ej.pesoKg} kg` : null,
                        ej.descansoSeg ? `${ej.descansoSeg}s desc.` : null,
                        ...(ej.maquinas ?? []).filter(m => m.nroMaquina).map(m => `Máquina N° ${m.nroMaquina}`),
                      ].filter(Boolean).join('  ·  ')}
                    </p>
                    {ej.grupos && ej.grupos.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {ej.grupos.map(g => (
                          <span key={g} style={{ background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{g}</span>
                        ))}
                      </div>
                    )}
                    <Link to={`/rutinas/${rutinaId}?socioId=${socioId}`} onClick={e => e.stopPropagation()}
                      style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: 4 }}>
                      {rutinaNombre}
                    </Link>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)', flexShrink: 0 }}>{abierto ? '▾' : '▸'}</span>
                </button>

                {abierto && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(ej.maquinas ?? []).length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Dónde hacerlo</p>
                        <MaquinasEjercicio maquinas={ej.maquinas} grande />
                      </div>
                    )}
                    {maqRecomendadas.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Máquinas recomendadas</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {maqRecomendadas.map(m => (
                            <span key={m.id} style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 12 }}>
                              {m.nombre}{m.nroMaquina ? ` — ${m.nroMaquina}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ej.descripcionEjercicio && (
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55 }}>{ej.descripcionEjercicio}</p>
                    )}
                    {ej.notas && (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
                        {ej.notas}
                      </p>
                    )}
                    {ej.id && (
                      <div style={{ marginTop: 4, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Mi sesión de hoy:</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          {[
                            { label: 'Series', field: 'seriesRealizadas' as const, max: 99, placeholder: String(ej.series ?? '—') },
                            { label: 'Reps', field: 'repeticionesReales' as const, max: 999, placeholder: String(ej.repeticiones ?? '—') },
                            { label: 'Peso (kg)', field: 'pesoKg' as const, max: 999, placeholder: ej.pesoKg != null ? String(ej.pesoKg) : '—' },
                          ].map(({ label, field, max, placeholder }) => (
                            <div key={field} style={{ flex: '1 1 60px', minWidth: 60, maxWidth: 90 }}>
                              <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{label}</label>
                              <input type="number" inputMode="numeric" min={0} max={max}
                                value={progresoHoy[ejId]?.[field] ?? ''}
                                onChange={e => setProgresoHoy(p => ({ ...p, [ejId]: { ...p[ejId], [field]: e.target.value ? Number(e.target.value) : undefined } }))}
                                style={{ width: '100%', padding: '5px 6px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, textAlign: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                                placeholder={placeholder} />
                            </div>
                          ))}
                          <button type="button"
                            disabled={guardandoProgreso === ejId}
                            onClick={() => onGuardarProgreso(ejId)}
                            style={{ flex: '0 0 auto', padding: '7px 16px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            {guardandoProgreso === ejId ? '…' : '✓ Guardar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
