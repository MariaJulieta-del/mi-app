import { mensajeError } from '../../../shared/utils/errores'
import { useState, useEffect, useMemo } from 'react'
import type { Mantenimiento, MantenimientoRequest, TipoMantenimiento } from '../types/Mantenimiento'
import {
  listarMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento,
} from '../services/mantenimientoService'
import { fechaLocalISO } from '../../../shared/utils/fechas'

const MANT_VACIO: MantenimientoRequest = {
  maquinaId: 0, tipo: 'PENDIENTE', descripcion: '',
  fechaMantenimiento: fechaLocalISO(),
  fechaAlta: '', tecnico: '', telefonoTecnico: '', costo: undefined, observaciones: '',
}

export function useMantenimientos() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [mantForm, setMantForm] = useState<MantenimientoRequest>({ ...MANT_VACIO })
  const [mantEditId, setMantEditId] = useState<number | null>(null)
  const [mantShowForm, setMantShowForm] = useState(false)
  const [mantGuardando, setMantGuardando] = useState(false)
  const [mantError, setMantError] = useState<string | null>(null)
  const [mantMsg, setMantMsg] = useState<string | null>(null)
  const [mantFiltroMaquina, setMantFiltroMaquina] = useState<number | 'todas'>('todas')
  const [mantFiltroTipo, setMantFiltroTipo] = useState<TipoMantenimiento | 'todos'>('todos')
  const [confirmarEliminarMantId, setConfirmarEliminarMantId] = useState<number | null>(null)

  const cargarMantenimientos = () =>
    listarMantenimientos()
      .then(setMantenimientos)
      .catch((e: unknown) => setMantError('Error al cargar mantenimientos: ' + mensajeError(e, 'sin conexión con el servidor')))

  useEffect(() => { cargarMantenimientos() }, [])

  const mantFiltrados = useMemo(() => {
    return mantenimientos.filter(m => {
      const matchMaq = mantFiltroMaquina === 'todas' || m.maquinaId === mantFiltroMaquina
      const matchTipo = mantFiltroTipo === 'todos' || m.tipo === mantFiltroTipo
      return matchMaq && matchTipo
    })
  }, [mantenimientos, mantFiltroMaquina, mantFiltroTipo])

  const abrirNuevoMant = () => {
    setMantForm({ ...MANT_VACIO })
    setMantEditId(null)
    setMantShowForm(true)
    setMantError(null)
  }

  const abrirEditarMant = (m: Mantenimiento) => {
    setMantForm({
      maquinaId: m.maquinaId,
      tipo: m.tipo,
      descripcion: m.descripcion,
      fechaMantenimiento: m.fechaMantenimiento ?? fechaLocalISO(),
      fechaAlta: m.fechaAlta ?? '',
      tecnico: m.tecnico ?? '',
      telefonoTecnico: m.telefonoTecnico ?? '',
      costo: m.costo,
      observaciones: m.observaciones ?? '',
    })
    setMantEditId(m.id!)
    setMantShowForm(true)
    setMantError(null)
  }

  const cancelarMant = () => {
    setMantShowForm(false); setMantForm({ ...MANT_VACIO }); setMantEditId(null)
  }

  const guardarMant = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!mantForm.maquinaId) { setMantError('Seleccioná una máquina'); return }
    if (!mantForm.descripcion.trim()) { setMantError('La descripción es obligatoria'); return }
    setMantGuardando(true); setMantError(null)
    try {
      if (mantEditId) {
        await actualizarMantenimiento(mantEditId, mantForm)
        setMantMsg('Mantenimiento actualizado.')
      } else {
        await crearMantenimiento(mantForm)
        setMantMsg('Mantenimiento registrado.')
      }
      cancelarMant()
      await cargarMantenimientos()
    } catch (e: unknown) {
      setMantError(mensajeError(e, 'Error al guardar'))
    } finally { setMantGuardando(false) }
  }

  const eliminarMant = async (id: number) => {
    try {
      await eliminarMantenimiento(id)
      setMantMsg('Registro eliminado.')
      await cargarMantenimientos()
    } catch (e: unknown) {
      setMantError(mensajeError(e, 'Error al eliminar'))
    }
  }

  return {
    mantenimientos, mantFiltrados,
    mantForm, setMantForm, mantEditId, mantShowForm,
    mantGuardando, mantError, setMantError, mantMsg, setMantMsg,
    mantFiltroMaquina, setMantFiltroMaquina,
    mantFiltroTipo, setMantFiltroTipo,
    confirmarEliminarMantId, setConfirmarEliminarMantId,
    cargarMantenimientos, abrirNuevoMant, abrirEditarMant,
    cancelarMant, guardarMant, eliminarMant,
  }
}
