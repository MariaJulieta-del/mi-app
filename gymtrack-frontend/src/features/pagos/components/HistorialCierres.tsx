import { useEffect, useState } from 'react'
import { Download, History } from 'lucide-react'
import { historialCierres } from '../services/cierreCajaService'
import type { CierreCajaResumen } from '../types/CierreCaja'
import { pesos, textoDiferencia } from '../utils/dinero'
import { EmptyState, Pill, Resumen, SkeletonTarjetas } from '../../../shared/components/ui'
import { descargarCSV } from '../../../shared/utils/csv'
import { formatFecha } from '../../../shared/utils/fechas'

/** Cierres anteriores: qué entró, si cuadró y cuánto se retiró cada día */
export default function HistorialCierres({ onAbrir }: { onAbrir: (fecha: string) => void }) {
  const [cierres, setCierres] = useState<CierreCajaResumen[] | null>(null)
  useEffect(() => { historialCierres().then(setCierres).catch(() => setCierres([])) }, [])

  if (!cierres) return <SkeletonTarjetas cantidad={3} alto={56} />
  if (cierres.length === 0) return <div className="gt-card"><EmptyState icono={History} titulo="Todavía no se cerró ninguna caja" texto="Al cerrar la caja del día, queda guardada acá." /></div>

  const ultimos30 = cierres.slice(0, 30)
  const contados = ultimos30.filter(c => c.diferencia != null)
  const conDiferencia = contados.filter(c => Math.abs(Number(c.diferencia)) >= 0.5).length
  const faltante = contados.reduce((s, c) => s + Math.min(0, Number(c.diferencia)), 0)

  const exportar = () => descargarCSV('cierres-de-caja',
    ['Fecha', 'Cambio inicial', 'Efectivo', 'Tarjeta', 'Transferencia', 'Gastos', 'Debía haber', 'Contado', 'Diferencia', 'Quedó', 'Retiro', 'Cerró', 'Nota'],
    cierres.map(c => [c.fecha, Number(c.fondoInicial), Number(c.totalEfectivo), Number(c.totalTarjeta), Number(c.totalTransferencia), Number(c.totalEgresos),
      Number(c.balanceCalculado), c.montoContado, c.diferencia, c.dejaEnCaja, c.retiro, c.creadoPor, c.observaciones]))

  return (
    <>
      <Resumen items={[
        { valor: ultimos30.length, texto: 'cierres (últimos 30)' },
        { valor: `${contados.length - conDiferencia} de ${contados.length}`, texto: 'cuadraron', tono: conDiferencia === 0 ? 'ok' : undefined },
        { valor: pesos(-faltante), texto: 'faltantes acumulados', tono: faltante < 0 ? 'danger' : undefined },
      ]} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button type="button" className="gt-btn gt-btn-secondary" onClick={exportar}><Download size={16} aria-hidden /> Exportar</button>
      </div>
      <div tabIndex={0} role="region" aria-label="Cierres de caja" className="gt-table-wrap gt-card" style={{ padding: 0 }}>
        <table className="gt-table gt-tabla-tarjetas">
          <thead><tr><th>Día</th><th style={{ textAlign: 'right' }}>Cobrado</th><th style={{ textAlign: 'right' }}>Gastos</th><th style={{ textAlign: 'right' }}>Debía haber</th><th>Resultado</th><th style={{ textAlign: 'right' }}>Retiro</th><th>Cerró</th></tr></thead>
          <tbody>
            {cierres.map(c => {
              const dif = textoDiferencia(c.diferencia)
              return (
                <tr key={c.id} className="gt-fila-clic" tabIndex={0} aria-label={`Abrir la caja del ${formatFecha(c.fecha)}`}
                  onClick={() => onAbrir(c.fecha)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir(c.fecha) } }}>
                  <td className="gt-td-titulo gt-fw-600" style={{ whiteSpace: 'nowrap' }}>{formatFecha(c.fecha)}</td>
                  <td data-label="Cobrado" style={{ textAlign: 'right' }}>{pesos(c.totalIngresos)}</td>
                  <td data-label="Gastos" style={{ textAlign: 'right' }}>{Number(c.totalEgresos) > 0 ? pesos(c.totalEgresos) : '—'}</td>
                  <td data-label="Debía haber" style={{ textAlign: 'right' }}>{pesos(c.balanceCalculado)}</td>
                  <td data-label="Resultado"><Pill tono={dif.tono}>{dif.texto}</Pill></td>
                  <td data-label="Retiro" style={{ textAlign: 'right' }}>{pesos(c.retiro ?? null)}</td>
                  <td data-label="Cerró" className="gt-text-muted">{c.creadoPor ?? '—'}{c.observaciones && <div className="gt-text-sm">“{c.observaciones}”</div>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
