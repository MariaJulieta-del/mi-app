import { useState, useEffect } from 'react'
import type { Socio } from '../types/Socio'

interface Props {
  onGuardar: (socio: Socio) => void
  socioEditar?: Socio | null
  onCancelar: () => void
}

const SocioForm = ({ onGuardar, socioEditar, onCancelar }: Props) => {
  const [form, setForm] = useState<Socio>({
    nombre: '', apellido: '', dni: '', email: '', telefono: '', estado: 'ACTIVO'
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (socioEditar) setForm(socioEditar)
    else {
      setForm({ nombre: '', apellido: '', dni: '', email: '', telefono: '', estado: 'ACTIVO' })
      setTouched({})
    }
  }, [socioEditar])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setTouched(t => ({ ...t, [e.target.name]: true }))
  }

  const errores: Record<string, string> = {}
  if (touched.nombre  && !form.nombre.trim())  errores.nombre  = 'El nombre es obligatorio'
  if (touched.apellido && !form.apellido.trim()) errores.apellido = 'El apellido es obligatorio'
  if (touched.dni     && !form.dni.trim())     errores.dni     = 'El DNI es obligatorio'
  if (touched.dni && form.dni && !/^[\d.]+$/.test(form.dni.replace(/\./g, '')))
    errores.dni = 'Solo se permiten números en el DNI'
  if (touched.email && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errores.email = 'Email inválido'
  if (touched.telefono && form.telefono && !/^[\d\s+\-()]+$/.test(form.telefono))
    errores.telefono = 'Solo se permiten números y caracteres telefónicos'

  const hayErrores = Object.keys(errores).length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ nombre: true, apellido: true, dni: true, email: true, telefono: true })
    if (!form.nombre.trim() || !form.apellido.trim() || !form.dni.trim()) return
    if (hayErrores) return
    onGuardar(form)
    if (!socioEditar) {
      setForm({ nombre: '', apellido: '', dni: '', email: '', telefono: '', estado: 'ACTIVO' })
      setTouched({})
    }
  }

  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <p className="gt-card-title">{socioEditar ? 'Editar Socio' : 'Alta de Socio'}</p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="gt-form-grid">
          <div className="gt-form-group">
            <label className="gt-label">Nombre <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={`gt-input ${errores.nombre ? 'gt-input-error' : ''}`} name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" />
            {errores.nombre && <span className="gt-field-error">{errores.nombre}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Apellido <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={`gt-input ${errores.apellido ? 'gt-input-error' : ''}`} name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" />
            {errores.apellido && <span className="gt-field-error">{errores.apellido}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">DNI <span style={{ color: 'var(--red)' }}>*</span></label>
            <input className={`gt-input ${errores.dni ? 'gt-input-error' : ''}`} name="dni" value={form.dni} onChange={handleChange} placeholder="Ej: 38112445" />
            {errores.dni && <span className="gt-field-error">{errores.dni}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Teléfono</label>
            <input className={`gt-input ${errores.telefono ? 'gt-input-error' : ''}`} name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 11 1234-5678" />
            {errores.telefono && <span className="gt-field-error">{errores.telefono}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Email</label>
            <input className={`gt-input ${errores.email ? 'gt-input-error' : ''}`} name="email" type="email" value={form.email} onChange={handleChange} placeholder="socio@email.com" />
            {errores.email && <span className="gt-field-error">{errores.email}</span>}
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Estado</label>
            <select className="gt-select" name="estado" value={form.estado} onChange={handleChange}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="gt-btn gt-btn-primary">
            {socioEditar ? 'Actualizar' : 'Guardar socio'}
          </button>
          {socioEditar && (
            <button type="button" className="gt-btn gt-btn-secondary" onClick={onCancelar}>Cancelar</button>
          )}
        </div>
      </form>
    </div>
  )
}

export default SocioForm
