import { mensajeError } from '../../../shared/utils/errores'
import { useEffect, useState } from 'react'
import {
  listarProfesores, crearProfesor, editarProfesor, toggleProfesor, eliminarProfesor,
  type Profesor,
} from '../services/profesorService'
import { useToast } from '../../../shared/hooks/useToast'

export function useProfesores() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [editId, setEditId] = useState<number | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editNombre, setEditNombre] = useState('')
  const [editApellido, setEditApellido] = useState('')
  const [editTelefono, setEditTelefono] = useState('')
  const [editEspecialidad, setEditEspecialidad] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  const [confirmarEliminarId, setConfirmarEliminarId] = useState<number | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  const cargar = () =>
    listarProfesores()
      .then(setProfesores)
      .catch(() => setError('No se pudo cargar la lista de profesores.'))
      .finally(() => setCargando(false))

  useEffect(() => { cargar() }, [])

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setGuardando(true)
    try {
      await crearProfesor({
        username: username.trim(), password,
        email: email.trim() || undefined,
        nombre: nombre.trim() || undefined,
        apellido: apellido.trim() || undefined,
        telefono: telefono.trim() || undefined,
        especialidad: especialidad.trim() || undefined,
      })
      toast.success('Profesor creado correctamente.')
      setShowForm(false)
      setUsername(''); setPassword(''); setEmail('')
      setNombre(''); setApellido(''); setTelefono(''); setEspecialidad('')
      await cargar()
    } catch (err: unknown) {
      toast.error(mensajeError(err, 'Error al crear el profesor.'))
    } finally { setGuardando(false) }
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    setGuardandoEdit(true)
    try {
      await editarProfesor(editId, {
        username: editUsername.trim() || undefined,
        email: editEmail.trim() || undefined,
        password: editPassword.trim() || undefined,
        nombre: editNombre.trim() || undefined,
        apellido: editApellido.trim() || undefined,
        telefono: editTelefono.trim() || undefined,
        especialidad: editEspecialidad.trim() || undefined,
      })
      toast.success('Profesor actualizado.')
      setEditId(null)
      await cargar()
    } catch (err: unknown) {
      toast.error(mensajeError(err, 'Error al editar.'))
    } finally { setGuardandoEdit(false) }
  }

  const handleToggle = async (id: number) => {
    try {
      const { activo } = await toggleProfesor(id)
      setProfesores(prev => prev.map(p => p.id === id ? { ...p, activo } : p))
    } catch { toast.error('No se pudo cambiar el estado.') }
  }

  const handleEliminar = async () => {
    if (!confirmarEliminarId) return
    setEliminandoId(confirmarEliminarId)
    setConfirmarEliminarId(null)
    try {
      await eliminarProfesor(confirmarEliminarId)
      toast.success('Profesor eliminado.')
      await cargar()
    } catch { toast.error('No se pudo eliminar.') }
    finally { setEliminandoId(null) }
  }

  const abrirEditar = (p: Profesor) => {
    setEditId(p.id)
    setEditUsername(p.username)
    setEditEmail(p.email ?? '')
    setEditPassword('')
    setEditNombre(p.nombre ?? '')
    setEditApellido(p.apellido ?? '')
    setEditTelefono(p.telefono ?? '')
    setEditEspecialidad(p.especialidad ?? '')
  }

  return {
    profesores, cargando, error,
    showForm, setShowForm,
    username, setUsername,
    password, setPassword,
    email, setEmail,
    nombre, setNombre,
    apellido, setApellido,
    telefono, setTelefono,
    especialidad, setEspecialidad,
    guardando,
    editId, setEditId,
    editUsername, setEditUsername,
    editEmail, setEditEmail,
    editPassword, setEditPassword,
    editNombre, setEditNombre,
    editApellido, setEditApellido,
    editTelefono, setEditTelefono,
    editEspecialidad, setEditEspecialidad,
    guardandoEdit,
    confirmarEliminarId, setConfirmarEliminarId,
    eliminandoId,
    handleCrear, handleEditar, handleToggle, handleEliminar, abrirEditar,
  }
}
