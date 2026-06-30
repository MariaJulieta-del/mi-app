import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { Rutina } from '../types/Rutina'
import { obtenerRutina } from '../services/rutinaService'

// ID del socio actual (en producción vendría de contexto/auth)
const SOCIO_ID = 1

/**
 * Muestra el detalle completo de una rutina.
 * Incluye nombre, descripción, fecha y lista de ejercicios.
 * Accedido desde /rutinas/:id
 */
export default function RutinasDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [rutina, setRutina] = useState<Rutina | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!id) return
    obtenerRutina(Number(id), SOCIO_ID)
      .then(data => setRutina(data))
      .catch(() => setError('No se pudo cargar la rutina'))
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) return <p>Cargando...</p>
  if (error)    return <p style={{ color: 'red' }}>{error}</p>
  if (!rutina)  return <p>Rutina no encontrada.</p>

  return (
    <div>
      {/* Cabecera */}
      <button onClick={() => navigate('/rutinas')}>← Volver</button>
      <h2>{rutina.nombre}</h2>

      {rutina.descripcion && <p>{rutina.descripcion}</p>}

      <small>Creada el: {rutina.fechaCreacion?.slice(0, 10)}</small>

      {/* Acciones */}
      <div>
        <Link to={`/rutinas/editar/${rutina.id}`}>
          <button>Editar</button>
        </Link>
      </div>

      {/*
        Sección de ejercicios — lista los ejercicios de la rutina.
        Requiere endpoint GET /api/v1/rutinas/:id/ejercicios en el backend.
        (Descomentar cuando el endpoint esté implementado)

      <h3>Ejercicios</h3>
      {ejercicios.length === 0 ? (
        <p>Esta rutina todavía no tiene ejercicios.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ejercicio</th>
              <th>Series</th>
              <th>Reps</th>
              <th>Peso (kg)</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {ejercicios.map(ej => (
              <tr key={ej.id}>
                <td>{ej.orden}</td>
                <td>{ej.nombreEjercicio}</td>
                <td>{ej.series ?? '-'}</td>
                <td>{ej.repeticiones ?? '-'}</td>
                <td>{ej.pesoKg ?? '-'}</td>
                <td>{ej.notas ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      */}
    </div>
  )
}
