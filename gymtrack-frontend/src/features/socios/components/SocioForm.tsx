import { GENEROS, type Genero, type Socio } from '../types/Socio'
import { edadDe, fechaLocalISO } from '../../../shared/utils/fechas'
import { useSocioForm, FORMAS, type AltaFormValida } from '../hooks/useSocioForm'
import { textoPases } from '../../membresias/types/Tarifa'
import Modal from '../../../shared/components/Modal'

interface Props {
  onGuardar: (socio: Socio) => void
  onAltaCompleta?: (data: AltaFormValida) => void
  socioEditar?: Socio | null
  onCancelar: () => void
  /** Se está registrando (deshabilita el botón) */
  guardando?: boolean
}

/** Fecha de nacimiento (muestra la edad) y género: sirven para las métricas de público en Reportes */
function CamposPublico({ nacimiento, genero, onNacimiento, onGenero, error }: {
  nacimiento: string; genero: Genero | ''
  onNacimiento: (v: string) => void; onGenero: (v: Genero | '') => void; error?: string
}) {
  const edad = edadDe(nacimiento)
  return (
    <>
      <div className="gt-form-group">
        <label className="gt-label" htmlFor="socio-nacimiento">
          Fecha de nacimiento {edad != null && <span className="gt-text-muted gt-peso-normal">· {edad} años</span>}
        </label>
        <input id="socio-nacimiento" className={`gt-input${error ? ' gt-input-error' : ''}`} type="date"
          value={nacimiento} max={fechaLocalISO()} min="1915-01-01" onChange={e => onNacimiento(e.target.value)} />
        {error && <span className="gt-field-error">{error}</span>}
      </div>
      <div className="gt-form-group">
        <label className="gt-label" htmlFor="socio-genero">Género</label>
        <select id="socio-genero" className="gt-select" value={genero} onChange={e => onGenero(e.target.value as Genero | '')}>
          <option value="">Prefiere no decirlo</option>
          {GENEROS.map(g => <option key={g.valor} value={g.valor}>{g.texto}</option>)}
        </select>
      </div>
    </>
  )
}

