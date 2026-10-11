import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from '../hooks/useToast'
import { cantidadPedidos } from '../../features/rutinas/services/pedidosService'

interface Pedidos { abiertos: number; recargar: () => void }

const Ctx = createContext<Pedidos>({ abiertos: 0, recargar: () => {} })
const CADA_MS = 60_000

/**
 * Pedidos de rutina abiertos, para el staff: el contador del menú y el aviso cuando entra uno nuevo.
 * Se revisa cada minuto (y al volver a la pestaña).
 */
export function PedidosRutinaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  // El aviso no tiene que reiniciar la consulta periódica
  const avisar = useRef(showToast)
  useEffect(() => { avisar.current = showToast }, [showToast])
  const esStaff = user?.rol === 'ADMIN' || user?.rol === 'PROFESOR'
  const [abiertos, setAbiertos] = useState(0)
  const anterior = useRef<number | null>(null)

  const recargar = useCallback(() => {
    if (!esStaff) return
    cantidadPedidos()
      .then(n => {
        if (anterior.current != null && n > anterior.current) {
          avisar.current({ type: 'info', title: 'Nuevo pedido de rutina', message: 'Un socio pidió una rutina personalizada. Está en Rutinas › Pedidos.', duration: 8000 })
        }
        anterior.current = n
        setAbiertos(n)
      })
      .catch(() => {})
  }, [esStaff])

  useEffect(() => {
    if (!esStaff) return
    recargar()
    const id = setInterval(recargar, CADA_MS)
    const alVolver = () => { if (document.visibilityState === 'visible') recargar() }
    document.addEventListener('visibilitychange', alVolver)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', alVolver) }
  }, [esStaff, recargar])

  return <Ctx.Provider value={{ abiertos: esStaff ? abiertos : 0, recargar }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- el hook va junto a su contexto
export const usePedidosRutina = () => useContext(Ctx)
