import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Membresia, EstadoMembresia } from '../types/Membresia'
import { listarMembresias, cambiarEstado } from '../services/membresiaService'

const BADGE: Record<EstadoMembresia, string> = {
  ACTIVA:         'gt-badge gt-badge-green',
  PENDIENTE_PAGO: 'gt-badge gt-badge-yellow',
  VENCIDA:        'gt-badge gt-badge-gray',
  CANCELADA:      'gt-badge gt-badge-red',
}

export default function MembresiasList() {
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [error, setError]           = useState<string | null>(null)
  const [cargando, setCargando]     = useState(true)

  useEffect(() => {
    listarMembresias()
      .then(setMembresias)
      .catch(() => setError('Error al cargar las membresías'))
      .finally(() => setCargando(false))
  }, [])

  const handleCancelar = async (id: number) => {
    if (!confirm('¿Cancelar esta membresía?')) return
    try {
      const actualizada = await cambiarEstado(id, 'CANCELADA')
      setMembresias(prev => prev.map(m => m.id === id ? actualizada : m))
    } catch { alert('No se pudo cancelar') }
  }

  return (
    <>
      <div className="gt-section-header">
        <h1 className="gt-page-title" style={{ margin: 0 }}>Membresías</h1>
        <Link to="/membresias/nueva" className="gt-btn gt-btn-primary">+ Nueva membresía</Link>
      </div>

      {error && <div className="gt-alert gt-alert-error">{error}</div>}

      {cargando ? (
        <p className="gt-text-muted">Cargando...</p>
      ) : membresias.length === 0 ? (
        <div className="gt-empty">Sin membresías registradas.</div>
      ) : (
        <div className="gt-table-wrap">
          <table className="gt-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Vencimiento</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {membresias.map(m => (
                <tr key={m.id}>
                  <td className="gt-fw-600">{m.socioNombreCompleto}</td>
                  <td>{m.tipoMembresia}</td>
                  <td><span className={BADGE[m.estadoMembresia!]}>{m.estadoMembresia}</span></td>
                  <td>{m.fechaInicio}</td>
                  <td>{m.fechaVencimiento}</td>
                  <td>${m.precio}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/membresias/${m.id}`} className="gt-btn gt-btn-secondary">Ver</Link>
                      {(m.estadoMembresia === 'ACTIVA' || m.estadoMembresia === 'PENDIENTE_PAGO') && (
                        <button className="gt-btn gt-btn-danger" onClick={() => handleCancelar(m.id!)}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
