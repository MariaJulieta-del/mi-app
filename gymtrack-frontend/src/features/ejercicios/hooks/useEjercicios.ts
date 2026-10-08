import { useState, useEffect, useRef } from 'react'
import {
  listarTodosEjercicios, crearEjercicio, actualizarEjercicio,
  desactivarEjercicio, activarEjercicio,
  type Ejercicio,
} from '../services/ejercicioService'
import { listarMaquinas, type Maquina } from '../../maquinas/services/maquinaService'

const VACIO: Ejercicio = {
  nombre: '', descripcion: '', grupos: [], esMaquina: false,
  activo: true, imagenUrl: '', maquinaIds: [],
}

export function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useEjercicios() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  /** Ver solo los ejercicios que todavía no tienen máquina asociada (para ordenarlos) */
  const [soloSinMaquina, setSoloSinMaquina] = useState(false)
  const [form, setForm] = useState<Ejercicio>({ ...VACIO })
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [verInactivos, setVerInactivos] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendoImg, setSubiendoImg] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [quitandoMaquina, setQuitandoMaquina] = useState<string | null>(null)
  const imgRef = useRef<HTMLInputElement>(null)

  const cargarLocales = () =>
    Promise.all([listarTodosEjercicios(), listarMaquinas(false)])
      .then(([ejs, maks]) => { setEjercicios(ejs); setMaquinas(maks) })
      .catch(() => setError('Error al cargar'))

  useEffect(() => { cargarLocales() }, [])

  const filtrados = ejercicios.filter(e => {
    if (e.esMaquina) return false
    if (!verInactivos && !e.activo) return false
    const matchBusq = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchGrupo = !filtroGrupo || (e.grupos ?? []).includes(filtroGrupo)
    const matchMaquina = !soloSinMaquina || (e.maquinaIds ?? []).length === 0
    return matchBusq && matchGrupo && matchMaquina
  })

  const maquinasCompatibles = (grupos: string[]): Maquina[] => {
    if (!grupos || grupos.length === 0) return maquinas.filter(m => m.activa)
    return maquinas.filter(m => m.activa && (m.grupos ?? []).some(g => grupos.includes(g)))
  }

  const abrirNuevo = () => {
    setForm({ ...VACIO }); setEditandoId(null); setShowForm(true); setError(null); setExpandedId(null)
    setTimeout(() => document.getElementById('ej-nombre')?.focus(), 50)
  }

  const abrirEditar = (e: Ejercicio) => {
    setForm({ ...e, grupos: e.grupos ? [...e.grupos] : [], maquinaIds: e.maquinaIds ? [...e.maquinaIds] : [] })
    setEditandoId(e.id!); setShowForm(true); setError(null); setExpandedId(null)
  }

  const cancelar = () => { setShowForm(false); setForm({ ...VACIO }); setEditandoId(null) }

  const toggleGrupoForm = (g: string) =>
    setForm(f => ({
      ...f,
      grupos: (f.grupos ?? []).includes(g)
        ? (f.grupos ?? []).filter(x => x !== g)
        : [...(f.grupos ?? []), g],
    }))

  const toggleMaquinaForm = (mid: number) =>
    setForm(f => {
      const ids = f.maquinaIds ?? []
      return { ...f, maquinaIds: ids.includes(mid) ? ids.filter(i => i !== mid) : [...ids, mid] }
    })

  const handleImagen = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]; if (!file) return
    setSubiendoImg(true)
    try { setForm(f => ({ ...f, imagenUrl: '' })); const b = await resizeImage(file); setForm(f => ({ ...f, imagenUrl: b })) }
    catch { setError('Error al procesar imagen') }
    finally { setSubiendoImg(false) }
  }

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError(null)
    try {
      if (editandoId) { await actualizarEjercicio(editandoId, form); setMsg('Ejercicio actualizado.') }
      else { await crearEjercicio(form); setMsg('Ejercicio creado.') }
      cancelar(); await cargarLocales()
    } catch { setError('Error al guardar') } finally { setGuardando(false) }
  }

  const toggleActivo = async (e: Ejercicio) => {
    try {
      if (e.activo) await desactivarEjercicio(e.id!)
      else await activarEjercicio(e.id!)
      await cargarLocales()
    } catch { setError('Error al cambiar estado') }
  }

  const quitarMaquina = async (e: Ejercicio, maquinaId: number) => {
    const key = `${e.id}-${maquinaId}`
    setQuitandoMaquina(key)
    try {
      const nuevosIds = (e.maquinaIds ?? []).filter(id => id !== maquinaId)
      await actualizarEjercicio(e.id!, { ...e, maquinaIds: nuevosIds })
      await cargarLocales()
      setMsg('Máquina desasignada')
    } catch { setError('Error al quitar la máquina') }
    finally { setQuitandoMaquina(null) }
  }

  const asignarMaquina = async (e: Ejercicio, maquinaId: number) => {
    const key = `${e.id}-${maquinaId}`
    setQuitandoMaquina(key)
    try {
      await actualizarEjercicio(e.id!, { ...e, maquinaIds: [...(e.maquinaIds ?? []), maquinaId] })
      await cargarLocales()
      setMsg('Máquina asociada')
    } catch { setError('Error al asociar la máquina') }
    finally { setQuitandoMaquina(null) }
  }

  return {
    ejercicios, maquinas, filtrados,
    soloSinMaquina, setSoloSinMaquina, asignarMaquina,
    filtroGrupo, setFiltroGrupo,
    busqueda, setBusqueda,
    form, setForm,
    editandoId, showForm,
    verInactivos, setVerInactivos,
    msg, setMsg,
    error, setError,
    guardando, subiendoImg,
    expandedId, setExpandedId,
    imgRef,
    quitandoMaquina,
    cargarLocales,
    maquinasCompatibles,
    abrirNuevo, abrirEditar, cancelar,
    toggleGrupoForm, toggleMaquinaForm,
    handleImagen, guardar,
    toggleActivo, quitarMaquina,
  }
}
