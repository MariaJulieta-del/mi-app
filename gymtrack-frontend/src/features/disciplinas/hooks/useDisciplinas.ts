import { useState, useEffect, useRef } from 'react'
import { type DisciplinaApi, listarDisciplinas, crearDisciplina, actualizarDisciplina, desactivarDisciplina, renovarMesDisciplina } from '../services/disciplinaService'

export interface Disciplina {
  id?: number; nombre: string; descripcion: string; instructor: string; horario: string
  cupoMaximo: number | ''; activa: boolean; diasSemana: string[]; horaInicio: string; horaFin: string
}

export const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
export const DIAS_CORTO: Record<string, string> = {
  LUNES: 'Lun', MARTES: 'Mar', 'MIÉRCOLES': 'Mié', JUEVES: 'Jue',
  VIERNES: 'Vie', 'SÁBADO': 'Sáb', DOMINGO: 'Dom',
}

const VACIO: Disciplina = {
  nombre: '', descripcion: '', instructor: '', horario: '',
  cupoMaximo: '', activa: true, diasSemana: [], horaInicio: '', horaFin: '',
}

export function useDisciplinas() {
  const formRef = useRef<HTMLDivElement>(null)
  const [disciplinas, setDisciplinas] = useState<DisciplinaApi[]>([])
  const [form, setForm] = useState<Disciplina>(VACIO)
  const [editando, setEditando] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [renovando, setRenovando] = useState<number | null>(null)

  const cargar = () =>
    listarDisciplinas(false).then(setDisciplinas).catch(() => setError('No se pudieron cargar las disciplinas'))

  useEffect(() => { cargar() }, [])

  const toggleDia = (dia: string) => {
    setForm(f => ({
      ...f,
      diasSemana: f.diasSemana.includes(dia) ? f.diasSemana.filter(d => d !== dia) : [...f.diasSemana, dia],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre) { setError('El nombre es obligatorio'); return }
    try {
      const payload = { ...form, cupoMaximo: form.cupoMaximo === '' ? null : form.cupoMaximo }
      if (editando !== null) {
        await actualizarDisciplina(editando, payload)
        setExito('Disciplina actualizada')
      } else {
        await crearDisciplina(payload)
        setExito('Disciplina creada')
      }
      setForm(VACIO); setEditando(null); setError(null); cargar()
    } catch { setError('Error al guardar la disciplina') }
  }

  const handleEditar = (d: DisciplinaApi) => {
    setForm({
      id: d.id, nombre: d.nombre ?? '', descripcion: d.descripcion ?? '',
      instructor: d.instructor ?? '', horario: d.horario ?? '',
      cupoMaximo: d.cupoMaximo ?? '', activa: d.activa ?? true,
      diasSemana: d.diasSemana ?? [], horaInicio: d.horaInicio ?? '', horaFin: d.horaFin ?? '',
    })
    setEditando(d.id); setExito(null); setError(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleDesactivar = async (id: number) => {
    try { await desactivarDisciplina(id); setExito('Disciplina desactivada'); cargar() }
    catch { setError('Error al desactivar') }
  }

  const handleRenovarMes = async (id: number, nombre: string) => {
    if (!confirm(`¿Renovar mes de "${nombre}"? Esto liberará todos los cupos actuales.`)) return
    try {
      setRenovando(id)
      await renovarMesDisciplina(id)
      setExito(`Cupos de "${nombre}" renovados — socios desvinculados`)
      cargar()
    } catch { setError('Error al renovar el mes') }
    finally { setRenovando(null) }
  }

  const cancelarEdicion = () => { setForm(VACIO); setEditando(null) }

  return {
    formRef, disciplinas, form, setForm, editando, error, setError, exito, setExito, renovando,
    toggleDia, handleSubmit, handleEditar, handleDesactivar, handleRenovarMes, cancelarEdicion,
    DIAS, DIAS_CORTO,
  }
}
