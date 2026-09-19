import { useEffect } from 'react'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="gt-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="gt-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: danger ? '#FEE2E2' : '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={danger ? '#DC2626' : '#2563EB'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {danger
                ? <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              }
            </svg>
          </div>
          <h2 id="modal-title" className="gt-modal-title">{title}</h2>
        </div>

        <p className="gt-modal-body">{message}</p>

        <div className="gt-modal-actions">
          <button className="gt-btn gt-btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={`gt-btn ${danger ? 'gt-btn-danger' : 'gt-btn-primary'}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
