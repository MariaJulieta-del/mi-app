import { useState, useEffect, useRef } from 'react'
import { registrarCheckin, listarHoy } from '../services/asistenciaService'

interface CheckinResultado {
  id: number
  socioId: number
  socioNombre: string
  socioDni: string
  fecha: string
  hora: string
  tipo: string
  permitido: boolean
  observacion?: string
  conDeuda?: boolean
  // info de membresía
  fechaVencimiento?: string
  tipoMembresia?: string
  entradasDisponibles?: number
  entradasUsadas?: number
  entradasRestantes?: number
}

interface Asistencia {
  id: number
  socioNombre: string
  socioDni: string
  hora: string
  tipo: string
  permitido: boolean
  observacion?: string
  conDeuda?: boolean
}

function diasHastaVencer(fechaVencimiento?: string): number | null {
  if (!fechaVencimiento) return null
  const [y, m, d] = fechaVencimiento.split('-').map(Number)
  const vence = new Date(y, m - 1, d)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export default function AccesoPage() {
  const [busqueda, setBusqueda]     = useState('')
  const tipo = 'ENTRADA'
  const [resultado, setResultado]   = useState<CheckinResultado | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [historial, setHistorial]   = useState<Asistencia[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { cargarHoy() }, [])

  const cargarHoy = async () => {
    try { setHistorial(await listarHoy()) } catch {}
  }

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!busqueda.trim()) { setError('Ingresá el DNI o ID del socio'); return }
    setError(null)
    setResultado(null)
    setLoading(true)
    const trimmed = busqueda.trim()
    const isId = /^\d{1,5}$/.test(trimmed)
    const payload = isId
      ? { socioId: parseInt(trimmed), tipo }
      : { dni: trimmed, tipo }
    try {
      const data = await registrarCheckin(payload)
      setResultado(data)
      setBusqueda('')
      cargarHoy()
      // refocus para el próximo scan
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al registrar el acceso')
    } finally {
      setLoading(false)
    }
  }

  // Calcular días para la tarjeta de vencimiento
  const dias = resultado ? diasHastaVencer(resultado.fechaVencimiento) : null
  const esPunchCard = resultado?.entradasDisponibles != null

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>🚪 Control de Acceso</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* ── Formulario de checkin ── */}
        <div className="gt-card">
          <p className="gt-card-title">Registrar ingreso</p>
          <form onSubmit={handleCheckin}>
            <div className="gt-form-group" style={{ marginBottom: 16 }}>
              <label className="gt-label">DNI o ID del socio</label>
              <input
                ref={inputRef}
                className="gt-input"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Ej: 38.112.445 o 7"
                autoFocus
                style={{ fontSize: 18, padding: '10px 12px', letterSpacing: 1 }}
              />
            </div>
            <button type="submit" className="gt-btn gt-btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '10px 0' }}>
              {loading ? '⏳ Verificando...' : '✅ Registrar ingreso'}
            </button>
          </form>

          {error && (
            <div className="gt-alert gt-alert-error" style={{ marginTop: 16 }}>{error}</div>
          )}

          {/* ── Panel de resultado ── */}
          {resultado && (
            <div style={{
              marginTop: 16, borderRadius: 10, overflow: 'hidden',
              border: `2px solid ${resultado.permitido ? '#16A34A' : '#DC2626'}`,
            }}>
              {/* Header de acceso */}
              <div style={{
                padding: '14px 18px',
                background: resultado.permitido ? '#DCFCE7' : '#FEE2E2',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 32 }}>{resultado.permitido ? '✅' : '🚫'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: resultado.permitido ? '#166534' : '#991B1B' }}>
                    {resultado.permitido ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
                  </div>
                  <div style={{ fontSize: 14, color: '#374151', marginTop: 2 }}>
                    <strong>{resultado.socioNombre}</strong>
                    <span style={{ color: '#6B7280', marginLeft: 8 }}>DNI: {resultado.socioDni}</span>
                  </div>
                </div>
              </div>

              {/* Info de membresía */}
              <div style={{ background: '#fff', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* Tipo de plan */}
                {resultado.tipoMembresia && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>Plan</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      background: '#EFF6FF', color: '#1D4ED8',
                      borderRadius: 6, padding: '2px 8px',
                    }}>
                      {resultado.tipoMembresia}
                    </span>
                  </div>
                )}

                {/* Punch-card: entradas */}
                {esPunchCard && resultado.entradasDisponibles != null && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>Entradas</span>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: (resultado.entradasRestantes ?? 0) <= 2 ? '#DC2626' :
                               (resultado.entradasRestantes ?? 0) <= 5 ? '#D97706' : '#166534',
                      }}>
                        {resultado.entradasRestantes ?? 0} / {resultado.entradasDisponibles} restantes
                      </span>
                    </div>
                    {/* Barra de progreso */}
                    <div style={{ background: '#F3F4F6', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        width: `${Math.round(((resultado.entradasRestantes ?? 0) / resultado.entradasDisponibles!) * 100)}%`,
                        background: (resultado.entradasRestantes ?? 0) <= 2 ? '#DC2626' :
                                    (resultado.entradasRestantes ?? 0) <= 5 ? '#D97706' : '#16A34A',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                )}

                {/* Plan por tiempo: vencimiento */}
                {!esPunchCard && resultado.fechaVencimiento && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>Vence</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: dias !== null && dias <= 7 ? '#D97706' : '#374151',
                    }}>
                      {resultado.fechaVencimiento.slice(0, 10)}
                      {dias !== null && (
                        <span style={{
                          marginLeft: 6,
                          color: dias <= 3 ? '#DC2626' : dias <= 7 ? '#D97706' : '#6B7280',
                          fontWeight: 400, fontSize: 11,
                        }}>
                          ({dias <= 0 ? 'vencida' : dias === 1 ? 'mañana' : `en ${dias} días`})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Observación */}
                {resultado.observacion && (
                  <div style={{
                    fontSize: 12, color: resultado.permitido ? '#92400E' : '#991B1B',
                    background: resultado.permitido ? '#FFFBEB' : '#FFF5F5',
                    borderRadius: 6, padding: '6px 10px', marginTop: 4,
                  }}>
                    {resultado.observacion}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Resumen del día ── */}
        <div className="gt-card">
          <p className="gt-card-title">Asistentes hoy — {new Date().toLocaleDateString('es-AR')}</p>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#1B5E44', textAlign: 'center', padding: '20px 0 8px' }}>
            {historial.filter(a => a.tipo === 'ENTRADA' && a.permitido).length}
          </div>
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 13, margin: '0 0 16px' }}>
            ingresos registrados
          </p>
          {historial.filter(a => !a.permitido).length > 0 && (
            <div style={{
              background: '#FEF3C7', border: '1px solid #FDE68A',
              borderRadius: 8, padding: '8px 12px', textAlign: 'center', fontSize: 13,
            }}>
              ⚠️ {historial.filter(a => !a.permitido).length} acceso{historial.filter(a => !a.permitido).length !== 1 ? 's' : ''} denegado{historial.filter(a => !a.permitido).length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Historial del día ── */}
      <div className="gt-card">
        <p className="gt-card-title">Registro del día</p>
        {historial.length === 0 ? (
          <div className="gt-empty">No hay registros para hoy todavía.</div>
        ) : (
          <div className="gt-table-wrap">
            <table className="gt-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Socio</th>
                  <th>DNI</th>
                  <th>Tipo</th>
                  <th>Acceso</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{String(a.hora).slice(0, 5)}</td>
                    <td className="gt-fw-600">{a.socioNombre}</td>
                    <td>{a.socioDni}</td>
                    <td>
                      <span className={a.tipo === 'ENTRADA' ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-blue'}>
                        {a.tipo}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className={a.permitido ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-red'}>
                          {a.permitido ? '✓ Permitido' : '✗ Denegado'}
                        </span>
                        {a.conDeuda && (
                          <span className="gt-badge gt-badge-yellow">CON DEUDA</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#6B7280', maxWidth: 200 }}>
                      {a.observacion ?? '—'}
                    </td>
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
