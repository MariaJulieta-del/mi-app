import type { Socio } from '../types/Socio'
import { useSocioForm, FORMAS, type AltaFormValida } from '../hooks/useSocioForm'
import { textoPases } from '../../membresias/types/Tarifa'

interface Props {
  onGuardar: (socio: Socio) => void
  onAltaCompleta?: (data: AltaFormValida) => void
  socioEditar?: Socio | null
  onCancelar: () => void
}

const SocioForm = (props: Props) => {
  const s = useSocioForm(props)

  // ── EDICIÓN ──────────────────────────────────────────────────
  if (s.esEdicion) {
    return (
      <div className="gt-card" style={{ marginBottom: 20 }}>
        <p className="gt-card-title">Editar socio</p>
        <form onSubmit={s.handleSubmit} noValidate>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label">Nombre <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className={s.inputClass('nombre')} value={s.form.nombre}
                onChange={e => { s.setForm({ ...s.form, nombre: e.target.value }); s.touch('nombre') }}
                placeholder="Nombre" />
              {s.errores.nombre && <span className="gt-field-error">{s.errores.nombre}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Apellido <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className={s.inputClass('apellido')} value={s.form.apellido}
                onChange={e => { s.setForm({ ...s.form, apellido: e.target.value }); s.touch('apellido') }}
                placeholder="Apellido" />
              {s.errores.apellido && <span className="gt-field-error">{s.errores.apellido}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label">DNI <span style={{ color: 'var(--red)' }}>*</span></label>
              {/* El backend no actualiza el DNI (es el usuario de login del socio) → solo lectura al editar */}
              <input className={s.inputClass('dni')} value={s.form.dni} disabled
                title="El DNI no se puede modificar"
                placeholder="Ej: 38112445" />
              {s.errores.dni && <span className="gt-field-error">{s.errores.dni}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Teléfono</label>
              <input className={s.inputClass('telefono')} value={s.form.telefono ?? ''}
                onChange={e => { s.setForm({ ...s.form, telefono: e.target.value }); s.touch('telefono') }}
                placeholder="Ej: 11 1234-5678" />
              {s.errores.telefono && <span className="gt-field-error">{s.errores.telefono}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label">Email</label>
              <input className={s.inputClass('email')} type="email" value={s.form.email ?? ''}
                onChange={e => { s.setForm({ ...s.form, email: e.target.value }); s.touch('email') }}
                placeholder="socio@email.com" />
              {s.errores.email && <span className="gt-field-error">{s.errores.email}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="gt-btn gt-btn-primary">Actualizar socio</button>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={s.onCancelar}>Cancelar</button>
          </div>
        </form>
      </div>
    )
  }

  // ── ALTA ──────────────────────────────────────────────────────
  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <p className="gt-card-title">Alta de socio</p>
      <form onSubmit={s.handleSubmit} noValidate>

        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Datos personales
        </p>
        <div className="gt-form-grid">
          <div className="gt-form-group">
            <label className="gt-label">Nombre <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={s.inputClass('nombre')} value={s.altaForm.nombre}
              onChange={e => { s.setAltaForm(f => ({ ...f, nombre: e.target.value })); s.touch('nombre') }}
              placeholder="Nombre" />
            {s.errores.nombre && <span className="gt-field-error">{s.errores.nombre}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Apellido <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={s.inputClass('apellido')} value={s.altaForm.apellido}
              onChange={e => { s.setAltaForm(f => ({ ...f, apellido: e.target.value })); s.touch('apellido') }}
              placeholder="Apellido" />
            {s.errores.apellido && <span className="gt-field-error">{s.errores.apellido}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">DNI <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={s.inputClass('dni')} value={s.altaForm.dni}
              onChange={e => { s.setAltaForm(f => ({ ...f, dni: e.target.value })); s.touch('dni') }}
              placeholder="Ej: 38112445" />
            {s.errores.dni && <span className="gt-field-error">{s.errores.dni}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Teléfono</label>
            <input className={s.inputClass('telefono')} value={s.altaForm.telefono}
              onChange={e => { s.setAltaForm(f => ({ ...f, telefono: e.target.value })); s.touch('telefono') }}
              placeholder="Ej: 11 1234-5678" />
            {s.errores.telefono && <span className="gt-field-error">{s.errores.telefono}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Email</label>
            <input className={s.inputClass('email')} type="email" value={s.altaForm.email}
              onChange={e => { s.setAltaForm(f => ({ ...f, email: e.target.value })); s.touch('email') }}
              placeholder="socio@email.com" />
            {s.errores.email && <span className="gt-field-error">{s.errores.email}</span>}
          </div>
        </div>

        {/* Plan */}
        <div style={{ margin: '20px 0 12px', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Plan de membresía
          </p>
          {s.loadingTarifas ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando planes…</p>
          ) : s.tarifas.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--red)' }}>No hay planes configurados. Cargá tarifas primero.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {s.tarifas.map(t => {
                const sel = s.altaForm.tipoMembresia === t.tipo
                return (
                  <button key={t.tipo} type="button"
                    onClick={() => { s.setAltaForm(f => ({ ...f, tipoMembresia: t.tipo })); s.touch('tipoMembresia') }}
                    style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      border: `2px solid ${sel ? '#D97706' : 'var(--border)'}`,
                      background: sel ? 'var(--yellow-bg)' : 'var(--bg-surface-2)', textAlign: 'left', minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: sel ? 'var(--yellow-text)' : 'var(--text-primary)' }}>{t.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      ${t.precio.toLocaleString('es-AR')} · {t.duracionDias} días
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--blue-text)', marginTop: 2 }}>🎟️ {textoPases(t.pasesMensuales)}</div>
                  </button>
                )
              })}
            </div>
          )}
          {s.errores.tipoMembresia && <span className="gt-field-error">{s.errores.tipoMembresia}</span>}
        </div>

        {/* Forma de pago */}
        <div style={{ margin: '20px 0 12px', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Forma de pago
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {FORMAS.map(fp => {
              const sel = s.altaForm.formaDePago === fp.value
              return (
                <button key={fp.value} type="button"
                  onClick={() => { s.setAltaForm(f => ({ ...f, formaDePago: fp.value })); s.touch('formaDePago') }}
                  style={{ padding: '10px 18px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    fontWeight: sel ? 700 : 500, fontSize: 13,
                    border: `2px solid ${sel ? fp.color : 'var(--border)'}`,
                    background: sel ? fp.bg : 'var(--bg-surface-2)',
                    color: sel ? fp.color : 'var(--text-secondary)' }}>
                  {fp.label}
                </button>
              )
            })}
          </div>
          {s.errores.formaDePago && <span className="gt-field-error">{s.errores.formaDePago}</span>}

          {s.altaForm.tipoMembresia && s.altaForm.formaDePago && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'var(--green-bg)',
              border: '1.5px solid var(--accent-border)', fontSize: 13, color: 'var(--text-secondary)' }}>
                <>
                  <strong>✓ Alta con pago:</strong> se registra el socio y se cobra{' '}
                  <strong>${s.tarifaSeleccionada?.precio.toLocaleString('es-AR')}</strong> por{' '}
                  <strong>{s.tarifaSeleccionada?.nombre ?? s.altaForm.tipoMembresia}</strong> en{' '}
                  <strong>{FORMAS.find(f => f.value === s.altaForm.formaDePago)?.label.replace(/^[^\s]+\s/, '')}</strong>.
                  La membresía queda activa de inmediato con {textoPases(s.tarifaSeleccionada?.pasesMensuales)}.
                </>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="submit" className="gt-btn gt-btn-primary">
            ✓ Registrar y cobrar
          </button>
        </div>
      </form>
    </div>
  )
}

export default SocioForm
