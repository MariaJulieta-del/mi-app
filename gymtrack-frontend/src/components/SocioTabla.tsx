import type { Socio } from '../types/Socio'

interface Props {
  socios: Socio[]
  onEditar: (socio: Socio) => void
  onEliminar: (id: number) => void
}

const SocioTabla = ({ socios, onEditar, onEliminar }: Props) => {
  if (socios.length === 0) {
    return <div className="gt-empty">No hay socios registrados aún.</div>
  }

  return (
    <div className="gt-table-wrap">
      <table className="gt-table">
        <thead>
          <tr>
            <th>Nombre y Apellido</th>
            <th>DNI</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {socios.map(s => (
            <tr key={s.id}>
              <td className="gt-fw-600">{s.nombre} {s.apellido}</td>
              <td>{s.dni}</td>
              <td>{s.email || '—'}</td>
              <td>{s.telefono || '—'}</td>
              <td>
                <span className={s.estado === 'ACTIVO' ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-red'}>
                  {s.estado ?? 'ACTIVO'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="gt-btn gt-btn-secondary" onClick={() => onEditar(s)}>
                    Editar
                  </button>
                  <button className="gt-btn gt-btn-danger" onClick={() => onEliminar(s.id!)}>
                    Dar de baja
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SocioTabla
