import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { History, ListOrdered, Plus, Vault } from 'lucide-react'
import { PageHeader, Segmentado } from '../../../shared/components/ui'
import MovimientosCaja from './MovimientosCaja'
import CajaDelDia from './CajaDelDia'
import HistorialCierres from './HistorialCierres'

type Tab = 'caja' | 'cobros' | 'historial'
const TABS: { valor: Tab; texto: string; icono: typeof Vault }[] = [
  { valor: 'caja', texto: 'Caja del día', icono: Vault },
  { valor: 'cobros', texto: 'Cobros', icono: ListOrdered },
  { valor: 'historial', texto: 'Cierres', icono: History },
]

/**
 * Pagos y caja (solo admin). Arranca en la caja del día, que es lo que se usa a diario;
 * desde ahí se salta a los cobros de ese día o a un cierre anterior.
 */
export default function PagosList() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.find(t => t.valor === params.get('vista'))?.valor ?? 'caja'
  const [fechaCobros, setFechaCobros] = useState<string | null>(null)
  // Cambiar la clave reinicia la caja en el día elegido desde el historial
  const [diaCaja, setDiaCaja] = useState<{ fecha: string; n: number } | null>(null)

  const elegir = (t: Tab) => setParams(t === 'caja' ? {} : { vista: t }, { replace: true })

  return (
    <>
      <PageHeader titulo="Pagos y caja" subtitulo="Cobros, gastos de caja y cierre diario"
        acciones={<Link to="/pagos/nuevo" className="gt-btn gt-btn-primary"><Plus size={16} aria-hidden /> Registrar pago</Link>} />
      <div style={{ marginBottom: 16, overflowX: 'auto' }}>
        <Segmentado etiqueta="Vista" valor={tab} onChange={v => { setFechaCobros(null); elegir(v) }} opciones={TABS} />
      </div>

      {tab === 'caja' && (
        <CajaDelDia key={diaCaja?.n ?? 0} fechaInicial={diaCaja?.fecha}
          onVerPagos={f => { setFechaCobros(f); elegir('cobros') }} />
      )}
      {tab === 'cobros' && <MovimientosCaja key={fechaCobros ?? 'todos'} fechaInicial={fechaCobros} />}
      {tab === 'historial' && <HistorialCierres onAbrir={f => { setDiaCaja(d => ({ fecha: f, n: (d?.n ?? 0) + 1 })); elegir('caja') }} />}
    </>
  )
}

