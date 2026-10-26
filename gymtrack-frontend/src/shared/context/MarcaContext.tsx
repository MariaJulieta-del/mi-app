import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import axios from 'axios'
import { API_URL } from '../services/axiosInstance'
import { cssDelColor } from '../utils/colores'

/** Marca del gimnasio: nombre, logo y color principal */
export interface Marca { nombre: string; logo: string | null; colorAcento: string | null }

const POR_DEFECTO: Marca = { nombre: 'GymTrack', logo: null, colorAcento: null }
const CLAVE = 'gt-marca'

interface MarcaCtx { marca: Marca; aplicar: (m: Marca) => void }
const Ctx = createContext<MarcaCtx>({ marca: POR_DEFECTO, aplicar: () => {} })

function aplicarEnPagina(m: Marca) {
  let estilo = document.getElementById('gt-marca-css')
  if (!estilo) {
    estilo = document.createElement('style')
    estilo.id = 'gt-marca-css'
    document.head.appendChild(estilo)
  }
  estilo.textContent = m.colorAcento ? cssDelColor(m.colorAcento) : ''
  // Respeta la pantalla que ya figura en la pestaña («Socios · Mi Gimnasio»)
  const pantalla = document.title.includes(' · ') ? document.title.split(' · ')[0] : null
  document.title = pantalla ? `${pantalla} · ${m.nombre}` : m.nombre
  // Ícono de la pestaña: el logo del gimnasio (o el de GymTrack si no cargó uno)
  let icono = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!icono) {
    icono = document.createElement('link')
    icono.rel = 'icon'
    document.head.appendChild(icono)
  }
  icono.href = m.logo || '/favicon.svg'
  icono.type = m.logo ? (m.logo.match(/^data:([^;,]+)/)?.[1] ?? '') : 'image/svg+xml'
}

function leerGuardada(): Marca {
  try { return { ...POR_DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') } } catch { return POR_DEFECTO }
}

/**
 * Carga la marca una vez (pública, sin sesión) y la aplica a toda la app.
 * La última conocida se guarda para que no "parpadee" el color al abrir.
 */
export function MarcaProvider({ children }: { children: ReactNode }) {
  const [marca, setMarca] = useState<Marca>(() => {
    const m = leerGuardada()
    aplicarEnPagina(m)
    return m
  })

  const aplicar = useCallback((m: Marca) => {
    setMarca(m)
    aplicarEnPagina(m)
    try { localStorage.setItem(CLAVE, JSON.stringify(m)) } catch { /* sin almacenamiento */ }
  }, [])

  useEffect(() => {
    axios.get<Marca>(`${API_URL}/api/v1/configuracion/marca`).then(r => aplicar({ ...POR_DEFECTO, ...r.data })).catch(() => {})
  }, [aplicar])

  return <Ctx.Provider value={{ marca, aplicar }}>{children}</Ctx.Provider>
}

export function useMarca() { return useContext(Ctx) }
