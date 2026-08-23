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
  const [error, setError] = useState('')

  useEffect(() => {
    if (socioEditar) setForm(socioEditar)
    else setForm({ nombre: '', apellido: '', dni: '', email: '', telefono: '', estado: 'ACTIVO' })
  }, [socioEditar])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.apellido || !form.dni) {
      setError('Nombre, apellido y DNI son obligatorios')
      return
    }
    setError('')
    onGuardar(form)
  }

  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <p className="gt-card-title">{socioEditar ? 'Editar Socio' : 'Alta / Edición de Socio'}</p>

      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="gt-form-grid">
          <div className="gt-form-group">
            <label className="gt-label">Nombre *</label>
            <input className="gt-input" name="nombre" value={form.nombre}
              onChange={handleChange} placeholder="Nombre" />
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Apellido *</label>
            <input className="gt-input" name="apellido" value={form.apellido}
              onChange={handleChange} placeholder="Apellido" />
          </div>
          <div className="gt-form-group">
            <label className="gt-label">DNI *</label>
            <input className="gt-input" name="dni" value={form.dni}
              onChange={handleChange} placeholder="Ej: 38.112.445" />
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Teléfono</label>
            <input className="gt-input" name="telefono" value={form.telefono}
              onChange={handleChange} placeholder="Teléfono" />
          </div>
          <div className="gt-form-group">
            <label className="gt-label">Email</label>
            <input className="gt-input" name="email" value={form.email}
              onChange={handleChange} placeholder="Email" />
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
            <button type="button" className="gt-btn gt-btn-secondary" onClick={onCancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default SocioForm
