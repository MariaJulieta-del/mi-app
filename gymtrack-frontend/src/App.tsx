import { useState, useEffect } from 'react'
import type { Socio } from './types/Socio'
import { obtenerTodos, crearSocio, actualizarSocio, darDeBaja } from './services/socioService'
import SocioForm from './components/SocioForm'
import SocioTabla from './components/SocioTabla'

function App() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [socioEditar, setSocioEditar] = useState<Socio | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargarSocios()
  }, [])

  const cargarSocios = async () => {
    try {
      const data = await obtenerTodos()
      setSocios(data)
    } catch {
      setError('Error al cargar los socios')
    }
  }

  const handleGuardar = async (socio: Socio) => {
    try {
      if (socioEditar?.id) {
        await actualizarSocio(socioEditar.id, socio)
        setMensaje('Socio actualizado correctamente')
      } else {
        await crearSocio(socio)
        setMensaje('Socio registrado correctamente')
      }
      setSocioEditar(null)
      setError('')
      cargarSocios()
    } catch {
      setError('Error: el DNI ya existe o hay un problema con los datos')
      setMensaje('')
    }
  }

  const handleEliminar = async (id: number) => {
    try {
      await darDeBaja(id)
      setMensaje('Socio dado de baja correctamente')
      cargarSocios()
    } catch {
      setError('Error al dar de baja al socio')
    }
  }

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h1 className="text-success fw-bold">GymTrack</h1>
        <p className="text-muted">Sistema de Gestión de Socios</p>
      </div>

      {mensaje && (
        <div className="alert alert-success alert-dismissible">
          {mensaje}
          <button onClick={() => setMensaje('')} className="btn-close" />
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button onClick={() => setError('')} className="btn-close" />
        </div>
      )}

      <SocioForm
        onGuardar={handleGuardar}
        socioEditar={socioEditar}
        onCancelar={() => setSocioEditar(null)}
      />

      <SocioTabla
        socios={socios}
        onEditar={(s) => setSocioEditar(s)}
        onEliminar={handleEliminar}
      />
    </div>
  )
}

export default App