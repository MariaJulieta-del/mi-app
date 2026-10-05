/** Ocupación de una disciplina: número + barra. Completa se indica con texto, no solo con color. */
export default function CupoMeter({ total, cupo, compacto = false }: { total: number; cupo: number | null; compacto?: boolean }) {
  if (cupo == null) {
    return (
      <div className="gt-cupo">
        <span className="gt-cupo-num">{total}</span>
        <span className="gt-text-muted gt-text-sm">{total === 1 ? 'inscripto' : 'inscriptos'} · sin límite</span>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((total / cupo) * 100))
  const completa = total >= cupo
  const libres = Math.max(0, cupo - total)
  return (
    <div className="gt-cupo" style={{ minWidth: compacto ? 110 : 160 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'space-between' }}>
        <span><span className="gt-cupo-num">{total}</span><span className="gt-text-muted gt-text-sm"> / {cupo}</span></span>
        <span className="gt-text-sm" style={{ fontWeight: 600, color: completa ? 'var(--red-text)' : 'var(--text-secondary)' }}>
          {completa ? 'Completa' : `${libres} ${libres === 1 ? 'libre' : 'libres'}`}
        </span>
      </div>
      <div className="gt-cupo-barra" role="meter" aria-valuemin={0} aria-valuemax={cupo} aria-valuenow={total}
        aria-label={`${total} de ${cupo} cupos ocupados`}>
        <div style={{ width: `${pct}%`, background: completa ? 'var(--red)' : 'var(--accent)' }} />
      </div>
    </div>
  )
}
