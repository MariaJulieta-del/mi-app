import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { bandejaPedidos, type PedidoRutina } from '../../rutinas/services/pedidosService'
import { DetallePedido } from '../../rutinas/components/PedidosRutina'
import { usePedidosRutina } from '../../../shared/context/PedidosRutinaContext'

/** En "Hoy": los pedidos de rutina personalizada que todavía nadie resolvió */
export default function PedidosHoy() {
  const { abiertos } = usePedidosRutina()
  const [pedidos, setPedidos] = useState<PedidoRutina[]>([])

  // Se vuelve a pedir cuando cambia la cantidad (entró uno nuevo o se resolvió alguno)
  useEffect(() => { bandejaPedidos().then(b => setPedidos(b.abiertos)).catch(() => {}) }, [abiertos])

  if (pedidos.length === 0) return null
  return (
    <section className="gt-card gt-pedidos-hoy" aria-labelledby="pedidos-hoy">
      <div className="gt-card-cabecera">
        <h2 id="pedidos-hoy" className="gt-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Inbox size={16} aria-hidden /> Pedidos de rutina <span className="gt-cuenta">{pedidos.length}</span>
        </h2>
        <Link to="/rutinas?tab=pedidos" className="gt-btn gt-btn-secondary gt-btn-sm">Ver todos</Link>
      </div>
      {pedidos.slice(0, 3).map(p => (
        <Link key={p.id} to="/rutinas?tab=pedidos" className="gt-reporte-fila">
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong>{p.socio}</strong>
            <small><DetallePedido p={p} />{p.mensaje ? ` · “${p.mensaje.length > 70 ? p.mensaje.slice(0, 70) + '…' : p.mensaje}”` : ''}</small>
          </span>
          <span className="gt-text-sm gt-text-muted">{p.estado === 'EN_CURSO' ? `Lo arma ${p.tomadaPor}` : 'Sin tomar'}</span>
        </Link>
      ))}
    </section>
  )
}
