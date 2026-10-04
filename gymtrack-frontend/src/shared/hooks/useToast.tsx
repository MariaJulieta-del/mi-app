import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...toast, id }])
    const duration = toast.duration ?? 4000
    if (duration > 0) setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const success = useCallback((title: string, message?: string) =>
    showToast({ type: 'success', title, message }), [showToast])
  const error = useCallback((title: string, message?: string) =>
    showToast({ type: 'error', title, message }), [showToast])
  const warning = useCallback((title: string, message?: string) =>
    showToast({ type: 'warning', title, message }), [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '!',
  info:    'i',
}

const ICON_COLORS: Record<ToastType, string> = {
  success: '#16A34A',
  error:   '#DC2626',
  warning: '#D97706',
  info:    '#2563EB',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [leaving, setLeaving] = useState(false)

  const handleClose = () => {
    setLeaving(true)
    setTimeout(onRemove, 220)
  }

  return (
    <div
      className={`gt-toast ${toast.type}`}
      style={{ animation: leaving ? 'gt-slide-out-right 0.22s ease forwards' : undefined }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: ICON_COLORS[toast.type] + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 13,
        color: ICON_COLORS[toast.type],
      }}>
        {ICONS[toast.type]}
      </div>
      <div className="gt-toast-content">
        <p className="gt-toast-title">{toast.title}</p>
        {toast.message && <p className="gt-toast-msg">{toast.message}</p>}
      </div>
      <button className="gt-toast-close" onClick={handleClose} title="Cerrar">×</button>
    </div>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="gt-toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
      ))}
    </div>
  )
}
