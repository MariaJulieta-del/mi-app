import { DENOMINACIONES, pesos } from '../utils/dinero'

/**
 * Contador de billetes: se carga cuántos hay de cada uno y suma solo.
 * Evita el error de sumar a mano al cerrar la caja.
 */
export default function ArqueoBilletes({ cantidades, onChange }: {
  cantidades: Record<number, string>
  onChange: (c: Record<number, string>) => void
}) {
  return (
    <div className="gt-arqueo">
      {DENOMINACIONES.map(d => {
        const cant = Number(cantidades[d] || 0)
        return (
          <label key={d} className="gt-arqueo-fila">
            <span className="gt-arqueo-billete">{pesos(d)}</span>
            <span className="gt-text-muted" aria-hidden>×</span>
            <input className="gt-input" type="number" inputMode="numeric" min={0} step={1} placeholder="0"
              value={cantidades[d] ?? ''} aria-label={`Cantidad de ${pesos(d)}`}
              onChange={e => onChange({ ...cantidades, [d]: e.target.value.replace(/[^\d]/g, '') })} />
            <span className="gt-arqueo-subtotal">{cant > 0 ? pesos(cant * d) : ''}</span>
          </label>
        )
      })}
    </div>
  )
}

