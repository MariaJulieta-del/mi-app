import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock, User, Users } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { CargandoPagina, EmptyState, Pill } from '../../../shared/components/ui'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import { colorDisciplina, resumenHorarios } from '../../disciplinas/utils/disciplinaUtils'
import { listarDisciplinas, type DisciplinaApi } from '../../disciplinas/services/disciplinaService'
import { useSocioApp } from '../SocioAppContext'
import {
  agendaClases, anotarseFijo, cancelarClase, reservarClase, salirFijo, type ClaseAgenda,
} from '../services/socioAppService'
import { cuandoClase, ESTADO_CLASE } from '../utils'

const clave = (c: ClaseAgenda) => `${c.disciplinaId}-${c.fecha}-${c.horaInicio}`

/**
 * Clases grupales para el socio: agenda de los próximos 7 días, reservar un lugar,
 * lista de espera, avisar que no va y anotarse como alumno fijo.
 */
export default function SocioClasesPage() {
  const { membresia } = useSocioApp()
  const toast = useToast()
  const [agenda, setAgenda] = useState<ClaseAgenda[] | null>(null)
  const [disciplinas, setDisciplinas] = useState<DisciplinaApi[]>([])
  const [dia, setDia] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [vista, setVista] = useState<'agenda' | 'disciplinas'>('agenda')
  const [dejar, setDejar] = useState<{ id: number; nombre: string } | null>(null)

  const cargar = useCallback(() => Promise.all([
    agendaClases().then(setAgenda).catch(() => setAgenda([])),
    listarDisciplinas(true).then(setDisciplinas).catch(() => {}),
  ]), [])
  useEffect(() => { cargar() }, [cargar])

  const fechas = useMemo(() => {
    const out: string[] = []
    const hoy = new Date()
    for (let i = 0; i < 7; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i)
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return out
  }, [])
  const diaSel = dia ?? fechas.find(f => agenda?.some(c => c.fecha === f)) ?? fechas[0]
  const delDia = (agenda ?? []).filter(c => c.fecha === diaSel)

  // Primero en las que es alumno fijo
  const ordenadas = useMemo(
    () => [...disciplinas].sort((a, b) => Number(!!b.inscripto) - Number(!!a.inscripto) || a.nombre.localeCompare(b.nombre)),
    [disciplinas],
  )

  const accion = async (c: ClaseAgenda, fn: (c: ClaseAgenda) => Promise<{ mensaje: string }>) => {
    setOcupado(clave(c))
    try {
      const r = await fn(c)
      toast.success(r.mensaje)
      await cargar()
    } catch (e: unknown) {
      toast.error('No se pudo', mensajeError(e, 'Probá de nuevo'))
    } finally { setOcupado(null) }
  }

  const fijo = async (disciplinaId: number, nombre: string, anotar: boolean) => {
    setOcupado('d' + disciplinaId)
    try {
      if (anotar) { await anotarseFijo(disciplinaId); toast.success(`Te anotaste en ${nombre}`, 'Tu lugar queda reservado todas las semanas') }
      else { await salirFijo(disciplinaId); toast.success(`Saliste de ${nombre}`) }
      await cargar()
    } catch (e: unknown) {
      toast.error('No se pudo', mensajeError(e, 'Probá de nuevo'))
    } finally { setOcupado(null); setDejar(null) }
  }

  if (!agenda) return <CargandoPagina resumen={false} filas={4} />
  const vigente = membresia && membresia.estadoMembresia === 'ACTIVA' && (membresia.diasRestantes ?? 0) >= 0

  return (
    <div className="gt-socio-pagina">
      <header className="gt-socio-titulo">
        <h1>Clases</h1>
        <p>Reservá tu lugar o anotate como alumno fijo</p>
      </header>
      {!vigente && <div className="gt-alert gt-alert-warning">Para reservar necesitás la membresía vigente.</div>}

      <div className="gt-segmentado gt-socio-tabs" role="tablist" aria-label="Vista">
        <button type="button" role="tab" aria-selected={vista === 'agenda'} className={vista === 'agenda' ? 'activo' : ''} onClick={() => setVista('agenda')}>
          <CalendarDays size={15} aria-hidden /> Esta semana
        </button>
        <button type="button" role="tab" aria-selected={vista === 'disciplinas'} className={vista === 'disciplinas' ? 'activo' : ''} onClick={() => setVista('disciplinas')}>
          <Users size={15} aria-hidden /> Disciplinas
        </button>
      </div>

      {vista === 'agenda' && agenda.length === 0 ? (
        <div className="gt-card"><EmptyState icono={CalendarDays} titulo="No hay clases esta semana" texto="Cuando el gimnasio cargue clases grupales las vas a ver acá." /></div>
      ) : vista === 'agenda' ? (
        <>
          <div className="gt-socio-dias" role="tablist" aria-label="Día">
            {fechas.map(f => {
              const n = agenda.filter(c => c.fecha === f).length
              const d = new Date(f + 'T00:00:00')
              return (
                <button key={f} type="button" role="tab" aria-selected={f === diaSel} disabled={n === 0}
                  className={`gt-socio-dia${f === diaSel ? ' activo' : ''}`} onClick={() => setDia(f)}>
                  <small>{d.toLocaleDateString('es-AR', { weekday: 'short' })}</small>
                  <strong>{d.getDate()}</strong>
                  <span className="gt-socio-dia-puntos" aria-label={`${n} clases`}>{Array.from({ length: Math.min(n, 3) }, (_, i) => <i key={i} />)}</span>
                </button>
              )
            })}
          </div>

          <h2 className="gt-socio-subtitulo">{cuandoClase(diaSel)}</h2>
          <div className="gt-socio-clases">
            {delDia.map(c => <TarjetaClase key={clave(c)} c={c} ocupado={ocupado === clave(c)} puedeReservar={!!vigente}
              onReservar={() => accion(c, reservarClase)} onCancelar={() => accion(c, cancelarClase)} />)}
          </div>
        </>
      ) : (
        <div className="gt-socio-clases">
          {ordenadas.length === 0 && <div className="gt-card"><EmptyState icono={Users} titulo="Todavía no hay disciplinas" /></div>}
          {ordenadas.map(d => {
            const llena = d.cuposDisponibles !== null && d.cuposDisponibles <= 0
            return (
              <article key={d.id} className={`gt-socio-clase${d.inscripto ? ' mia' : ''}`} style={{ ['--disc' as string]: colorDisciplina(d.color) }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong className="gt-socio-clase-nombre">{d.nombre}</strong>
                    {d.inscripto && <Pill tono="ok">Sos alumno fijo</Pill>}
                  </div>
                  {d.instructor && <p className="gt-socio-clase-meta"><User size={13} aria-hidden /> {d.instructor}</p>}
                  {d.horarios.length > 0 && <p className="gt-socio-clase-meta"><Clock size={13} aria-hidden /> {resumenHorarios(d.horarios).join(' · ')}</p>}
                  {!d.inscripto && d.cupoMaximo != null && (
                    <p className="gt-socio-clase-meta">{llena ? 'Sin lugares fijos libres (podés reservar clases sueltas)' : `${d.cuposDisponibles} ${d.cuposDisponibles === 1 ? 'lugar fijo libre' : 'lugares fijos libres'}`}</p>
                  )}
                  {d.descripcion && <p className="gt-text-sm gt-text-muted" style={{ margin: '6px 0 0' }}>{d.descripcion}</p>}
                </div>
                {d.inscripto
                  ? <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado === 'd' + d.id} onClick={() => setDejar({ id: d.id, nombre: d.nombre })}>Dejar</button>
                  : <button type="button" className="gt-btn gt-btn-primary gt-btn-sm" disabled={!vigente || llena || ocupado === 'd' + d.id} onClick={() => fijo(d.id, d.nombre, true)}>Anotarme fijo</button>}
              </article>
            )
          })}
          <p className="gt-text-sm gt-text-muted" style={{ textAlign: 'center' }}>
            Alumno fijo = tenés tu lugar todas las semanas. Si un día no podés ir, avisá desde la agenda así lo usa otro.
          </p>
        </div>
      )}

      <ConfirmModal open={dejar !== null} title={`Dejar ${dejar?.nombre ?? ''}`}
        message="Vas a perder tu lugar fijo. Podés seguir reservando clases sueltas cuando haya lugar."
        confirmLabel="Dejar" cancelLabel="Cancelar" danger
        onConfirm={() => dejar && fijo(dejar.id, dejar.nombre, false)} onCancel={() => setDejar(null)} />
    </div>
  )
}

