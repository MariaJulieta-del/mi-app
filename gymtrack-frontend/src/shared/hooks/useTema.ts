import { useEffect, useState } from 'react'

const CLAVE = 'gt-dark'
const EVENTO = 'gt-tema'

/** Modo claro/oscuro, recordado en el navegador y sincronizado entre los lugares que lo cambian */
export function useTema(): [boolean, (oscuro: boolean) => void] {
  const [oscuro, setOscuro] = useState(() => {
    // Si la persona ya eligió, se respeta; si no, se sigue la configuración del celular o la compu
    try {
      const guardado = localStorage.getItem(CLAVE)
      if (guardado === '1' || guardado === '0') return guardado === '1'
    } catch { /* sin almacenamiento */ }
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
  }, [oscuro])

  useEffect(() => {
    const h = (e: Event) => setOscuro((e as CustomEvent<boolean>).detail)
    window.addEventListener(EVENTO, h)
    return () => window.removeEventListener(EVENTO, h)
  }, [])

  const cambiar = (valor: boolean) => {
    try { localStorage.setItem(CLAVE, valor ? '1' : '0') } catch { /* sin almacenamiento: no se recuerda */ }
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: valor }))
  }
  return [oscuro, cambiar]
}
