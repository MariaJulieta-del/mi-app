import Modal from '../../../shared/components/Modal'
import type { Rutina } from '../types/Rutina'
import ListaAsignados from './ListaAsignados'

/** Ventana con los socios que tienen asignada una plantilla (desde la tarjeta) */
export default function AsignadosPlantilla({ plantilla, onCerrar, onCambio }: {
  plantilla: Rutina
  onCerrar: () => void
  /** Avisa la nueva cantidad de socios y de rutinas para renovar (para actualizar la tarjeta) */
  onCambio: (cantidad: number, paraRenovar: number) => void
}) {
  return (
    <Modal titulo={`Socios con "${plantilla.nombre}"`} onCerrar={onCerrar} ancho={640}
      pie={<button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cerrar</button>}>
      <p className="gt-text-muted gt-text-sm" style={{ marginTop: 0 }}>
        La hacen tal cual: si cambiás la plantilla, les llegan los cambios. "Ajustar" la copia como rutina propia del socio.
      </p>
      <ListaAsignados plantilla={plantilla} onCambio={onCambio} />
    </Modal>
  )
}
