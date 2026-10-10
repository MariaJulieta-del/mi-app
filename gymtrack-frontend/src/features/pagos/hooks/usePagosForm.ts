import { useAuth } from '../../../shared/context/AuthContext'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Socio } from '../../socios/types/Socio'
import type { Tarifa } from '../../membresias/types/Tarifa'
import type { Membresia } from '../../membresias/types/Membresia'
import type { MetodoPago } from '../types/Pago'
import { registrarConMembresia } from '../services/pagoService'
import { obtenerPorId } from '../../socios/services/socioService'
import { useBuscarSocios } from '../../../shared/hooks/useBuscarSocios'
import { listarTarifas } from '../../membresias/services/tarifaService'
import { obtenerPorSocio } from '../../membresias/services/membresiaService'
import { useToast } from '../../../shared/hooks/useToast'
import { fechaLocalISO } from '../../../shared/utils/fechas'

export const METODOS: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO',      label: '💵 Efectivo' },
  { value: 'TARJETA',       label: '💳 Tarjeta' },
  { value: 'TRANSFERENCIA', label: '🔄 Transferencia' },
]

/** Identificador único de un intento de cobro */
const nuevaClave = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

function sumarDias(iso: string, dias: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  return fechaLocalISO(d)
}

/**
 * Cobrar un plan = crear o renovar la (única) membresía del socio.
 * Acepta ?socioId=… para llegar desde el perfil con el socio ya elegido.
 */
export function usePagosForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const socioIdParam = searchParams.get('socioId')

  const [socioSel, setSocioSel] = useState<Socio | null>(null)
  const [membresiaActual, setMembresiaActual] = useState<Membresia | null>(null)
  const [cargandoMembresia, setCargandoMembresia] = useState(false)
  const [planElegido, setPlanSel] = useState<Tarifa | null>(null)
  const [metodo, setMetodo] = useState<MetodoPago | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  /** Con cuánto paga (solo efectivo), para calcular el vuelto */
  const [pagaCon, setPagaCon] = useState('')
  /** Cobro recién hecho: se muestra la pantalla de listo */
  const [hecho, setHecho] = useState<{ nombre: string; socioId: number; plan: string; monto: number; metodo: string; hasta: string | null; vuelto: number | null } | null>(null)

  const [planes, setPlanes] = useState<Tarifa[]>([])
  const [busqueda, setBusqueda] = useState('')
  // Si no eligió plan, se sugiere el mismo que tiene ahora (renovación)
  const planSel = planElegido ?? (membresiaActual ? planes.find(p => p.tipo === membresiaActual.tipoMembresia) ?? null : null)

  useEffect(() => {
    listarTarifas().then(t => setPlanes(t.filter(p => p.activo !== false))).catch(() => {})
    if (socioIdParam) {
      obtenerPorId(Number(socioIdParam)).then(seleccionarSocio).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Búsqueda en el servidor (no se baja la lista entera de socios)
  const sociosFiltrados = useBuscarSocios(busqueda, { tam: 6 }).resultados

  function seleccionarSocio(s: Socio) {
    setSocioSel(s); setBusqueda(''); setPlanSel(null); setError(null)
    setMembresiaActual(null)
    if (!s.id) return
    setCargandoMembresia(true)
    obtenerPorSocio(s.id)
      .then(setMembresiaActual)
      .catch(() => setMembresiaActual(null))
      .finally(() => setCargandoMembresia(false))
  }

  const cambiarSocio = () => { setSocioSel(null); setMembresiaActual(null); setPlanSel(null) }

  /** Dejar el formulario listo para el próximo cobro */
  /** Clave de este intento de cobro: se renueva solo al empezar uno nuevo */
  const claveCobro = useRef(nuevaClave())
  /** Freno inmediato del doble clic (el estado tarda un render en deshabilitar el botón) */
  const enviando = useRef(false)
  // Si cambia el socio, el plan o el medio, es otro cobro: otra clave
  useEffect(() => { claveCobro.current = nuevaClave() }, [socioSel?.id, planSel?.tipo, metodo])

  const nuevoCobro = () => {
    claveCobro.current = nuevaClave()
    cambiarSocio(); setMetodo(null); setObservaciones(''); setPagaCon(''); setError(null); setHecho(null)
  }

  /** Qué va a pasar con la membresía al cobrar (misma regla que el backend) */
  const preview = useMemo(() => {
    if (!planSel) return null
    const hoy = fechaLocalISO()
    const vigente = membresiaActual?.estadoMembresia === 'ACTIVA' && membresiaActual.fechaVencimiento >= hoy
    return vigente
      ? { esRenovacion: true, extiende: true, desde: membresiaActual!.fechaVencimiento, hasta: sumarDias(membresiaActual!.fechaVencimiento, planSel.duracionDias) }
      : { esRenovacion: !!membresiaActual, extiende: false, desde: hoy, hasta: sumarDias(hoy, planSel.duracionDias) }
  }, [planSel, membresiaActual])

  const paso = !socioSel ? 1 : !planSel ? 2 : !metodo ? 3 : 4
  const listo = !!(socioSel && planSel && metodo)

  const vuelto = metodo === 'EFECTIVO' && planSel && pagaCon !== '' ? Number(pagaCon) - planSel.precio : null

  const handleConfirmar = async () => {
    if (!listo) return
    if (vuelto != null && vuelto < 0) { setError('Lo que entrega es menos que el precio del plan'); return }
    if (enviando.current) return
    enviando.current = true
    setGuardando(true)
    try {
      await registrarConMembresia({
        socioId: socioSel!.id!,
        planTipo: planSel!.tipo,
        metodoPago: metodo!,
        observaciones: observaciones || undefined,
      }, claveCobro.current)
      toast.success(preview?.esRenovacion ? 'Membresía renovada' : 'Plan cobrado',
        `${socioSel!.nombre} ${socioSel!.apellido} — ${planSel!.nombre}`)
      setHecho({
        nombre: `${socioSel!.nombre} ${socioSel!.apellido}`, socioId: socioSel!.id!, plan: planSel!.nombre,
        monto: planSel!.precio, metodo: metodo!, hasta: preview?.hasta ?? null, vuelto,
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Error al registrar el pago')
      toast.error('Error al registrar', msg ?? 'Verificá los datos e intentá nuevamente')
    } finally { setGuardando(false); enviando.current = false }
  }

  return {
    navigate, socioSel, seleccionarSocio, cambiarSocio,
    membresiaActual, cargandoMembresia,
    planes, planSel, setPlanSel, metodo, setMetodo,
    observaciones, setObservaciones, error, setError, guardando,
    handleConfirmar, pagaCon, setPagaCon, vuelto, hecho, nuevoCobro, esAdmin: user?.rol === 'ADMIN',
    busqueda, setBusqueda, sociosFiltrados,
    preview, paso, listo,
    volverA: socioIdParam ? `/socios/${socioIdParam}/perfil` : user?.rol === 'ADMIN' ? '/pagos' : '/membresias',
  }
}