function TarjetaClase({ c, ocupado, puedeReservar, onReservar, onCancelar }: {
  c: ClaseAgenda; ocupado: boolean; puedeReservar: boolean; onReservar: () => void; onCancelar: () => void
}) {
  const llena = c.disponibles !== null && c.disponibles <= 0
  const enCurso = c.estadoClase === 'EN_CURSO'
  let boton: React.ReactNode = null
  if (!enCurso) {
    if (c.miEstado === 'FIJO') boton = <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado} onClick={onCancelar}>No voy</button>
    else if (c.miEstado === 'LIBERADA') boton = <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado || llena} onClick={onReservar}>{llena ? 'Lugar ocupado' : 'Recuperar lugar'}</button>
    else if (c.miEstado === 'CONFIRMADA') boton = <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
    else if (c.miEstado === 'ESPERA') boton = <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado} onClick={onCancelar}>Salir de la espera</button>
    else boton = <button type="button" className={`gt-btn gt-btn-sm ${llena ? 'gt-btn-secondary' : 'gt-btn-primary'}`} disabled={ocupado || !puedeReservar} onClick={onReservar}>{llena ? 'Lista de espera' : 'Reservar'}</button>
  }
  const pct = c.cupo ? Math.min(100, Math.round((c.ocupados / c.cupo) * 100)) : 0

  return (
    <article className={`gt-socio-clase${c.miEstado && c.miEstado !== 'LIBERADA' ? ' mia' : ''}`} style={{ ['--disc' as string]: colorDisciplina(c.color) }}>
      <div className="gt-socio-clase-hora">
        <strong>{c.horaInicio}</strong>
        <small>{c.horaFin}</small>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong className="gt-socio-clase-nombre">{c.nombre}</strong>
          {enCurso && <Pill tono="info">En curso</Pill>}
          {c.miEstado && <Pill tono={ESTADO_CLASE[c.miEstado].tono}>{c.miEstado === 'ESPERA' ? `${c.miPosicion}° en espera` : ESTADO_CLASE[c.miEstado].texto}</Pill>}
        </div>
        {c.instructor && <p className="gt-socio-clase-meta"><User size={13} aria-hidden /> {c.instructor}</p>}
        {c.cupo != null ? (
          <div className="gt-socio-cupo">
            <span className="gt-barra-progreso" aria-hidden><span style={{ width: `${pct}%`, background: llena ? 'var(--red)' : undefined }} /></span>
            <small>{llena ? `Completa${c.enEspera ? ` · ${c.enEspera} en espera` : ''}` : `${c.disponibles} ${c.disponibles === 1 ? 'lugar libre' : 'lugares libres'}`}</small>
          </div>
        ) : <p className="gt-socio-clase-meta">Sin límite de lugares</p>}
      </div>
      {boton}
    </article>
  )
}
