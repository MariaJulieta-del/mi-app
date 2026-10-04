import type { ReactNode } from 'react'
import type { Membresia, EstadoMembresia } from '../types/Membresia'
import { formatFecha } from '../../../shared/utils/fechas'

const ESTADO_UI: Record<EstadoMembresia, { label: string; badge: string; color: string }> = {
  ACTIVA:    { label: 'Activa',    badge: 'gt-badge gt-badge-green', color: 'var(--green-text)' },
  VENCIDA:   { label: 'Vencida',   badge: 'gt-badge gt-badge-red',   color: 'var(--red)' },
  CANCELADA: { label: 'Cancelada', badge: 'gt-badge gt-badge-gray',  color: 'var(--text-muted)' },
}

/**
 * Medidor de pases del mes: un punto por pase (lleno = usado).
 * Para pase libre muestra solo la cantidad de ingresos del ciclo.
 */
export function PasesMeter({ m, compacto = false }: {
  m: Pick<Membresia, 'paseLibre' | 'pasesMensuales' | 'pasesUsados' | 'pasesRestantes' | 'cicloFin'>
  compacto?: boolean
}) {
  if (m.paseLibre || !m.pasesMensuales) {
    return (
      <div className="gt-pases">
        <span className="gt-pases-num" style={{ color: 'var(--accent)' }}>∞</span>
        <span className="gt-text-muted gt-text-sm">
          Pase libre · {m.pasesUsados} {m.pasesUsados === 1 ? 'ingreso' : 'ingresos'} este mes
        </span>
      </div>
    )
  }

  const restantes = m.pasesRestantes ?? 0
  const color = restantes === 0 ? 'var(--red)' : restantes <= 2 ? 'var(--yellow-text)' : 'var(--accent)'
  return (
    <div>
      <div className="gt-pases">
        <span className="gt-pases-num" style={{ color }}>{restantes}</span>
        <span className="gt-text-sm" style={{ color: 'var(--text-secondary)' }}>
          {restantes === 1 ? 'pase disponible' : 'pases disponibles'}
          <span className="gt-text-muted"> de {m.pasesMensuales} este mes</span>
        </span>
      </div>
      {!compacto && (
        <>
          <div className="gt-pases-dots" aria-label={`${m.pasesUsados} de ${m.pasesMensuales} pases usados`}>
            {Array.from({ length: m.pasesMensuales }, (_, i) => (
              <span key={i} className={i < m.pasesUsados ? 'gt-pase-dot usado' : 'gt-pase-dot'}
                title={i < m.pasesUsados ? 'Usado' : 'Disponible'} />
            ))}
          </div>
          <p className="gt-text-muted gt-text-sm" style={{ margin: '6px 0 0' }}>
            Se renuevan el {formatFecha(sumarDia(m.cicloFin))}
          </p>
        </>
      )}
    </div>
  )
}

function sumarDia(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Tarjeta con todo el estado de la membresía de un socio + acciones opcionales */
export default function MembresiaResumen({ m, acciones }: { m: Membresia | null; acciones?: ReactNode }) {
  if (!m) {
    return (
      <div className="gt-card gt-membresia-card" style={{ borderLeftColor: 'var(--border)' }}>
        <p className="gt-card-title" style={{ marginBottom: 4 }}>Sin membresía</p>
        <p className="gt-text-muted gt-text-sm" style={{ margin: '0 0 12px' }}>
          Este socio todavía no pagó ningún plan, por eso no puede ingresar al gimnasio.
        </p>
        {acciones}
      </div>
    )
  }

  const estado = ESTADO_UI[m.estadoMembresia]
  const dias = m.diasRestantes ?? 0
  const vigente = m.estadoMembresia === 'ACTIVA' && dias >= 0
  const venceColor = !vigente ? 'var(--red)' : dias <= 5 ? 'var(--yellow-text)' : 'var(--text-secondary)'

  return (
    <div className="gt-card gt-membresia-card" style={{ borderLeftColor: estado.color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>Membresía</p>
          <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{m.planNombre}</p>
        </div>
        <span className={estado.badge}>{estado.label}</span>
      </div>

      <div className="gt-membresia-grid">
        <div>
          <p className="gt-stat-label">Vencimiento</p>
          <p style={{ margin: 0, fontWeight: 600, color: venceColor }}>{formatFecha(m.fechaVencimiento)}</p>
          <p className="gt-text-sm" style={{ margin: 0, color: venceColor }}>
            {m.estadoMembresia === 'CANCELADA' ? 'Cancelada'
              : dias < 0 ? `Venció hace ${-dias} ${dias === -1 ? 'día' : 'días'}`
              : dias === 0 ? 'Vence hoy'
              : `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}`}
          </p>
        </div>
        {vigente && (
          <div style={{ flex: 2, minWidth: 200 }}>
            <p className="gt-stat-label">Pases del mes</p>
            <PasesMeter m={m} />
          </div>
        )}
      </div>

      {acciones && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>{acciones}</div>}
    </div>
  )
}
