import { useState } from 'react'
import Modal from '../../../shared/components/Modal'

const BARRAS = [
  { kg: 20, texto: 'Barra olímpica (20 kg)' },
  { kg: 15, texto: 'Barra 15 kg' },
  { kg: 10, texto: 'Barra corta / Z (10 kg)' },
  { kg: 0, texto: 'Sin barra (máquina)' },
]
const DISCOS = [25, 20, 15, 10, 5, 2.5, 1.25]
const COLOR: Record<number, string> = { 25: '#DC2626', 20: '#2563EB', 15: '#EAB308', 10: '#16A34A', 5: '#F5F5F5', 2.5: '#6B7280', 1.25: '#9CA3AF' }

/** Qué discos poner de cada lado para llegar al peso (de mayor a menor) */
function discosPorLado(total: number, barra: number): { discos: number[]; sobra: number } {
  let resto = Math.max(0, (total - barra) / 2)
  const discos: number[] = []
  for (const d of DISCOS) {
    while (resto >= d - 1e-9) { discos.push(d); resto = Math.round((resto - d) * 100) / 100 }
  }
  return { discos, sobra: Math.round(resto * 2 * 100) / 100 }
}

/** Calculadora de discos: cuánto poner de cada lado de la barra */
export default function CalculadoraDiscos({ kgInicial, onCerrar }: { kgInicial: number; onCerrar: () => void }) {
  const [kg, setKg] = useState(String(kgInicial || ''))
  const [barra, setBarra] = useState(20)
  const total = Number(kg.replace(',', '.')) || 0
  const { discos, sobra } = discosPorLado(total, barra)

  return (
    <Modal titulo="Calculadora de discos" onCerrar={onCerrar} ancho={420}
      pie={<button type="button" className="gt-btn gt-btn-primary" onClick={onCerrar}>Listo</button>}>
      <div className="gt-maq-form-fila dos">
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="disc-kg">Peso total</label>
          <input id="disc-kg" className="gt-input" inputMode="decimal" value={kg} onChange={e => setKg(e.target.value)} style={{ fontSize: 20, fontWeight: 700 }} />
        </div>
        <div className="gt-form-group">
          <label className="gt-label" htmlFor="disc-barra">Barra</label>
          <select id="disc-barra" className="gt-select" value={barra} onChange={e => setBarra(Number(e.target.value))}>
            {BARRAS.map(b => <option key={b.kg} value={b.kg}>{b.texto}</option>)}
          </select>
        </div>
      </div>
      {total > 0 && total < barra ? (
        <p className="gt-text-muted">El peso es menor que la barra.</p>
      ) : (
        <>
          <p className="gt-subtitulo">De cada lado</p>
          {discos.length === 0 ? <p className="gt-text-muted" style={{ margin: 0 }}>Solo la barra.</p> : (
            <div className="gt-discos" aria-label={`De cada lado: ${discos.map(d => `${d} kg`).join(', ')}`}>
              <span className="gt-discos-barra" aria-hidden />
              {discos.map((d, i) => (
                <span key={i} className="gt-disco" style={{ background: COLOR[d], height: 40 + d * 3, color: d === 5 ? '#111' : '#fff' }}>{String(d).replace('.', ',')}</span>
              ))}
            </div>
          )}
          {discos.length > 0 && <p className="gt-text-sm" style={{ margin: '10px 0 0' }}>{discos.map(d => String(d).replace('.', ',')).join(' + ')} kg por lado</p>}
          {sobra > 0 && <p className="gt-text-sm gt-text-muted" style={{ margin: '4px 0 0' }}>Con discos comunes no se llega justo: faltan {String(sobra).replace('.', ',')} kg.</p>}
        </>
      )}
    </Modal>
  )
}
