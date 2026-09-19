import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Socio } from '../types/Socio'
import type { Tarifa } from '../types/Tarifa'
import type { MetodoPago } from '../types/Pago'
import { registrarConMembresia } from '../services/pagoService'
import { obtenerTodos, obtenerPorId } from '../services/socioService'
import { listarTarifas } from '../services/tarifaService'
import ConfirmModal from './ConfirmModal'
import { useToast } from '../hooks/useToast'

const METODOS: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']

export default function PagosForm() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const socioIdParam = searchParams.get('socioId')

  const [socioSel, setSocioSel]         = useState<Socio | null>(null)
  const [planSel, setPlanSel]           = useState<Tarifa | null>(null)
  const [metodo, setMetodo]             = useState<MetodoPago>('EFECTIVO')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError]               = useState<string | null>(null)
  const [guardando, setGuardando]       = useState(false)
  const [confirmar, setConfirmar]       = useState(false)

  const [socios, setSocios]   = useState<Socio[]>([])
  const [planes, setPlanes]   = useState<Tarifa[]>([])
  const [busqueda, setBusqueda]         = useState('')
  const [mostrarBuscador, setMostrarBuscador] = useState(false)

  // Validación
  const [touched, setTouched] = useState({ socio: false, plan: false })

  useEffect(() => {
    obtenerTodos().then(setSocios).catch(() => {})
    listarTarifas().then(setPlanes).catch(() => {})
    if (socioIdParam) {
      obtenerPorId(Number(socioIdParam)).then(s => setSocioSel(s)).catch(() => {})
    }
  }, [])

  const sociosFiltrados = busqueda.length >= 1
    ? socios.filter(s => {
        const q = busqueda.toLowerCase()
        return s.nombre.toLowerCase().includes(q) ||
          s.apellido.toLowerCase().includes(q) ||
          s.dni.includes(q)
      }).slice(0, 6)
    : []

  const seleccionarSocio = (s: Socio) => {
    setSocioSel(s)
    setBusqueda('')
    setMostrarBuscador(false)
    setTouched(t => ({ ...t, socio: false }))
  }

  const seleccionarPlan = (tipo: string) => {
    setPlanSel(planes.find(p => p.tipo === tipo) ?? null)
    setTouched(t => ({ ...t, plan: false }))
  }

  // Paso 1: validar y abrir modal de confirmación
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ socio: true, plan: true })
    if (!socioSel || !planSel) return
    setError(null)
    setConfirmar(true)
  }

  // Paso 2: confirmar y guardar
  const handleConfirmar = async () => {
    setConfirmar(false)
    setGuardando(true)
    try {
      await registrarConMembresia({
        socioId: socioSel!.id!,
        planTipo: planSel!.tipo,
        metodoPago: metodo,
        observaciones: observaciones || undefined,
      })
      toast.success('Pago registrado', `${socioSel!.nombre} ${socioSel!.apellido} — ${planSel!.nombre ?? planSel!.tipo}`)
      navigate('/pagos')
    } catch (err: any) {
      const msg = err?.response?.data?.error
      setError(msg ?? 'Error al registrar el pago')
      toast.error('Error al registrar', msg ?? 'Verificá los datos e intentá nuevamente')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Registrar Pago</h1>
      </div>

      <div className="gt-card">
        {error && (
          <div className="gt-alert gt-alert-error">
            {error}
            <button onClick={() => setError(null)}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── 1. Socio ── */}
          <div style={{ marginBottom: 20 }}>
            <label className="gt-label" style={{ marginBottom: 6, display: 'block' }}>
              1. Socio <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            {socioSel ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)', borderRadius: 8,
              }}>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>#{socioSel.id}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {socioSel.nombre} {socioSel.apellido}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>DNI {socioSel.dni}</span>
                <button
                  type="button"
                  onClick={() => { setSocioSel(null); setPlanSel(null); setMostrarBuscador(true) }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}
                >
                  cambiar
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  className="gt-btn gt-btn-secondary"
                  onClick={() => setMostrarBuscador(v => !v)}
                >
                  {mostrarBuscador ? 'Cerrar buscador' : 'Buscar socio'}
                </button>
                {touched.socio && !socioSel && (
                  <p className="gt-field-error" style={{ marginTop: 4 }}>Seleccioná un socio para continuar</p>
                )}
                {mostrarBuscador && (
                  <div style={{ marginTop: 10, padding: 14, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <input
                      className="gt-input"
                      placeholder="Nombre, apellido o DNI..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      style={{ marginBottom: 8 }}
                      autoFocus
                    />
                    {sociosFiltrados.length > 0 && (
                      <div style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-surface)' }}>
                        {sociosFiltrados.map(s => (
                          <div
                            key={s.id}
                            onClick={() => seleccionarSocio(s)}
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 10, color: 'var(--text-secondary)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>#{s.id}</span>
                            <span>{s.nombre} {s.apellido}</span>
                            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>DNI {s.dni}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {busqueda.length > 0 && sociosFiltrados.length === 0 && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Sin resultados para "{busqueda}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 2. Plan ── */}
          {socioSel && (
            <div style={{ marginBottom: 20 }}>
              <label className="gt-label" style={{ marginBottom: 6, display: 'block' }}>
                2. Plan de membresía <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <select
                className={`gt-select ${touched.plan && !planSel ? 'gt-input-error' : ''}`}
                value={planSel?.tipo ?? ''}
                onChange={e => seleccionarPlan(e.target.value)}
                style={{ maxWidth: 320 }}
              >
                <option value="">— Seleccioná un plan —</option>
                {planes.map(p => (
                  <option key={p.tipo} value={p.tipo}>
                    {p.nombre ?? p.tipo} — {p.duracionDias} días — ${Number(p.precio).toLocaleString('es-AR')}
                  </option>
                ))}
              </select>
              {touched.plan && !planSel && (
                <p className="gt-field-error">Seleccioná un plan para continuar</p>
              )}
              {planSel && (
                <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--blue-bg)', border: '1px solid var(--blue-text)22', borderRadius: 8, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Precio</p>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: 'var(--blue-text)' }}>
                      ${Number(planSel.precio).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Duración</p>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>{planSel.duracionDias} días</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Vencimiento estimado</p>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {new Date(Date.now() + planSel.duracionDias * 86400000).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. Método + observaciones ── */}
          {socioSel && planSel && (
            <div className="gt-form-grid" style={{ marginBottom: 16 }}>
              <div className="gt-form-group">
                <label className="gt-label">3. Método de pago <span style={{ color: 'var(--red)' }}>*</span></label>
                <select className="gt-select" value={metodo} onChange={e => setMetodo(e.target.value as MetodoPago)}>
                  {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="gt-label">Observaciones (opcional)</label>
                <textarea
                  className="gt-textarea"
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Ej: Comprobante #123, pago parcial, etc."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* ── Resumen ── */}
          {socioSel && planSel && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                <strong>{socioSel.nombre} {socioSel.apellido}</strong>
                {' → '}
                <strong>{planSel.nombre ?? planSel.tipo}</strong>
                {' · '}
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>${Number(planSel.precio).toLocaleString('es-AR')}</span>
                {' · '}
                {metodo}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              className="gt-btn gt-btn-primary"
              disabled={guardando}
            >
              {guardando ? 'Registrando...' : 'Registrar Pago'}
            </button>
            <button
              type="button"
              className="gt-btn gt-btn-secondary"
              onClick={() => navigate('/pagos')}
            >
              Volver
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        open={confirmar}
        title="Confirmar registro de pago"
        message={
          socioSel && planSel
            ? `¿Confirmás el pago de $${Number(planSel.precio).toLocaleString('es-AR')} (${planSel.nombre ?? planSel.tipo}) para ${socioSel.nombre} ${socioSel.apellido} por ${metodo}?`
            : '¿Confirmás el registro?'
        }
        confirmLabel="Confirmar pago"
        onConfirm={handleConfirmar}
        onCancel={() => setConfirmar(false)}
      />
    </>
  )
}
