import { useEffect } from 'react'

/**
 * Dirección fija que va impresa en el QR del póster y el tríptico (…/demo).
 * Redirige a la demo pública (VITE_DEMO_URL), así se puede cambiar la demo sin reimprimir nada.
 */
const DEMO_URL = import.meta.env.VITE_DEMO_URL as string | undefined

export default function IrALaDemo() {
  useEffect(() => {
    if (DEMO_URL) window.location.replace(DEMO_URL)
  }, [])
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif', background: '#0d1b17', color: '#f6f1e7' }}>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{DEMO_URL ? 'Abriendo la demo de GymTrack…' : 'La demo de GymTrack todavía no está publicada'}</p>
        {DEMO_URL
          ? <p style={{ marginTop: 12 }}><a href={DEMO_URL} style={{ color: '#f59e0b' }}>Tocá acá si no se abre sola</a></p>
          : <p style={{ marginTop: 12, opacity: .8 }}>Volvé a probar en un rato.</p>}
      </div>
    </div>
  )
}
