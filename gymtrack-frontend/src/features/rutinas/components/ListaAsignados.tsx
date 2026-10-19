import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserMinus } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { obtenerAsignados, personalizarPlantilla, quitarAsignacion } from '../services/rutinaService'
import type { Asignacion, Rutina } from '../types/Rutina'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import { formatFecha } from '../../../shared/utils/fechas'
import { linkEditarRutina } from '../utils/rutinaUtils'
import { Cargando } from '../../../shared/components/ui'

/**
 * Socios que tienen asignada una plantilla: cuánto hace que la hacen, ajustarla para uno o quitársela.
 * Se usa en la ventana de la tarjeta y en la pantalla de la plantilla.
 */
export default function ListaAsignados({ plantilla, onCambio }: {
  plantilla: Rutina
  /** Avisa la nueva cantidad de socios y de rutinas para renovar */
  onCambio?: (cantidad: number, paraRenovar: number) => void
}) {
  const toast = useToast()
  const navigate = useNavigate()
  const [lista, setLista] = useState<Asignacion[] | null>(null)
  const [quitar, setQuitar] = useState<Asignacion | null>(null)
  const [ocupado, setOcupado] = useState<number | null>(null)

  useEffect(() => {
    obtenerAsignados(plantilla.id!).then(l => {
      setLista(l)
      onCambio?.(l.length, l.filter(x => x.paraRenovar).length)
    }).catch(() => setLista([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantilla.id])

  const confirmarQuitar = async () => {
    const a = quitar
    setQuitar(null)
    if (!a) return
    setOcupado(a.socioId)
    try {
      await quitarAsignacion(a.plantillaId, a.socioId)
      const resto = (lista ?? []).filter(x => x.socioId !== a.socioId)
      setLista(resto)
      onCambio?.(resto.length, resto.filter(x => x.paraRenovar).length)
      toast.success('Plantilla quitada', a.socioNombre)
    } catch (e) {
      toast.error('No se pudo quitar', mensajeError(e, 'Probá de nuevo'))
    } finally { setOcupado(null) }
  }

  const ajustar = async (a: Asignacion) => {
    setOcupado(a.socioId)
    try {
      const nueva = await personalizarPlantilla(a.plantillaId, a.socioId)
      navigate(linkEditarRutina(nueva, true))
    } catch (e) {
      toast.error('No se pudo copiar', mensajeError(e, 'Probá de nuevo'))
      setOcupado(null)
    }
  }

  return (
    <>
      {lista === null ? <Cargando texto="Cargando socios…" />
        : lista.length === 0 ? (
          <p className="gt-text-muted" style={{ margin: 0 }}>
            Ningún socio la tiene asignada. <Link to={`/rutinas/asignar?plantillaId=${plantilla.id}`}>Asignarla a un socio</Link>
          </p>
        ) : (
          <ul className="gt-asignados">
            {lista.map(a => (
              <li key={a.socioId}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/socios/${a.socioId}/perfil`} style={{ fontWeight: 700 }}>{a.socioNombre}</Link>
                  <div className="gt-text-sm gt-text-muted">
                    Desde el {formatFecha(a.desde)}
                    {a.elegidaPorSocio ? ' · la eligió el socio' : a.asignadaPor ? ` · asignada por ${a.asignadaPor}` : ''}
                  </div>
                </div>
                {a.paraRenovar
                  ? <span className="gt-chip gt-chip-renovar" title={`El límite es ${a.semanasMax} semanas`}>Renovar · {a.semanas} sem.</span>
                  : <span className="gt-chip gt-chip-semana">Semana {a.semanas + 1} de {a.semanasMax}</span>}
                <div className="gt-asignados-acciones">
                  {a.paraRenovar && <Link to={`/rutinas/asignar?socioId=${a.socioId}`} className="gt-btn gt-btn-secondary gt-btn-sm">Asignar otra</Link>}
                  <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado === a.socioId} onClick={() => ajustar(a)}
                    title="Copiarla como rutina propia del socio para cambiarle ejercicios o pesos">Ajustar</button>
                  <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" disabled={ocupado === a.socioId} onClick={() => setQuitar(a)}
                    aria-label={`Quitarle la plantilla a ${a.socioNombre}`} title="Quitársela"><UserMinus size={14} aria-hidden /></button>
                </div>
              </li>
            ))}
          </ul>
        )}

      <ConfirmModal open={quitar !== null} title="Quitar plantilla"
        message={quitar ? `¿Quitarle "${plantilla.nombre}" a ${quitar.socioNombre}? La plantilla y el progreso que registró no se borran.` : ''}
        confirmLabel="Quitar" danger onConfirm={confirmarQuitar} onCancel={() => setQuitar(null)} />
    </>
  )
}
