import { Component, type ErrorInfo, type ReactNode } from 'react'

const CLAVE_RECARGA = 'gt-recarga-por-version'

/** Falla al bajar una pantalla: casi siempre es porque se publicó una versión nueva */
function esVersionNueva(error: unknown): boolean {
  const m = String((error as Error)?.message ?? error)
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically imported|ChunkLoadError/i.test(m)
}

/**
 * Si una pantalla falla al dibujarse, muestra un aviso con opciones en lugar de dejar
 * la app en blanco. Si la falla es por una versión nueva publicada, recarga sola una vez.
 * `reinicio` (por ejemplo, la ruta actual) vuelve a intentar al navegar a otra pantalla.
 */
export default class LimiteErrores extends Component<{ children: ReactNode; reinicio?: string; completa?: boolean }, { error: unknown; reinicio?: string }> {
  state: { error: unknown; reinicio?: string } = { error: null, reinicio: this.props.reinicio }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  static getDerivedStateFromProps(props: { reinicio?: string }, state: { error: unknown; reinicio?: string }) {
    // Al cambiar de pantalla se vuelve a intentar
    if (props.reinicio !== state.reinicio) return { error: null, reinicio: props.reinicio }
    return null
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (esVersionNueva(error)) {
      let ya = false
      try { ya = sessionStorage.getItem(CLAVE_RECARGA) === '1'; sessionStorage.setItem(CLAVE_RECARGA, '1') } catch { /* sin almacenamiento */ }
      if (!ya) { window.location.reload(); return }
    }
    // Queda en la consola del navegador para poder diagnosticarlo
    console.error('Error en pantalla', error, info.componentStack)
  }

  componentDidMount() {
    // La app cargó bien: se permite otra recarga automática en el futuro
    try { sessionStorage.removeItem(CLAVE_RECARGA) } catch { /* sin almacenamiento */ }
  }

  render() {
    if (!this.state.error) return this.props.children
    const nueva = esVersionNueva(this.state.error)
    return (
      <div className={`gt-card gt-error-pantalla${this.props.completa ? ' completa' : ''}`} role="alert">
        <strong>{nueva ? 'Hay una versión nueva de la app' : 'Algo falló al mostrar esta pantalla'}</strong>
        <p>{nueva ? 'Recargá para seguir con la última versión.' : 'Los datos no se perdieron. Probá recargar; si vuelve a pasar, avisá qué estabas haciendo.'}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" className="gt-btn gt-btn-primary" onClick={() => window.location.reload()}>Recargar</button>
          <a className="gt-btn gt-btn-secondary" href="/">Ir al inicio</a>
        </div>
      </div>
    )
  }
}
