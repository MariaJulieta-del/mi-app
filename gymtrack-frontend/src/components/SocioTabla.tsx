import type { Socio } from '../types/Socio'

interface Props {
  socios: Socio[]
  onEditar: (socio: Socio) => void
  onEliminar: (id: number) => void
}

const SocioTabla = ({ socios, onEditar, onEliminar }: Props) => {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">Socios Registrados ({socios.length})</h5>
      </div>
      <div className="card-body p-0">
        {socios.length === 0 ? (
          <div className="p-4 text-center text-muted">
            No hay socios registrados aún.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>DNI</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {socios.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.nombre}</td>
                    <td>{s.apellido}</td>
                    <td>{s.dni}</td>
                    <td>{s.email || '—'}</td>
                    <td>
                      <span className={`badge ${s.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onEditar(s)}
                        className="btn btn-warning btn-sm me-2">
                        Editar
                      </button>
                      <button
                        onClick={() => onEliminar(s.id!)}
                        className="btn btn-danger btn-sm">
                        Dar de baja
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SocioTabla