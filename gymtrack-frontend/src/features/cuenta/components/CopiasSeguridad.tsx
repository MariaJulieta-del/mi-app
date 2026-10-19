import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, DatabaseBackup, Download } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import { Cargando, IconButton, Pill, Spinner } from '../../../shared/components/ui'

interface Copia {
  id: number; fecha: string; archivo: string | null; destino: string; tamano: number | null; tablas: number | null; filas: number | null
  duracionMs: number | null; estado: 'OK' | 'ERROR'; error: string | null; manual: boolean; disponible: boolean
}
interface Estado {
  habilitado: boolean; destino: string; destinoDescripcion: string; efimero: boolean; cadaHoras: number; retener: number
  proxima: string; copias: Copia[]
}

const API = '/api/v1/backups'
const fecha = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
const tamano = (b: number | null) => (b == null ? '—' : b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

function hace(iso: string, ahora: number) {
  const min = Math.round((ahora - new Date(iso).getTime()) / 60_000)
  if (min < 60) return `hace ${Math.max(1, min)} min`
  const h = Math.round(min / 60)
  return h < 48 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`
}

/** PB-20: copias de seguridad automáticas de la base */
export default function CopiasSeguridad() {
  const toast = useToast()
  const [e, setE] = useState<Estado | null>(null)
  const [fallo, setFallo] = useState(false)
  const [haciendo, setHaciendo] = useState(false)
  const [bajando, setBajando] = useState<number | null>(null)
  /** Momento en que se cargó el estado (para calcular "hace cuánto") */
  const [ahora, setAhora] = useState(0)

  const cargar = () => axiosInstance.get<Estado>(API).then(r => { setE(r.data); setAhora(Date.now()) }).catch(() => setFallo(true))
  useEffect(() => { cargar() }, [])
  if (!e) return fallo ? null : <Cargando tarjeta texto="Cargando copias de seguridad…" />

  const ultimaOk = e.copias.find(c => c.estado === 'OK')
  const ultima = e.copias[0]
  const atrasada = !ultimaOk || ahora - new Date(ultimaOk.fecha).getTime() > (e.cadaHoras + 2) * 3_600_000

  const hacerAhora = async () => {
    setHaciendo(true)
    try {
      const c = (await axiosInstance.post<Copia>(API)).data
      if (c.estado === 'OK') toast.success('Copia hecha', `${c.tablas} tablas · ${c.filas?.toLocaleString('es-AR')} registros · ${tamano(c.tamano)}`)
      else toast.error('La copia falló', c.error ?? 'Revisá la configuración')
      cargar()
    } catch (err) {
      toast.error('No se pudo hacer la copia', mensajeError(err, 'Probá de nuevo'))
    } finally { setHaciendo(false) }
  }

  const descargar = async (c: Copia) => {
    setBajando(c.id)
    try {
      const r = await axiosInstance.get<Blob>(`${API}/${c.id}/archivo`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = c.archivo ?? 'gymtrack-backup.zip'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('No se pudo descargar', mensajeError(err, 'La copia ya no está guardada'))
      cargar()
    } finally { setBajando(null) }
  }

  return (
    <div className="gt-card gt-config-seccion">
      <div className="gt-card-cabecera">
        <p className="gt-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><DatabaseBackup size={16} aria-hidden /> Copias de seguridad</p>
        <button type="button" className="gt-btn gt-btn-secondary" disabled={haciendo} onClick={hacerAhora}>
          {haciendo ? <><Spinner /> Haciendo la copia…</> : 'Hacer una copia ahora'}
        </button>
      </div>

      <div className={`gt-backup-estado${atrasada ? ' atrasada' : ''}`} role="status">
        {atrasada ? <CircleAlert size={18} aria-hidden /> : <CircleCheck size={18} aria-hidden />}
        <span>
          {ultimaOk
            ? <><strong>Última copia {hace(ultimaOk.fecha, ahora)}</strong> ({fecha(ultimaOk.fecha)} · {tamano(ultimaOk.tamano)} · {ultimaOk.filas?.toLocaleString('es-AR')} registros)</>
            : <strong>Todavía no hay ninguna copia</strong>}
          {ultima && ultima.estado === 'ERROR' && <><br />La última falló: {ultima.error}</>}
          <br />
          <span className="gt-text-sm">
            {e.habilitado ? <>Se hace sola cada {e.cadaHoras} h · se guardan las últimas {e.retener}</> : 'Las copias automáticas están apagadas (BACKUP_ENABLED)'}
            {' · '}Destino: {e.destinoDescripcion}
          </span>
        </span>
      </div>

      {e.efimero && (
        <div className="gt-alert gt-alert-warning" role="note" style={{ marginTop: 10 }}>
          En este servidor la carpeta se borra al reiniciar: configurá Supabase Storage para que las copias queden a salvo (ver CONFIGURAR-BACKUP.md).
        </div>
      )}

      {e.copias.length > 0 && (
        <div className="gt-table-wrap" style={{ marginTop: 14 }}>
          <table className="gt-table">
            <thead><tr><th>Fecha</th><th>Estado</th><th>Tamaño</th><th>Registros</th><th>Origen</th><th style={{ width: 52 }} /></tr></thead>
            <tbody>
              {e.copias.map(c => (
                <tr key={c.id}>
                  <td>{fecha(c.fecha)}</td>
                  <td>{c.estado === 'OK' ? <Pill tono="ok">Correcta</Pill> : <span title={c.error ?? ''}><Pill tono="danger">Falló</Pill></span>}</td>
                  <td>{tamano(c.tamano)}</td>
                  <td>{c.filas?.toLocaleString('es-AR') ?? '—'}</td>
                  <td className="gt-text-muted">{c.manual ? 'A mano' : 'Automática'}</td>
                  <td>
                    {c.disponible && (
                      <IconButton icono={Download} etiqueta={bajando === c.id ? 'Descargando…' : `Descargar la copia del ${fecha(c.fecha)}`}
                        disabled={bajando !== null} onClick={() => descargar(c)} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="gt-hint" style={{ marginTop: 10 }}>
        Cada copia es un .zip con todas las tablas y un script para restaurarla (instrucciones adentro, en LEEME.txt).
        Tiene datos personales: guardala en un lugar privado.
      </p>
    </div>
  )
}
