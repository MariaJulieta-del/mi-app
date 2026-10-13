import { mensajeError } from '../utils/errores'
import { Ban, CircleCheck, TriangleAlert } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBuscarSocios } from '../hooks/useBuscarSocios'
import { registrarCheckin } from '../../features/asistencias/services/asistenciaService'
import type { Socio } from '../../features/socios/types/Socio'

// ── Tipos ────────────────────────────────────────────────────────────────────
interface AccesoResultado {
  socioNombre: string
  estadoAcceso: 'VERDE' | 'AMARILLO' | 'ROJO' | null
  observacion: string | null
  permitido: boolean
}

const ACCESO_CFG = {
  VERDE: {
    bg: '#16A34A', icon: CircleCheck, titulo: 'ACCESO PERMITIDO',
    subtitulo: 'El socio puede ingresar',
  },
  AMARILLO: {
    bg: '#D97706', icon: TriangleAlert, titulo: 'ACCESO PERMITIDO · ATENCIÓN',
    subtitulo: 'Le quedan pocos pases o la membresía vence pronto',
  },
  ROJO: {
    bg: 'var(--red)', icon: Ban, titulo: 'ACCESO DENEGADO',
    subtitulo: 'El socio no puede ingresar',
  },
}

// ── Keyboard shortcut: Ctrl+K (or Cmd+K) ────────────────────────
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [verificando, setVerificando] = useState<number | null>(null)
  const [accesoModal, setAccesoModal] = useState<AccesoResultado | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()


  // Ctrl+K / Cmd+K global listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setQuery(''); setSelected(0)
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
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Auto-cerrar modal de acceso después de 4 segundos
  useEffect(() => {
    if (!accesoModal) return
    const t = setTimeout(() => setAccesoModal(null), 4000)
    return () => clearTimeout(t)
  }, [accesoModal])

  // Búsqueda en el servidor (activos y dados de baja)
  const results = useBuscarSocios(open ? query : '', { tam: 8, vista: 'todos' }).resultados

  const goTo = (socio: Socio) => {
    setOpen(false)
    navigate(`/socios/${socio.id}/perfil`)
  }

  const handleVerificarAcceso = async (e: React.MouseEvent, socio: Socio) => {
    e.stopPropagation()
    setVerificando(socio.id!)
    try {
      const res = await registrarCheckin({ socioId: socio.id, tipo: 'ENTRADA' })
      setOpen(false)
      setQuery('')
      setAccesoModal({
        socioNombre: res.socioNombre ?? `${socio.nombre} ${socio.apellido}`,
        estadoAcceso: res.estadoAcceso ?? (res.permitido ? 'VERDE' : 'ROJO'),
        observacion: res.observacion ?? null,
        permitido: res.permitido,
      })
    } catch (err: unknown) {
      setOpen(false)
      setQuery('')
      const msg = mensajeError(err, 'Socio no encontrado o error de acceso')
      setAccesoModal({
        socioNombre: `${socio.nombre} ${socio.apellido}`,
        estadoAcceso: 'ROJO',
        observacion: msg,
        permitido: false,
      })
    } finally {
      setVerificando(null)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) goTo(results[selected])
  }

  return (
    <>
      {/* ── Modal semáforo de acceso ── */}
      {accesoModal && (() => {
        const estado = accesoModal.estadoAcceso ?? 'ROJO'
        const cfg = ACCESO_CFG[estado] ?? ACCESO_CFG.ROJO
        return (
          <div
            onClick={() => setAccesoModal(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: cfg.bg,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 100, color: 'rgba(255,255,255,0.9)', lineHeight: 1, marginBottom: 16 }}>
              <cfg.icon size={100} aria-hidden />
            </div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: 2, marginBottom: 8 }}>
              {cfg.titulo}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
              {accesoModal.socioNombre}
            </div>
            {accesoModal.observacion && (
              <div style={{
                fontSize: 15, color: 'rgba(255,255,255,0.85)',
                background: 'rgba(0,0,0,0.15)', borderRadius: 10,
                padding: '10px 24px', maxWidth: 500, textAlign: 'center',
                marginBottom: 24,
              }}>
                {accesoModal.observacion}
              </div>
            )}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
              Se cierra automáticamente — o click para cerrar
            </div>
          </div>
        )
      })()}

      {/* ── Palette ── */}
      {open && (
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
            width: '100%', maxWidth: 540,
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
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {results.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                    Sin resultados para "{query}"
                  </div>
                ) : results.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => goTo(s)}
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
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {/* Verificar acceso — acción principal */}
                      <button
                        onClick={e => handleVerificarAcceso(e, s)}
                        disabled={verificando === s.id}
                        style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 6,
                          background: verificando === s.id ? '#D1FAE5' : '#16A34A',
                          border: 'none',
                          color: verificando === s.id ? '#16A34A' : '#fff',
                          cursor: verificando === s.id ? 'wait' : 'pointer',
                          fontWeight: 700,
                        }}>
                        {verificando === s.id ? '...' : 'Verificar acceso'}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); goTo(s) }}
                        style={{
                          fontSize: 11, padding: '4px 8px', borderRadius: 6,
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
              <span style={{ color: 'var(--green-text)', fontWeight: 600 }}>Verificar acceso — registra ingreso al instante</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
