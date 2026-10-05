import { useEffect, useMemo, useState } from 'react'
import {
  listarDisciplinas, crearDisciplina, actualizarDisciplina, cambiarActivaDisciplina, listarInstructores,
  type DisciplinaApi, type DisciplinaRequest, type Instructor,
} from '../services/disciplinaService'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'

export type Vista = 'semana' | 'lista'

const leerVista = (): Vista => {
  try { return localStorage.getItem('gt-disciplinas-vista') === 'lista' ? 'lista' : 'semana' } catch { return 'semana' }
}

export function useDisciplinas() {
  const toast = useToast()
  const [disciplinas, setDisciplinas] = useState<DisciplinaApi[]>([])
  const [instructores, setInstructores] = useState<Instructor[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Vista y filtros
  const [vista, setVistaEstado] = useState<Vista>(leerVista)
  const [busqueda, setBusqueda] = useState('')
  const [filtroInstructor, setFiltroInstructor] = useState('')
  const [verInactivas, setVerInactivas] = useState(false)

  // Modales: formulario (null = cerrado, 'nueva' o la disciplina a editar), alumnos y confirmación
  const [formulario, setFormulario] = useState<DisciplinaApi | 'nueva' | null>(null)
  const [alumnosDe, setAlumnosDe] = useState<DisciplinaApi | null>(null)
  const [confirmarActiva, setConfirmarActiva] = useState<DisciplinaApi | null>(null)

  const cargar = () =>
    listarDisciplinas(false)
      .then(lista => { setDisciplinas(lista); setError(null) })
      .catch(() => setError('No se pudieron cargar las disciplinas'))
      .finally(() => setCargando(false))

  useEffect(() => {
    cargar()
    listarInstructores().then(setInstructores).catch(() => {})
  }, [])

  const setVista = (v: Vista) => {
    setVistaEstado(v)
    try { localStorage.setItem('gt-disciplinas-vista', v) } catch { /* sin almacenamiento */ }
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return disciplinas
      .filter(d => verInactivas || d.activa)
      .filter(d => !filtroInstructor || (d.instructor ?? '') === filtroInstructor)
      .filter(d => !q || d.nombre.toLowerCase().includes(q) || (d.instructor ?? '').toLowerCase().includes(q))
  }, [disciplinas, busqueda, filtroInstructor, verInactivas])

  const nombresInstructores = useMemo(
    () => [...new Set(disciplinas.map(d => d.instructor).filter((x): x is string => !!x))].sort(),
    [disciplinas])

  const activas = disciplinas.filter(d => d.activa)
  const resumen = {
    activas: activas.length,
    inscriptos: activas.reduce((acc, d) => acc + d.totalInscritos, 0),
    clasesSemana: activas.reduce((acc, d) => acc + d.horarios.length, 0),
    completas: activas.filter(d => d.cupoMaximo != null && d.totalInscritos >= d.cupoMaximo).length,
  }

  /** Primer color libre entre las disciplinas activas */
  const colorSugerido = useMemo(() => {
    const usados = new Set(activas.map(d => d.color))
    for (let c = 1; c <= 8; c++) if (!usados.has(c)) return c
    return (disciplinas.length % 8) + 1
  }, [activas, disciplinas.length])

  const reemplazar = (d: DisciplinaApi) => {
    setDisciplinas(lista => lista.some(x => x.id === d.id) ? lista.map(x => (x.id === d.id ? d : x)) : [...lista, d])
    setAlumnosDe(actual => (actual && actual.id === d.id ? d : actual))
  }

  const guardar = async (datos: DisciplinaRequest) => {
    const editando = formulario !== 'nueva' && formulario !== null ? formulario : null
    const res = editando ? await actualizarDisciplina(editando.id, datos) : await crearDisciplina(datos)
    reemplazar(res)
    setFormulario(null)
    toast.success(editando ? 'Disciplina actualizada' : 'Disciplina creada', res.nombre)
  }

  const cambiarActiva = async () => {
    const d = confirmarActiva
    if (!d) return
    setConfirmarActiva(null)
    try {
      await cambiarActivaDisciplina(d.id, !d.activa)
      reemplazar({ ...d, activa: !d.activa })
      toast.success(d.activa ? 'Disciplina desactivada' : 'Disciplina reactivada', d.nombre)
    } catch (err: unknown) {
      toast.error('Error', mensajeError(err, 'No se pudo cambiar el estado'))
    }
  }

  return {
    disciplinas, visibles, instructores, nombresInstructores, cargando, error, resumen, colorSugerido,
    vista, setVista, busqueda, setBusqueda, filtroInstructor, setFiltroInstructor, verInactivas, setVerInactivas,
    formulario, setFormulario, alumnosDe, setAlumnosDe, confirmarActiva, setConfirmarActiva,
    guardar, cambiarActiva, reemplazar,
  }
}
