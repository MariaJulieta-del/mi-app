import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarBajas, type BajaSocio } from '../../socios/services/socioService'
import { textoMotivoBaja } from '../../socios/utils/motivosBaja'
import { formatFecha } from '../../../shared/utils/fechas'
import { Cargando } from '../../../shared/components/ui'

const PERIODOS = [
  { dias: 90, texto: '3 meses' },
  { dias: 365, texto: '12 meses' },
  { dias: 0, texto: 'Todo' },
]

/** Por qué se van los socios: motivos de baja más comunes y las últimas bajas */
export default function MotivosBaja() {
  const [bajas, setBajas] = useState<BajaSocio[] | null>(null)
  const [dias, setDias] = useState(365)
  const [ahora] = useState(() => Date.now())

  useEffect(() => { listarBajas().then(setBajas).catch(() => setBajas([])) }, [])

  const enPeriodo = useMemo(
    () => (bajas ?? []).filter(b => dias === 0 || ahora - new Date(b.fecha).getTime() <= dias * 86400000),
    [bajas, dias, ahora],
  )
  const ranking = useMemo(() => {
    const cuenta = new Map<string, number>()
    for (const b of enPeriodo) cuenta.set(b.motivo, (cuenta.get(b.motivo) ?? 0) + 1)
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])
  }, [enPeriodo])

  if (!bajas) return <Cargando tarjeta texto="Cargando bajas…" />
  const max = ranking[0]?.[1] ?? 1
  const volvieron = enPeriodo.filter(b => b.socioActivo).length

  return (
    <div className="gt-card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <p className="gt-card-title" style={{ margin: 0 }}>Por qué se van los socios</p>
          <p className="gt-text-muted gt-text-sm" style={{ margin: '2px 0 0' }}>
            {enPeriodo.length} baja{enPeriodo.length !== 1 ? 's' : ''}
            {volvieron > 0 && ` · ${volvieron} volvieron después`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODOS.map(p => (
            <button key={p.dias} type="button" onClick={() => setDias(p.dias)}
              className={`gt-btn gt-btn-sm ${dias === p.dias ? 'gt-btn-primary' : 'gt-btn-secondary'}`}>{p.texto}</button>
          ))}
        </div>
      </div>

      {ranking.length === 0 ? (
        <p className="gt-text-muted gt-text-sm" style={{ margin: 0 }}>
          No hay bajas registradas en este período. Al dar de baja un socio se pide el motivo y aparece acá.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {ranking.map(([motivo, n]) => (
              <div key={motivo} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 220px) 1fr 70px', gap: 10, alignItems: 'center' }}>
                <span className="gt-text-sm" style={{ color: 'var(--text-secondary)' }}>{textoMotivoBaja(motivo)}</span>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((n / max) * 100)}%`, height: '100%', background: 'var(--accent)' }} />
                </div>
                <span className="gt-text-sm" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  <strong>{n}</strong> · {Math.round((n / enPeriodo.length) * 100)}%
                </span>
              </div>
            ))}
          </div>
          <details>
            <summary className="gt-text-sm" style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}>Ver las últimas bajas</summary>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
              {enPeriodo.slice(0, 30).map(b => (
                <div key={b.id} className="gt-hoy-fila">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {b.socioId != null
                      ? <Link to={`/socios/${b.socioId}/perfil`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>{b.socioNombre}</Link>
                      : <span style={{ fontWeight: 600 }}>{b.socioNombre}</span>}
                    {b.socioActivo && <span className="gt-badge gt-badge-green" style={{ fontSize: 12, marginLeft: 6 }}>Volvió</span>}
                    <div className="gt-text-sm gt-text-muted">
                      {formatFecha(b.fecha)} · {textoMotivoBaja(b.motivo)}{b.detalle ? ` — “${b.detalle}”` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  )
}
