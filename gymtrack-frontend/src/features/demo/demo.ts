import axios from 'axios'
import { API_URL } from '../../shared/services/axiosInstance'
import type { LoginResponse } from '../../shared/types/Auth'

/** Esta compilación es la demo pública (VITE_DEMO=true): se entra sin contraseña con usuarios de prueba */
export const ES_DEMO = import.meta.env.VITE_DEMO === 'true'

export type RolDemo = 'ADMIN' | 'PROFESOR' | 'SOCIO'

/** Cada visitante tiene su copia de los datos de prueba; se recuerda para seguir en la misma al cambiar de rol */
const CLAVE_COPIA = 'gt-demo-copia'

function leerCopia(): string | null {
  try { return localStorage.getItem(CLAVE_COPIA) } catch { return null }
}

function copiaDelToken(token: string): string | null {
  try {
    const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return (JSON.parse(atob(p)) as { demo?: string }).demo ?? null
  } catch { return null }
}

export async function entrarDemo(rol: RolDemo): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>(`${API_URL}/api/v1/auth/demo`, { rol, copia: leerCopia() }, { timeout: 90000 })
  const copia = copiaDelToken(res.data.token)
  try { if (copia) localStorage.setItem(CLAVE_COPIA, copia) } catch { /* sin almacenamiento */ }
  return res.data
}

/** El servidor gratis se duerme: se lo despierta apenas se abre la entrada, mientras el visitante lee las opciones */
export function despertarServidor() {
  fetch(`${API_URL}/api/v1/salud`, { cache: 'no-store' }).then(r => r.text()).catch(() => {})
}

/**
 * En la demo los teléfonos son de prueba: los enlaces a WhatsApp no se abren (no se le escribe a nadie real).
 * Se avisa con un cartelito en la pantalla.
 */
export function bloquearWhatsApp() {
  const avisar = () => {
    const viejo = document.getElementById('gt-demo-aviso')
    viejo?.remove()
    const d = document.createElement('div')
    d.id = 'gt-demo-aviso'
    d.className = 'gt-demo-aviso'
    d.textContent = 'En la demo no se envían mensajes de WhatsApp: en un gimnasio real se abriría el chat con el mensaje ya escrito.'
    document.body.appendChild(d)
    setTimeout(() => d.remove(), 4200)
  }
  document.addEventListener('click', e => {
    const a = (e.target as HTMLElement | null)?.closest?.('a[href*="wa.me"], a[href*="whatsapp"]')
    if (a) { e.preventDefault(); e.stopPropagation(); avisar() }
  }, true)
  const abrir = window.open.bind(window)
  window.open = ((url?: string | URL, ...resto: unknown[]) => {
    if (url && /wa\.me|whatsapp/.test(String(url))) { avisar(); return null }
    return abrir(url, ...(resto as [string?, string?]))
  }) as typeof window.open
}
