import { useEffect, useState } from 'react'
import type { Tarifa } from '../types/Tarifa'
import { listarTarifas, actualizarTarifa, cambiarActivoTarifa, eliminarTarifa } from '../services/tarifaService'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'

export const TIPO_COLOR: Record<string, string> = {
  MENSUAL: '#2E75B6',
  TRIMESTRAL: '#7C3AED',
  SEMESTRAL: '#D97706',
  ANUAL: '#16A34A',
}
export function colorPara(tipo: string): string {
  return TIPO_COLOR[tipo] ?? 'var(--accent)'
}

export interface EdicionPlan { tipo: string; nombre: string; precio: string; pases: string; incluye: string }

export function useMembresiasList() {
  const { user } = useAuth()
  const toast = useToast()
  const isAdmin = user?.rol === 'ADMIN'
  const [planes, setPlanes] = useState<Tarifa[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editando, setEditando] = useState<EdicionPlan | null>(null)
  const [guardando, setGuardando] = useState(false)
  /** Plan a deshabilitar o borrar (se confirma) */
  const [confirmar, setConfirmar] = useState<{ plan: Tarifa; accion: 'deshabilitar' | 'borrar' } | null>(null)

  useEffect(() => {
    listarTarifas()
      .then(setPlanes)
      .catch(() => setError('Error al cargar los planes'))
      .finally(() => setCargando(false))
  }, [])

  const reemplazar = (t: Tarifa) => setPlanes(prev => prev.map(p => (p.tipo === t.tipo ? t : p)))

  const iniciarEdicion = (p: Tarifa) => setEditando({
    tipo: p.tipo, nombre: p.nombre ?? p.tipo, precio: String(p.precio), pases: p.pasesMensuales ? String(p.pasesMensuales) : '', incluye: p.incluye ?? '',
  })

  const guardarPlan = async () => {
    if (!editando) return
    const precio = Number(editando.precio)
    if (!editando.nombre.trim()) { toast.error('Falta el nombre'); return }
    if (!(precio > 0)) { toast.error('Revisá el precio', 'Tiene que ser mayor a cero'); return }
    const pases = Number(editando.pases)
    setGuardando(true)
    try {
      const t = await actualizarTarifa(editando.tipo, {
        precio, pasesMensuales: editando.pases === '' || !(pases > 0) ? null : pases,
        nombre: editando.nombre.trim(), incluye: editando.incluye,
      })
      reemplazar(t)
      setEditando(null)
      toast.success('Plan actualizado', `${t.nombre}: los cambios aplican cuando cada socio renueva`)
    } catch (e) { toast.error('No se pudo guardar', mensajeError(e, 'Error al guardar el plan')) }
    finally { setGuardando(false) }
  }

  const cambiarActivo = async (p: Tarifa, activo: boolean) => {
    try {
      reemplazar(await cambiarActivoTarifa(p.tipo, activo))
      toast.success(activo ? 'Plan habilitado' : 'Plan deshabilitado', activo ? `${p.nombre} se vuelve a ofrecer al cobrar` : `${p.nombre} ya no se ofrece al cobrar`)
    } catch (e) { toast.error('No se pudo cambiar', mensajeError(e, 'Error al cambiar el plan')) }
  }

  const confirmarAccion = async () => {
    if (!confirmar) return
    const { plan, accion } = confirmar
    setConfirmar(null)
    if (accion === 'deshabilitar') { await cambiarActivo(plan, false); return }
    try {
      await eliminarTarifa(plan.tipo)
      setPlanes(prev => prev.filter(p => p.tipo !== plan.tipo))
      toast.success('Plan borrado', plan.nombre)
    } catch (e) { toast.error('No se pudo borrar', mensajeError(e, 'Error al borrar el plan')) }
  }

  const activos = planes.filter(p => p.activo !== false)
  const deshabilitados = planes.filter(p => p.activo === false)

  return {
    isAdmin, planes, activos, deshabilitados, cargando, error,
    editando, setEditando, iniciarEdicion, guardarPlan, guardando,
    confirmar, setConfirmar, confirmarAccion, cambiarActivo,
  }
}
