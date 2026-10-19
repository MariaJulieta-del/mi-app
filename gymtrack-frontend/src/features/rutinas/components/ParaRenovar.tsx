import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../../shared/components/Modal'
import { obtenerAsignaciones } from '../services/rutinaService'
import type { Asignacion, Rutina } from '../types/Rutina'
import { linkEditarRutina } from '../utils/rutinaUtils'

/** Socios que ya pasaron el límite de semanas: con rutina personalizada o con una plantilla asignada */
export default function ParaRenovar({ personalizadas, onCerrar }: { personalizadas: Rutina[]; onCerrar: () => void }) {
  const [asignadas, setAsignadas] = useState<Asignacion[] | null>(null)

  useEffect(() => {
    obtenerAsignaciones().then(l => setAsignadas(l.filter(a => a.paraRenovar))).catch(() => setAsignadas([]))
  }, [])

  const filas = [
    ...personalizadas.filter(r => r.paraRenovar).map(r => ({
      clave: `r${r.id}`, socioId: r.socioId!, socio: r.socioNombre ?? '', rutina: r.nombre, semanas: r.semanasActual ?? 0, tipo: 'Personalizada',
      accion: <Link to={linkEditarRutina(r, true)} className="gt-btn gt-btn-secondary gt-btn-sm">Renovar</Link>,
    })),
    ...(asignadas ?? []).map(a => ({
      clave: `a${a.plantillaId}-${a.socioId}`, socioId: a.socioId, socio: a.socioNombre, rutina: a.plantillaNombre, semanas: a.semanas, tipo: 'Plantilla',
      accion: <Link to={`/rutinas/asignar?socioId=${a.socioId}`} className="gt-btn gt-btn-secondary gt-btn-sm">Asignar otra</Link>,
    })),
  ].sort((x, y) => y.semanas - x.semanas)

  return (
    <Modal titulo="Rutinas para renovar" onCerrar={onCerrar} ancho={640}
      pie={<button type="button" className="gt-btn gt-btn-secondary" onClick={onCerrar}>Cerrar</button>}>
      <p className="gt-text-muted gt-text-sm" style={{ marginTop: 0 }}>
        Socios que pasaron el límite de semanas con la misma rutina. Las personalizadas se renuevan cambiándoles los ejercicios;
        a quien tiene una plantilla, asignale otra (o ajustala solo para él desde la plantilla).
      </p>
      {asignadas === null ? <p className="gt-text-muted">Cargando…</p>
        : filas.length === 0 ? <p className="gt-text-muted">No hay rutinas para renovar.</p>
        : (
          <ul className="gt-asignados">
            {filas.map(f => (
              <li key={f.clave}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/socios/${f.socioId}/perfil`} style={{ fontWeight: 700 }}>{f.socio}</Link>
                  <div className="gt-text-sm gt-text-muted">{f.rutina} · {f.tipo}</div>
                </div>
                <span className="gt-chip gt-chip-renovar">{f.semanas} sem.</span>
                <div className="gt-asignados-acciones">{f.accion}</div>
              </li>
            ))}
          </ul>
        )}
    </Modal>
  )
}
