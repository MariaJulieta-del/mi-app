import { useState } from 'react'
import type { Socio } from '../types/Socio'

interface Props {
  onGuardar: (socio: Socio) => void
  socioEditar?: Socio | null
  onCancelar: () => void
}

const SocioForm = ({ onGuardar, socioEditar, onCancelar }: Props) => {
  const [form, setForm] = useState<Socio>(socioEditar || {
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    estado: 'ACTIVO'
  })

  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = () => {
    if (!form.nombre || !form.apellido || !form.dni) {
      setError('Nombre, apellido y DNI son obligatorios')
      return
    }
    setError('')
    onGuardar(form)
  }

  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">{socioEditar ? 'Editar Socio' : 'Nuevo Socio'}</h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-bold">Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              className="form-control" placeholder="Nombre" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Apellido *</label>
            <input name="apellido" value={form.apellido} onChange={handleChange}
              className="form-control" placeholder="Apellido" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">DNI *</label>
            <input name="dni" value={form.dni} onChange={handleChange}
              className="form-control" placeholder="DNI" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Email</label>
            <input name="email" value={form.email} onChange={handleChange}
              className="form-control" placeholder="Email" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange}
              className="form-control" placeholder="Teléfono" />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange}
              className="form-select">
              <option>ACTIVO</option>
              <option>INACTIVO</option>
            </select>
          </div>
        </div>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        <div className="mt-3 d-flex gap-2">
          <button onClick={handleSubmit} className="btn btn-success">
            {socioEditar ? 'Actualizar' : 'Registrar'}
          </button>
          {socioEditar && (
            <button onClick={onCancelar} className="btn btn-secondary">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SocioForm