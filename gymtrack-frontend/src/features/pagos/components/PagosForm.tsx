import ConfirmModal from '../../../shared/components/ConfirmModal'
import MembresiaResumen from '../../membresias/components/MembresiaResumen'
import { textoPases } from '../../membresias/types/Tarifa'
import { formatFecha } from '../../../shared/utils/fechas'
import { usePagosForm, METODOS } from '../hooks/usePagosForm'

const PASOS = ['Socio', 'Plan', 'Método de pago', 'Confirmar']

const pesos = (n: number) => `$${Number(n).toLocaleString('es-AR')}`

export default function PagosForm() {
  const f = usePagosForm()

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Cobrar plan</h1>
      </div>

      <div className="gt-steps" aria-label="Pasos">
        {PASOS.map((nombre, i) => (
          <span key={nombre} className={`gt-step${f.paso === i + 1 ? ' activo' : ''}${f.paso > i + 1 ? ' hecho' : ''}`}>
            <span className="gt-step-num">{f.paso > i + 1 ? '✓' : i + 1}</span>{nombre}
          </span>
        ))}
      </div>

      <div className="gt-card">
        {f.error && (
          <div className="gt-alert gt-alert-error">
            {f.error}
            <button onClick={() => f.setError(null)}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
          </div>
        )}

        {/* ── 1. Socio ── */}
        <div className="gt-step-section">
          <label className="gt-label">1. ¿A quién le cobrás?</label>
          {f.socioSel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 8 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.socioSel.nombre} {f.socioSel.apellido}</span>
              <span className="gt-text-muted gt-text-sm">DNI {f.socioSel.dni}</span>
              <button type="button" className="gt-btn gt-btn-secondary" onClick={f.cambiarSocio}
                style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 10px' }}>Cambiar</button>
            </div>
          ) : (
            <div style={{ maxWidth: 480 }}>
              <input className="gt-input" placeholder="Buscá por nombre, apellido o DNI…" autoFocus
                value={f.busqueda} onChange={e => f.setBusqueda(e.target.value)} />
              {f.sociosFiltrados.length > 0 && (
                <div className="gt-card-list" style={{ marginTop: 6, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {f.sociosFiltrados.map(s => (
                    <button key={s.id} type="button" className="gt-option" onClick={() => f.seleccionarSocio(s)}
                      style={{ width: '100%', borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 10 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.nombre} {s.apellido}</span>
                      <span className="gt-text-muted gt-text-sm" style={{ marginLeft: 'auto' }}>DNI {s.dni}</span>
                    </button>
                  ))}
                </div>
              )}
              {f.busqueda && f.sociosFiltrados.length === 0 && (
                <p className="gt-hint">Sin resultados para "{f.busqueda}". ¿Es un socio nuevo? Dalo de alta desde Socios.</p>
              )}
            </div>
          )}
        </div>

        {f.socioSel && (
          <div className="gt-step-section">
            <label className="gt-label">Estado actual</label>
            {f.cargandoMembresia ? <p className="gt-text-muted">Cargando membresía…</p> : <MembresiaResumen m={f.membresiaActual} />}
          </div>
        )}

        {/* ── 2. Plan ── */}
        {f.socioSel && (
          <div className="gt-step-section">
            <label className="gt-label">2. Elegí el plan</label>
            <div className="gt-option-grid">
              {f.planes.map(p => (
                <button key={p.tipo} type="button" onClick={() => f.setPlanSel(p)}
                  className={`gt-option${f.planSel?.tipo === p.tipo ? ' selected' : ''}`}>
                  <p className="gt-option-title">{p.nombre}</p>
                  <p className="gt-option-sub">{p.duracionDias} días · {textoPases(p.pasesMensuales)}</p>
                  <p className="gt-option-price">{pesos(p.precio)}</p>
                  {f.membresiaActual?.tipoMembresia === p.tipo && <span className="gt-badge gt-badge-blue" style={{ marginTop: 6 }}>Plan actual</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 3. Método ── */}
        {f.planSel && (
          <div className="gt-step-section">
            <label className="gt-label">3. ¿Cómo paga?</label>
            <div className="gt-option-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
              {METODOS.map(m => (
                <button key={m.value} type="button" onClick={() => f.setMetodo(m.value)}
                  className={`gt-option${f.metodo === m.value ? ' selected' : ''}`}>
                  <p className="gt-option-title">{m.label}</p>
                </button>
              ))}
            </div>
            <div className="gt-form-group" style={{ marginTop: 12, maxWidth: 480 }}>
              <label className="gt-label">Observaciones (opcional)</label>
              <input className="gt-input" value={f.observaciones} onChange={e => f.setObservaciones(e.target.value)}
                placeholder="Ej: comprobante #123" />
            </div>
          </div>
        )}

        {/* ── 4. Resumen ── */}
        {f.listo && f.preview && (
          <div className="gt-step-section" style={{ padding: 16, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <label className="gt-label">4. Revisá y confirmá</label>
            <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)' }}>
              {f.preview.esRenovacion ? 'Renovás' : 'Activás'} la membresía de <strong>{f.socioSel!.nombre} {f.socioSel!.apellido}</strong> con
              el <strong>{f.planSel!.nombre}</strong> ({textoPases(f.planSel!.pasesMensuales)}).
            </p>
            <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)' }}>
              {f.preview.extiende
                ? <>Como todavía está vigente, se <strong>extiende</strong> del {formatFecha(f.preview.desde)} al <strong>{formatFecha(f.preview.hasta)}</strong>.</>
                : <>Queda activa desde hoy hasta el <strong>{formatFecha(f.preview.hasta)}</strong>.</>}
            </p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
              {pesos(f.planSel!.precio)} <span className="gt-text-muted" style={{ fontSize: 14, fontWeight: 500 }}>en {METODOS.find(m => m.value === f.metodo)?.label}</span>
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="gt-btn gt-btn-primary" disabled={!f.listo || f.guardando}
            onClick={() => f.setConfirmar(true)}>
            {f.guardando ? 'Registrando…' : `Cobrar${f.planSel ? ' ' + pesos(f.planSel.precio) : ''}`}
          </button>
          <button type="button" className="gt-btn gt-btn-secondary" onClick={() => f.navigate(f.volverA)}>Volver</button>
        </div>
      </div>

      <ConfirmModal
        open={f.confirmar}
        title="Confirmar cobro"
        message={f.listo
          ? `¿Confirmás el cobro de ${pesos(f.planSel!.precio)} (${f.planSel!.nombre}) a ${f.socioSel!.nombre} ${f.socioSel!.apellido}?`
          : ''}
        confirmLabel="Confirmar cobro"
        onConfirm={f.handleConfirmar}
        onCancel={() => f.setConfirmar(false)}
      />
    </>
  )
}
