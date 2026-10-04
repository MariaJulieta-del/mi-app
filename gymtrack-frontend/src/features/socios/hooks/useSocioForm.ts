import { useState, useEffect } from 'react'
import type { Socio } from '../types/Socio'
import type { Tarifa } from '../../membresias/types/Tarifa'
import { listarTarifas } from '../../membresias/services/tarifaService'

type FormaDePago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'

export interface AltaForm {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  tipoMembresia: string
  formaDePago: FormaDePago | ''
}

/** AltaForm ya validado: con forma de pago elegida */
export type AltaFormValida = Omit<AltaForm, 'formaDePago'> & { formaDePago: FormaDePago }

export const FORMAS: { value: FormaDePago; label: string; color: string; bg: string }[] = [
  { value: 'EFECTIVO',      label: '💵 Efectivo',           color: 'var(--green-text)',   bg: 'var(--green-bg)' },
  { value: 'TARJETA',       label: '💳 Tarjeta',            color: 'var(--blue-text)',    bg: 'var(--blue-bg)' },
  { value: 'TRANSFERENCIA', label: '🔄 Transferencia',      color: 'var(--purple-text)',  bg: 'var(--purple-bg)' },
]

interface Props {
  onGuardar: (socio: Socio) => void
  onAltaCompleta?: (data: AltaFormValida) => void
  socioEditar?: Socio | null
  onCancelar: () => void
}

export function useSocioForm({ onGuardar, onAltaCompleta, socioEditar, onCancelar }: Props) {
  const esEdicion = !!socioEditar?.id

  const [form, setForm] = useState<Socio>({
    nombre: '', apellido: '', dni: '', email: '', telefono: '', estado: 'ACTIVO'
  })
  const [altaForm, setAltaForm] = useState<AltaForm>({
    nombre: '', apellido: '', dni: '', telefono: '', email: '', tipoMembresia: '', formaDePago: '',
  })
  const [tarifas, setTarifas] = useState<Tarifa[]>([])
  const [loadingTarifas, setLoadingTarifas] = useState(true)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Al cambiar el socio a editar (o volver al alta), se reinicia el formulario
  const [editarPrevio, setEditarPrevio] = useState<typeof socioEditar | undefined>(undefined)
  if (socioEditar !== editarPrevio) {
    setEditarPrevio(socioEditar)
    if (socioEditar) {
      setForm(socioEditar)
    } else {
      setForm({ nombre: '', apellido: '', dni: '', email: '', telefono: '', estado: 'ACTIVO' })
      setAltaForm({ nombre: '', apellido: '', dni: '', telefono: '', email: '', tipoMembresia: '', formaDePago: '' })
      setTouched({})
    }
  }

  // Planes para el alta
  useEffect(() => {
    if (socioEditar) return
    listarTarifas()
      .then(data => setTarifas(data.filter(t => t.duracionDias > 0)))
      .catch(() => {})
      .finally(() => setLoadingTarifas(false))
  }, [socioEditar])

  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }))

  // Validaciones
  const errores: Record<string, string> = {}
  const datos = esEdicion ? form : altaForm

  if (touched.nombre   && !datos.nombre?.trim())   errores.nombre   = 'El nombre es obligatorio'
  if (touched.apellido && !datos.apellido?.trim())  errores.apellido = 'El apellido es obligatorio'
  if (touched.dni      && !datos.dni?.trim())       errores.dni      = 'El DNI es obligatorio'
  if (touched.email    && datos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email))
    errores.email = 'Email inválido'
  if (touched.telefono && datos.telefono && !/^[\d\s+\-()]+$/.test(datos.telefono))
    errores.telefono = 'Solo se permiten números y caracteres telefónicos'

  if (!esEdicion) {
    if (touched.tipoMembresia && !altaForm.tipoMembresia) errores.tipoMembresia = 'Seleccioná un plan'
    if (touched.formaDePago   && !altaForm.formaDePago)   errores.formaDePago   = 'Elegí una forma de pago'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const allFields = esEdicion
      ? ['nombre', 'apellido', 'dni', 'email', 'telefono']
      : ['nombre', 'apellido', 'dni', 'email', 'telefono', 'tipoMembresia', 'formaDePago']
    setTouched(Object.fromEntries(allFields.map(f => [f, true])))

    if (Object.keys(errores).length > 0) return

    if (esEdicion) {
      if (!form.nombre.trim() || !form.apellido.trim() || !form.dni.trim()) return
      onGuardar(form)
    } else {
      if (!altaForm.nombre.trim() || !altaForm.apellido.trim() || !altaForm.dni.trim()) return
      if (!altaForm.tipoMembresia || !altaForm.formaDePago) return
      onAltaCompleta?.({ ...altaForm, formaDePago: altaForm.formaDePago })
    }
  }

  const inputClass = (field: string) => `gt-input${errores[field] ? ' gt-input-error' : ''}`
  const tarifaSeleccionada = tarifas.find(t => t.tipo === altaForm.tipoMembresia)

  return {
    esEdicion,
    form, setForm,
    altaForm, setAltaForm,
    tarifas, loadingTarifas,
    touched, touch,
    errores, inputClass,
    tarifaSeleccionada,
    handleSubmit,
    onCancelar,
  }
}