const SocioForm = (props: Props) => {
  const s = useSocioForm(props)

  // ── EDICIÓN ──────────────────────────────────────────────────
  if (s.esEdicion) {
    return (
      <Modal titulo="Editar socio" onCerrar={s.onCancelar} ancho={640}
        pie={<>
          <button type="button" className="gt-btn gt-btn-secondary" onClick={s.onCancelar}>Cancelar</button>
          <button type="submit" form="form-socio-editar" className="gt-btn gt-btn-primary" disabled={props.guardando}>{props.guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </>}>
        <form id="form-socio-editar" onSubmit={s.handleSubmit} noValidate>
          <div className="gt-form-grid">
            <div className="gt-form-group">
              <label className="gt-label" htmlFor="socioform-campo-1">Nombre <span className="gt-requerido" aria-hidden>*</span></label>
              <input id="socioform-campo-1" className={s.inputClass('nombre')} value={s.form.nombre}
                onChange={e => { s.setForm({ ...s.form, nombre: e.target.value }); s.touch('nombre') }}
                placeholder="Nombre" />
              {s.errores.nombre && <span className="gt-field-error">{s.errores.nombre}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label" htmlFor="socioform-campo-2">Apellido <span className="gt-requerido" aria-hidden>*</span></label>
              <input id="socioform-campo-2" className={s.inputClass('apellido')} value={s.form.apellido}
                onChange={e => { s.setForm({ ...s.form, apellido: e.target.value }); s.touch('apellido') }}
                placeholder="Apellido" />
              {s.errores.apellido && <span className="gt-field-error">{s.errores.apellido}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label" htmlFor="socioform-campo-3">DNI <span className="gt-requerido" aria-hidden>*</span></label>
              {/* El backend no actualiza el DNI (es el usuario de login del socio) → solo lectura al editar */}
              <input id="socioform-campo-3" className={s.inputClass('dni')} value={s.form.dni} disabled
                title="El DNI no se puede modificar"
                placeholder="Ej: 38112445" />
              {s.errores.dni && <span className="gt-field-error">{s.errores.dni}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label" htmlFor="socioform-campo-4">Teléfono</label>
              <input id="socioform-campo-4" className={s.inputClass('telefono')} value={s.form.telefono ?? ''}
                onChange={e => { s.setForm({ ...s.form, telefono: e.target.value }); s.touch('telefono') }}
                placeholder="Ej: 11 1234-5678" />
              {s.errores.telefono && <span className="gt-field-error">{s.errores.telefono}</span>}
            </div>
            <div className="gt-form-group">
              <label className="gt-label" htmlFor="socioform-campo-5">Email</label>
              <input id="socioform-campo-5" className={s.inputClass('email')} type="email" value={s.form.email ?? ''}
                onChange={e => { s.setForm({ ...s.form, email: e.target.value }); s.touch('email') }}
                placeholder="socio@email.com" />
              {s.errores.email && <span className="gt-field-error">{s.errores.email}</span>}
            </div>
            <CamposPublico nacimiento={s.form.fechaNacimiento ?? ''} genero={s.form.genero ?? ''} error={s.errores.fechaNacimiento}
              onNacimiento={v => { s.setForm({ ...s.form, fechaNacimiento: v }); s.touch('fechaNacimiento') }}
              onGenero={v => s.setForm({ ...s.form, genero: v || null })} />
          </div>
          
        </form>
      </Modal>
    )
  }

  // ── ALTA ──────────────────────────────────────────────────────
  return (
    <Modal titulo="Nuevo socio" onCerrar={s.onCancelar} ancho={720}
      pie={<>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={s.onCancelar}>Cancelar</button>
        <button type="submit" form="form-socio-alta" className="gt-btn gt-btn-primary" disabled={props.guardando}>
          {props.guardando ? 'Registrando…' : 'Registrar y cobrar'}
        </button>
      </>}>
      <form id="form-socio-alta" onSubmit={s.handleSubmit} noValidate>

        <p className="gt-subtitulo">
          Datos personales
        </p>
        <div className="gt-form-grid">
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="socioform-campo-6">Nombre <span className="gt-requerido" aria-hidden>*</span></label>
            <input id="socioform-campo-6" className={s.inputClass('nombre')} value={s.altaForm.nombre}
              onChange={e => { s.setAltaForm(f => ({ ...f, nombre: e.target.value })); s.touch('nombre') }}
              placeholder="Nombre" />
            {s.errores.nombre && <span className="gt-field-error">{s.errores.nombre}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="socioform-campo-7">Apellido <span className="gt-requerido" aria-hidden>*</span></label>
            <input id="socioform-campo-7" className={s.inputClass('apellido')} value={s.altaForm.apellido}
              onChange={e => { s.setAltaForm(f => ({ ...f, apellido: e.target.value })); s.touch('apellido') }}
              placeholder="Apellido" />
            {s.errores.apellido && <span className="gt-field-error">{s.errores.apellido}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="socioform-campo-8">DNI <span className="gt-requerido" aria-hidden>*</span></label>
            <input id="socioform-campo-8" className={s.inputClass('dni')} value={s.altaForm.dni}
              onChange={e => { s.setAltaForm(f => ({ ...f, dni: e.target.value })); s.touch('dni') }}
              placeholder="Ej: 38112445" />
            {s.errores.dni && <span className="gt-field-error">{s.errores.dni}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="socioform-campo-9">Teléfono</label>
            <input id="socioform-campo-9" className={s.inputClass('telefono')} value={s.altaForm.telefono}
              onChange={e => { s.setAltaForm(f => ({ ...f, telefono: e.target.value })); s.touch('telefono') }}
              placeholder="Ej: 11 1234-5678" />
            {s.errores.telefono && <span className="gt-field-error">{s.errores.telefono}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="socioform-campo-10">Email</label>
            <input id="socioform-campo-10" className={s.inputClass('email')} type="email" value={s.altaForm.email}
              onChange={e => { s.setAltaForm(f => ({ ...f, email: e.target.value })); s.touch('email') }}
              placeholder="socio@email.com" />
            {s.errores.email && <span className="gt-field-error">{s.errores.email}</span>}
          </div>
          <CamposPublico nacimiento={s.altaForm.fechaNacimiento} genero={s.altaForm.genero} error={s.errores.fechaNacimiento}
            onNacimiento={v => { s.setAltaForm(f => ({ ...f, fechaNacimiento: v })); s.touch('fechaNacimiento') }}
            onGenero={v => s.setAltaForm(f => ({ ...f, genero: v }))} />
        </div>

        {/* Plan */}
        <div className="gt-alta-seccion">
          <p className="gt-subtitulo">
            Plan de membresía
          </p>
          {s.loadingTarifas ? (
            <p className="gt-text-sm gt-text-muted">Cargando planes…</p>
          ) : s.tarifas.length === 0 ? (
            <p className="gt-text-sm gt-texto-error">No hay planes activos. Creá uno en Membresías.</p>
          ) : (
            <div className="gt-alta-opciones">
              {s.tarifas.map(t => {
                const sel = s.altaForm.tipoMembresia === t.tipo
                return (
                  <button key={t.tipo} type="button" aria-pressed={sel} className={`gt-alta-plan${sel ? ' activo' : ''}`}
                    onClick={() => { s.setAltaForm(f => ({ ...f, tipoMembresia: t.tipo })); s.touch('tipoMembresia') }}>
                    <strong>{t.nombre}</strong>
                    <span>${t.precio.toLocaleString('es-AR')} · {t.duracionDias} días</span>
                    <small>🎟️ {textoPases(t.pasesMensuales)}</small>
                  </button>
                )
              })}
            </div>
          )}
          {s.errores.tipoMembresia && <span className="gt-field-error">{s.errores.tipoMembresia}</span>}
        </div>

        {/* Forma de pago */}
        <div className="gt-alta-seccion">
          <p className="gt-subtitulo">
            Forma de pago
          </p>
          <div className="gt-alta-opciones">
            {FORMAS.map(fp => {
              const sel = s.altaForm.formaDePago === fp.value
              return (
                <button key={fp.value} type="button" aria-pressed={sel} className={`gt-alta-forma${sel ? ' activo' : ''}`}
                  style={sel ? { borderColor: fp.color, background: fp.bg, color: fp.color } : undefined}
                  onClick={() => { s.setAltaForm(f => ({ ...f, formaDePago: fp.value })); s.touch('formaDePago') }}>
                  {fp.label}
                </button>
              )
            })}
          </div>
          {s.errores.formaDePago && <span className="gt-field-error">{s.errores.formaDePago}</span>}

          {s.altaForm.tipoMembresia && s.altaForm.formaDePago && (
            <div className="gt-alta-resumen" role="status">
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

      </form>
    </Modal>
  )
}

export default SocioForm
