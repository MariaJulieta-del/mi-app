import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../../shared/components/Modal'
import { mensajeError } from '../../../shared/utils/errores'
import { formatFecha } from '../../../shared/utils/fechas'
import { obtenerTodos } from '../../socios/services/socioService'
import type { Socio } from '../../socios/types/Socio'
import { inscribirSocio, desinscribirSocio, liberarCupos, obtenerDisciplina, type DisciplinaApi } from '../services/disciplinaService'
import { colorDisciplina, resumenHorarios } from '../utils/disciplinaUtils'
import CupoMeter from './CupoMeter'
import AsistenciaClase from './AsistenciaClase'
import ReservasClase from './ReservasClase'
import AvisoClase from './AvisoClase'

type Pestana = 'alumnos' | 'reservas' | 'asistencia' | 'aviso'

/** Alumnos de una disciplina: ver, inscribir, quitar y liberar cupos */
export default function AlumnosModal({ disciplina, onCambio, onEditar, onCerrar }: {
  disciplina: DisciplinaApi
  /** Se llama con la disciplina actualizada después de cada cambio */
  onCambio: (d: DisciplinaApi) => void
  onEditar: () => void
  onCerrar: () => void
}) {
  const [socios, setSocios] = useState<Socio[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [trabajando, setTrabajando] = useState<number | 'liberar' | null>(null)
  const [quitar, setQuitar] = useState<number | null>(null)
  const [pestana, setPestana] = useState<Pestana>('alumnos')

  useEffect(() => { obtenerTodos().then(setSocios).catch(() => {}) }, [])

  const inscriptos = useMemo(() => disciplina.inscriptos ?? [], [disciplina.inscriptos])
  const idsInscriptos = useMemo(() => new Set(inscriptos.map(i => i.socioId)), [inscriptos])
  const sinVigencia = inscriptos.filter(i => !i.activo || !i.membresiaVigente).length
  const completa = disciplina.cupoMaximo != null && disciplina.totalInscritos >= disciplina.cupoMaximo

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (q.length < 2) return []
    return socios
      .filter(s => s.activo !== false && s.id && !idsInscriptos.has(s.id))
      .filter(s => `${s.nombre} ${s.apellido}`.toLowerCase().includes(q) || s.dni.includes(q))
      .slice(0, 6)
  }, [busqueda, socios, idsInscriptos])

  const ejecutar = async (clave: number | 'liberar', fn: () => Promise<void>) => {
    setTrabajando(clave); setError(null); setAviso(null)
    try { await fn() } catch (err: unknown) { setError(mensajeError(err, 'No se pudo completar la acción')) }
    finally { setTrabajando(null) }
  }

  const inscribir = (s: Socio) => ejecutar(s.id!, async () => {
    onCambio(await inscribirSocio(disciplina.id, s.id!))
    setBusqueda('')
    setAviso(`${s.nombre} ${s.apellido} quedó inscripto`)
  })

  const confirmarQuitar = (socioId: number) => ejecutar(socioId, async () => {
    onCambio(await desinscribirSocio(disciplina.id, socioId))
    setQuitar(null)
  })

  const liberar = () => ejecutar('liberar', async () => {
    const n = await liberarCupos(disciplina.id)
    setAviso(n === 0 ? 'No había cupos para liberar' : `Se liberaron ${n} ${n === 1 ? 'cupo' : 'cupos'}`)
    onCambio(await obtenerDisciplina(disciplina.id))
  })

  return (
    <Modal ancho={600} onCerrar={onCerrar}
      titulo={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="gt-disc-punto" style={{ background: colorDisciplina(disciplina.color) }} aria-hidden />
        {disciplina.nombre}
      </span>}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={onEditar}>Editar disciplina</button>
        <button type="button" className="gt-btn gt-btn-primary" onClick={onCerrar}>Listo</button>
      </>}>
      <div className="gt-alumnos-resumen">
        <div>
          {resumenHorarios(disciplina.horarios).map(l => <div key={l} className="gt-text-sm" style={{ color: 'var(--text-secondary)' }}>🕐 {l}</div>)}
          {disciplina.horarios.length === 0 && <div className="gt-text-sm gt-text-muted">Sin horarios cargados</div>}
          {disciplina.instructor && <div className="gt-text-sm" style={{ color: 'var(--text-secondary)' }}>👤 {disciplina.instructor}</div>}
        </div>
        <CupoMeter total={disciplina.totalInscritos} cupo={disciplina.cupoMaximo} />
      </div>

      <div className="gt-segmentado gt-pestanas" role="tablist" aria-label="Secciones de la clase">
        {([['alumnos', `Alumnos fijos (${inscriptos.length})`], ['reservas', 'Próximas clases'], ['asistencia', 'Asistencia'], ['aviso', 'Enviar aviso']] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={pestana === k} className={pestana === k ? 'activo' : ''} onClick={() => setPestana(k)}>{label}</button>
        ))}
      </div>

      {pestana === 'reservas' && <ReservasClase disciplinaId={disciplina.id} />}
      {pestana === 'asistencia' && <AsistenciaClase disciplinaId={disciplina.id} />}
      {pestana === 'aviso' && <AvisoClase disciplina={disciplina} />}

      {pestana === 'alumnos' && <>
      {error && <div className="gt-alert gt-alert-error">{error}</div>}
      {aviso && <div className="gt-alert gt-alert-success">{aviso}</div>}

      {/* Inscribir */}
      {disciplina.activa && (
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="buscar-socio-disc">Inscribir a un socio</label>
          <input id="buscar-socio-disc" className="gt-input" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder={completa ? 'La disciplina está completa' : 'Nombre, apellido o DNI…'} disabled={completa} autoComplete="off" />
          {resultados.length > 0 && (
            <div className="gt-opciones">
              {resultados.map(s => (
                <button key={s.id} type="button" className="gt-socio-opcion" disabled={trabajando === s.id} onClick={() => inscribir(s)}>
                  <span style={{ flex: 1 }}>{s.nombre} {s.apellido}</span>
                  <span className="gt-text-muted gt-text-sm">DNI {s.dni}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{trabajando === s.id ? '…' : '+ Inscribir'}</span>
                </button>
              ))}
            </div>
          )}
          {busqueda.trim().length >= 2 && resultados.length === 0 && (
            <p className="gt-text-muted gt-text-sm" style={{ margin: '6px 0 0' }}>No hay socios activos con ese nombre que no estén inscriptos.</p>
          )}
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 6px' }}>
        <span className="gt-stat-label">Inscriptos ({inscriptos.length})</span>
        {sinVigencia > 0 && (
          <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={trabajando === 'liberar'} onClick={liberar}
            title="Quita a los dados de baja y a los que no tienen la membresía vigente">
            {trabajando === 'liberar' ? 'Liberando…' : `Liberar ${sinVigencia} ${sinVigencia === 1 ? 'cupo' : 'cupos'} sin membresía`}
          </button>
        )}
      </div>
      {inscriptos.length === 0 ? (
        <div className="gt-empty" style={{ padding: '16px 0' }}>Todavía no hay socios inscriptos.</div>
      ) : (
        <div className="gt-alumnos-lista">
          {inscriptos.map(i => (
            <div key={i.socioId} className="gt-hoy-fila">
              <span className="gt-avatar" aria-hidden>{i.nombre.split(' ').map(p => p[0]).slice(0, 2).join('')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/socios/${i.socioId}/perfil`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{i.nombre}</Link>
                <div className="gt-text-sm gt-text-muted">desde el {formatFecha(i.fechaAlta)}</div>
              </div>
              {!i.activo ? <span className="gt-badge gt-badge-gray">De baja</span>
                : i.membresiaVigente ? <span className="gt-badge gt-badge-green">Al día</span>
                : <span className="gt-badge gt-badge-red">Membresía vencida</span>}
              {quitar === i.socioId ? (
                <span style={{ display: 'flex', gap: 4 }}>
                  <button type="button" className="gt-btn gt-btn-danger gt-btn-sm" disabled={trabajando === i.socioId} onClick={() => confirmarQuitar(i.socioId)}>Quitar</button>
                  <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => setQuitar(null)}>No</button>
                </span>
              ) : (
                <button type="button" className="gt-icono-btn" onClick={() => setQuitar(i.socioId)} aria-label={`Quitar a ${i.nombre}`} title="Quitar de la disciplina">✕</button>
              )}
            </div>
          ))}
        </div>
      )}
      </>}
    </Modal>
  )
}
