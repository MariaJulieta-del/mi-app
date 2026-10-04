import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Membresia } from '../../membresias/types/Membresia'
import type { Rutina } from '../../rutinas/types/Rutina'
import { DIAS_ORDER, ordenarDias } from '../../rutinas/utils/rutinaUtils'

/** Nombre del día de hoy como se guarda en las rutinas ("Lunes", "Martes"…) */
function diaDeHoy(): string {
  // getDay(): 0 = domingo
  return DIAS_ORDER[(new Date().getDay() + 6) % 7]
}

/**
 * Arriba del perfil del socio: qué le toca entrenar hoy y avisos importantes
 * (membresía por vencer, pocos pases, rutina nueva).
 */
export default function SocioInicio({ membresia, rutinas }: { membresia: Membresia | null; rutinas: Rutina[] }) {
  const [hoy] = useState(diaDeHoy)
  const [ahora] = useState(() => Date.now())

  // Rutina de hoy: la más nueva que tenga el día de hoy marcado
  const deHoy = [...rutinas]
    .sort((a, b) => (b.fechaCreacion ?? '').localeCompare(a.fechaCreacion ?? ''))
    .map(r => ({ r, n: ordenarDias(r.diasSemana).indexOf(hoy) + 1 }))
    .find(x => x.n > 0)

  const avisos: { icono: string; texto: string; tono: 'warn' | 'info' | 'error' }[] = []
  if (membresia) {
    const dias = membresia.diasRestantes ?? 0
    if (membresia.estadoMembresia !== 'ACTIVA' || dias < 0) {
      avisos.push({ icono: '⛔', tono: 'error', texto: 'Tu membresía no está vigente. Renovala en recepción para poder ingresar.' })
    } else {
      if (dias <= 7) avisos.push({ icono: '⏳', tono: 'warn', texto: dias === 0 ? 'Tu membresía vence hoy.' : `Tu membresía vence en ${dias} ${dias === 1 ? 'día' : 'días'}.` })
      if (!membresia.paseLibre && membresia.pasesRestantes != null && membresia.pasesRestantes <= 2) {
        avisos.push({ icono: '🎟️', tono: membresia.pasesRestantes === 0 ? 'error' : 'warn',
          texto: membresia.pasesRestantes === 0 ? 'Usaste todos los pases de este mes.' : `Te quedan ${membresia.pasesRestantes} ${membresia.pasesRestantes === 1 ? 'pase' : 'pases'} este mes.` })
      }
    }
  } else {
    avisos.push({ icono: '⛔', tono: 'error', texto: 'Todavía no tenés una membresía. Consultá en recepción.' })
  }
  const nueva = [...rutinas]
    .sort((a, b) => (b.fechaCreacion ?? '').localeCompare(a.fechaCreacion ?? ''))
    .find(r => r.fechaCreacion && ahora - new Date(r.fechaCreacion).getTime() < 7 * 86400000)
  if (nueva) avisos.push({ icono: '✨', tono: 'info', texto: `Tu profe te armó una rutina nueva: ${nueva.nombre}.` })

  const clase = { warn: 'gt-alert-warning', info: 'gt-alert-info', error: 'gt-alert-error' }

  return (
    <>
      {avisos.map(a => (
        <div key={a.texto} className={`gt-alert ${clase[a.tono]}`} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span aria-hidden>{a.icono}</span><span>{a.texto}</span>
        </div>
      ))}

      {deHoy ? (
        <Link to={`/rutinas/${deHoy.r.id}/entrenar?dia=${deHoy.n}`} className="gt-ingreso-cta gt-entrenar-cta">
          <span className="gt-ingreso-cta-icono">🏋️</span>
          <span style={{ flex: 1 }}>
            <strong>Entrenar hoy · {hoy}</strong>
            <span className="gt-ingreso-cta-sub">{deHoy.r.nombre} — Día {deHoy.n}</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
      ) : rutinas.length > 0 ? (
        <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 12px' }}>
          Hoy ({hoy}) no tenés entrenamiento programado. Podés abrir cualquier rutina y tocar “Entrenar”.
        </p>
      ) : null}
    </>
  )
}
