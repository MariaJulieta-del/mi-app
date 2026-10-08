import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { getDemografia, type Demografia, type GrupoPublico } from '../services/reporteService'
import { EmptyState, Segmentado, Skeleton } from '../../../shared/components/ui'
import { celdaPct } from '../utils/celdas'
import FuenteDatos from './FuenteDatos'

const PERIODOS = [30, 60, 90] as const
const num = (n: number | null | undefined, sufijo = '') => (n == null ? '—' : `${n.toLocaleString('es-AR')}${sufijo}`)

/** Una fila por grupo: cuántos son, cuánto vienen y a qué hora */
function TablaGrupos({ grupos, mostrarEdad }: { grupos: GrupoPublico[]; mostrarEdad: boolean }) {
  const max = Math.max(1, ...grupos.map(g => g.socios))
  return (
    <div className="gt-table-wrap">
      <table className="gt-table gt-publico-tabla">
        <thead>
          <tr>
            <th>Grupo</th>
            <th style={{ width: '30%' }}>Socios activos</th>
            {mostrarEdad && <th>Edad prom.</th>}
            <th>Visitas por semana</th>
            <th>Hora más común</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map(g => (
            <tr key={g.clave}>
              <td className="gt-fw-600">{g.nombre}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="gt-barra-pct"><div style={{ width: `${(g.socios / max) * 100}%` }} /></div>
                  <span style={{ minWidth: 64, textAlign: 'right' }}><strong>{g.socios}</strong> <span className="gt-text-muted">{g.porcentaje != null ? `(${g.porcentaje}%)` : ''}</span></span>
                </div>
              </td>
              {mostrarEdad && <td>{num(g.edadPromedio, ' años')}</td>}
              <td>{num(g.visitasPorSemana)}</td>
              <td>{g.horaPico ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Mapa grupo × franja horaria: de las visitas de cada grupo, qué porcentaje cae en cada franja */
function MapaFranjas({ d, grupos }: { d: Demografia; grupos: GrupoPublico[] }) {
  const conVisitas = grupos.filter(g => g.visitas > 0)
  if (conVisitas.length === 0) return <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>Todavía no hay ingresos de estos grupos en el período.</p>
  return (
    <div className="gt-table-wrap">
      <table className="gt-table gt-cohortes">
        <thead>
          <tr><th>Grupo</th>{d.nombresFranjas.map(f => <th key={f}>{f}</th>)}<th>Hora promedio</th></tr>
        </thead>
        <tbody>
          {conVisitas.map(g => (
            <tr key={g.clave}>
              <td className="gt-fw-600">{g.nombre}<span className="gt-text-muted" style={{ fontWeight: 400 }}> · {g.visitas}</span></td>
              {g.franjas.map((p, i) => <td key={i} style={p > 0 ? celdaPct(p) : undefined}>{p > 0 ? `${p}%` : '—'}</td>)}
              <td>{g.horaPromedio ?? '—'}</td>
            </tr>
          ))}
          <tr className="gt-publico-total">
            <td>Edad promedio de los que vienen</td>
            {d.franjas.map(f => <td key={f.nombre}>{f.edadPromedio != null ? `${Math.round(f.edadPromedio)} años` : '—'}</td>)}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/** Público del gimnasio: edad y género de los socios y en qué horarios viene cada grupo */
export default function PublicoGimnasio() {
  const [dias, setDias] = useState<number>(60)
  const [d, setD] = useState<Demografia | null>(null)
  const [error, setError] = useState(false)
  const [vistaHora, setVistaHora] = useState<'edad' | 'genero'>('edad')

  useEffect(() => {
    getDemografia(dias).then(r => { setD(r); setError(false) }).catch(() => setError(true))
  }, [dias])

  if (error) return <div className="gt-alert gt-alert-error">No se pudieron cargar los datos del público.</div>
  if (!d) return <div className="gt-card"><Skeleton alto={180} /></div>
  if (d.sociosActivos === 0) return <div className="gt-card"><EmptyState icono={Users} titulo="Todavía no hay socios activos" /></div>

  const sinEdad = d.sociosActivos - d.conEdad
  const sinGenero = d.sociosActivos - d.conGenero
  const franjaPico = d.franjas.reduce((a, b) => (b.visitas > a.visitas ? b : a), d.franjas[0])

  return (
    <>
      <div className="gt-card" style={{ marginBottom: 20 }}>
        <div className="gt-card-cabecera">
          <p className="gt-card-title" style={{ margin: 0 }}>Quiénes vienen</p>
          <Segmentado etiqueta="Período" valor={String(dias)} onChange={v => setDias(Number(v))}
            opciones={PERIODOS.map(p => ({ valor: String(p), texto: `${p} días` }))} />
        </div>
        <div className="gt-indicadores">
          <div>
            <strong>{num(d.edadPromedio && Math.round(d.edadPromedio))}{d.edadPromedio != null && <small> años</small>}</strong>
            <span>edad promedio</span>
            <small>{d.edadMinima == null ? 'cargá la fecha de nacimiento' : d.edadMinima === d.edadMaxima ? `${d.conEdad} ${d.conEdad === 1 ? 'socio' : 'socios'} con edad cargada` : `de ${d.edadMinima} a ${d.edadMaxima} años`}</small>
          </div>
          {d.generos.map(g => (
            <div key={g.clave}>
              <strong>{g.porcentaje != null ? `${g.porcentaje}%` : '—'}</strong>
              <span>{g.nombre.toLowerCase()}</span>
              <small>{g.socios} {g.socios === 1 ? 'socio' : 'socios'}{g.edadPromedio != null ? ` · ${Math.round(g.edadPromedio)} años prom.` : ''}</small>
            </div>
          ))}
        </div>
        {(sinEdad > 0 || sinGenero > 0) && (
          <p className="gt-publico-aviso">
            Faltan datos: {sinEdad > 0 && <><strong>{sinEdad}</strong> sin fecha de nacimiento</>}{sinEdad > 0 && sinGenero > 0 && ' y '}
            {sinGenero > 0 && <><strong>{sinGenero}</strong> sin género</>}. Se completan desde <Link to="/socios">Socios</Link> › Editar.
          </p>
        )}
      </div>

      <div className="gt-publico-grid">
        <div className="gt-card">
          <p className="gt-card-title" style={{ marginTop: 0 }}>Por edad</p>
          <TablaGrupos grupos={d.edades} mostrarEdad={false} />
        </div>
        <div className="gt-card">
          <p className="gt-card-title" style={{ marginTop: 0 }}>Por género</p>
          <TablaGrupos grupos={d.generos} mostrarEdad />
        </div>
      </div>

      <div className="gt-card" style={{ marginBottom: 20 }}>
        <div className="gt-card-cabecera">
          <div>
            <p className="gt-card-title" style={{ margin: 0 }}>¿A qué hora viene cada grupo?</p>
            {d.visitas > 0 && (
              <p className="gt-text-sm gt-text-muted" style={{ margin: '2px 0 0' }}>
                La franja con más gente es <strong>{franjaPico.nombre.toLowerCase()}</strong> ({franjaPico.porcentaje}% de los {d.visitas.toLocaleString('es-AR')} ingresos).
              </p>
            )}
          </div>
          <Segmentado etiqueta="Agrupar por" valor={vistaHora} onChange={setVistaHora}
            opciones={[{ valor: 'edad', texto: 'Edad' }, { valor: 'genero', texto: 'Género' }]} />
        </div>
        <MapaFranjas d={d} grupos={vistaHora === 'edad' ? d.edades : d.generos} />
        <p className="gt-text-sm gt-text-muted" style={{ margin: '8px 0 0' }}>Cada fila suma 100%: de las visitas de ese grupo, qué parte cae en cada horario. Más oscuro = más concentración.</p>
        <FuenteDatos>
          <li><b>Edad y género:</b> de la ficha de cada socio activo (fecha de nacimiento y género cargados en Socios).</li>
          <li><b>Visitas y horarios:</b> ingresos registrados en recepción o con el QR en los últimos {d.dias} días (solo entradas permitidas). Las visitas de alguien que después se dio de baja también cuentan para los horarios.</li>
          <li><b>Visitas por semana:</b> ingresos del grupo ÷ socios activos del grupo ÷ semanas del período.</li>
        </FuenteDatos>
      </div>
    </>
  )
}
