import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../shared/context/AuthContext'
import { obtenerPorId } from '../socios/services/socioService'
import { obtenerPorSocio } from '../membresias/services/membresiaService'
import { obtenerRutinas } from '../rutinas/services/rutinaService'
import type { Socio } from '../socios/types/Socio'
import type { Membresia } from '../membresias/types/Membresia'
import type { Rutina } from '../rutinas/types/Rutina'

interface SocioApp {
  socioId: number
  socio: Socio | null
  membresia: Membresia | null
  /** Rutinas del socio, la más nueva primero */
  rutinas: Rutina[]
  cargando: boolean
  recargar: () => Promise<void>
}

const Ctx = createContext<SocioApp | null>(null)

/** Datos del socio que usan todas las pestañas de su app (se cargan una vez) */
export function SocioAppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const socioId = user?.socioId ?? 0
  const [socio, setSocio] = useState<Socio | null>(null)
  const [membresia, setMembresia] = useState<Membresia | null>(null)
  const [rutinas, setRutinas] = useState<Rutina[]>([])
  const [cargando, setCargando] = useState(true)

  const cargarDatos = useCallback(() => {
    if (!socioId) return Promise.resolve(null)
    return Promise.all([
      obtenerPorId(socioId).catch(() => null),
      obtenerPorSocio(socioId).catch(() => null),
      obtenerRutinas(socioId).catch(() => [] as Rutina[]),
    ])
  }, [socioId])

  const aplicar = (datos: [Socio | null, Membresia | null, Rutina[]] | null) => {
    if (!datos) return
    const [s, m, r] = datos
    setSocio(s)
    setMembresia(m)
    setRutinas([...r].sort((a, b) => (b.fechaCreacion ?? '').localeCompare(a.fechaCreacion ?? '')))
    setCargando(false)
  }

  const recargar = useCallback(async () => { aplicar(await cargarDatos()) }, [cargarDatos])

  useEffect(() => { cargarDatos().then(aplicar) }, [cargarDatos])

  return <Ctx.Provider value={{ socioId, socio, membresia, rutinas, cargando, recargar }}>{children}</Ctx.Provider>
}

export function useSocioApp(): SocioApp {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSocioApp va dentro de <SocioAppProvider>')
  return c
}
