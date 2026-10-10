import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../../../shared/services/axiosInstance'
import { fechaLocalISO } from '../../../shared/utils/fechas'

interface Registro {
  id: number
  fecha: string
  usuario: string
  rol: string | null
  accion: string
  detalle: string | null
  recurso: string | null
  socioId: number | null
  socioNombre: string | null
  ip: string | null
}

const hace = (dias: number) => { const d = new Date(); d.setDate(d.getDate() - dias); return fechaLocalISO(d) }

/** Registro de cambios: quién cobró, quién dio de baja, quién editó (solo admin) */
export default function AuditoriaPage() {
  const [desde, setDesde] = useState(hace(7))
  const [hasta, setHasta] = useState(fechaLocalISO())
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargadoPara, setCargadoPara] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usuario, setUsuario] = useState('')
  const [texto, setTexto] = useState('')

  useEffect(() => {
    axiosInstance.get('/api/v1/auditoria', { params: { desde, hasta } })
      .then(r => { setRegistros(r.data); setError(null) })
      .catch(() => setError('No se pudo cargar el registro'))
      .finally(() => setCargadoPara(`${desde}|${hasta}`))
  }, [desde, hasta])
  const cargando = cargadoPara !== `${desde}|${hasta}`

  const usuarios = useMemo(() => Array.from(new Set(registros.map(r => r.usuario))).sort(), [registros])
  const filtrados = registros.filter(r =>
    (!usuario || r.usuario === usuario) &&
    (!texto || `${r.accion} ${r.detalle ?? ''} ${r.socioNombre ?? ''}`.toLowerCase().includes(texto.toLowerCase())))

  return (
    <>
      <div className="gt-section-header">
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Auditoría</h1>
          <p className="gt-text-muted" style={{ margin: '2px 0 0' }}>Quién hizo cada cobro, baja o cambio importante.</p>
        </div>
      </div>

      <div className="gt-card" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="gt-form-group" style={{ margin: 0 }}>
          <label className="gt-label" htmlFor="auditoriapage-campo-1">Desde</label>
          <input id="auditoriapage-campo-1" type="date" className="gt-input" value={desde} max={hasta} onChange={e => setDesde(e.target.value)} />
        </div>
        <div className="gt-form-group" style={{ margin: 0 }}>
          <label className="gt-label" htmlFor="auditoriapage-campo-2">Hasta</label>
          <input id="auditoriapage-campo-2" type="date" className="gt-input" value={hasta} min={desde} onChange={e => setHasta(e.target.value)} />
        </div>
        <div className="gt-form-group" style={{ margin: 0 }}>
          <label className="gt-label" htmlFor="auditoriapage-campo-3">Usuario</label>
          <select id="auditoriapage-campo-3" className="gt-select" value={usuario} onChange={e => setUsuario(e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="gt-form-group" style={{ margin: 0, flex: 1, minWidth: 180 }}>
          <label className="gt-label" htmlFor="auditoriapage-campo-4">Buscar</label>
          <input id="auditoriapage-campo-4" className="gt-input" placeholder="Acción, socio o detalle…" value={texto} onChange={e => setTexto(e.target.value)} />
        </div>
      </div>

      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      <div className="gt-card">
        {cargando ? <p className="gt-text-muted" style={{ margin: 0 }}>Cargando…</p>
          : filtrados.length === 0 ? <div className="gt-empty">No hay movimientos en ese período.</div>
          : (
            <div className="gt-table-wrap">
              <table className="gt-table">
                <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Socio</th><th>Detalle</th></tr></thead>
                <tbody>
                  {filtrados.map(r => (
                    <tr key={r.id}>
                      <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12 }}>
                        {new Date(r.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className="gt-fw-600">{r.usuario}</span>
                        {r.rol && <span className="gt-text-muted" style={{ fontSize: 11, marginLeft: 4 }}>{r.rol.toLowerCase()}</span>}
                      </td>
                      <td>{r.accion}</td>
                      <td>{r.socioId ? <Link to={`/socios/${r.socioId}/perfil`}>{r.socioNombre ?? `#${r.socioId}`}</Link> : '—'}</td>
                      <td className="gt-text-sm" style={{ color: 'var(--text-secondary)', maxWidth: 280 }} title={r.recurso ?? undefined}>{r.detalle ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </>
  )
}
