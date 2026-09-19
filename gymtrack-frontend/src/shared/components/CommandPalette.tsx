import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerTodos } from '../../features/socios/services/socioService'
import type { Socio } from '../../features/socios/types/Socio'

// ── Keyboard shortcut: Ctrl+K (or Cmd+K) ────────────────────────
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [socios, setSocios] = useState<Socio[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Load socios once when palette opens
  useEffect(() => {
    if (!open) return
    obtenerTodos().then(setSocios).catch(() => {})
  }, [open])

  // Ctrl+K / Cmd+K global listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Escape closes
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Focus input when open
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50) }
    else { setQuery(''); setSelected(0) }
  }, [open])

  const results = query.length >= 1
    ? socios.filter(s => {
        const q = query.toLowerCase()
        return (
          s.nombre.toLowerCase().includes(q) ||
          s.apellido.toLowerCase().includes(q) ||
          s.dni.includes(q) ||
          (s.email ?? '').toLowerCase().includes(q)
        )
      }).slice(0, 8)
    : []

  const goTo = (socio: Socio, path: 'perfil' | 'acceso') => {
    setOpen(false)
    if (path === 'perfil') navigate(`/socios/${socio.id}/perfil`)
    else navigate(`/acceso`)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) goTo(results[selected], 'perfil')
  }

  if (!open) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
      }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-md)',
        width: '100%', maxWidth: 500,
        overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={handleKey}
            placeholder="Buscar socio por nombre, apellido o DNI..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent',
              fontSize: 15, color: 'var(--text-primary)',
            }}
          />
          <kbd style={{
            fontSize: 11, color: 'var(--text-muted)',
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '2px 6px',
          }}>Esc</kbd>
        </div>

        {/* Results */}
        {query.length >= 1 && (
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                Sin resultados para "{query}"
              </div>
            ) : results.map((s, i) => (
              <div
                key={s.id}
                onClick={() => goTo(s, 'perfil')}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: i === selected ? 'var(--accent-light)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--border-light)',
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent-light)', border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                  flexShrink: 0,
                }}>
                  {s.nombre[0]}{s.apellido[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                    {s.nombre} {s.apellido}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    DNI {s.dni}{s.email ? ` · ${s.email}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={e => { e.stopPropagation(); goTo(s, 'perfil') }}
                    style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>
                    Ver perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px', borderTop: query.length >= 1 ? '1px solid var(--border)' : 'none',
          display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)',
        }}>
          <span><kbd style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px' }}>↑↓</kbd> navegar</span>
          <span><kbd style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px' }}>Enter</kbd> ver perfil</span>
          <span><kbd style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px' }}>Ctrl+K</kbd> cerrar</span>
        </div>
      </div>
    </div>
  )
}
