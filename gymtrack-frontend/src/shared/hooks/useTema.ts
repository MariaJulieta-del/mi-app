import { useEffect, useState } from 'react'

const CLAVE = 'gt-dark'
const EVENTO = 'gt-tema'

/** Modo claro/oscuro, recordado en el navegador y sincronizado entre los lugares que lo cambian */
export function useTema(): [boolean, (oscuro: boolean) => void] {
  const [oscuro, setOscuro] = useState(() => {
    try { return localStorage.getItem(CLAVE) === '1' } catch { return false }
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
