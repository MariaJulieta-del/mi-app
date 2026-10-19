import { useEffect, useState } from 'react'
import { BellRing, Mail, Send, Smartphone } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import { formatFecha } from '../../../shared/utils/fechas'
import { Cargando, Spinner } from '../../../shared/components/ui'

interface Config { activo: boolean; dias: number; porMail: boolean; avisarVencida: boolean; mailListo: boolean }
interface Enviado { socioId: number; socio: string; tipo: 'ANTES' | 'VENCIDA'; fechaVencimiento: string; enviado: string; porMail: boolean }
interface Resultado { activo: boolean; revisados: number; avisosApp: number; mails: number }

const API = '/api/v1/recordatorios-cuota'
const cuando = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** PB-17: recordatorio automático de vencimiento de cuota (configuración e historial) */
export default function RecordatoriosCuota() {
  const toast = useToast()
  const [config, setConfig] = useState<Config | null>(null)
  const [fallo, setFallo] = useState(false)
  const [guardada, setGuardada] = useState<Config | null>(null)
  const [enviados, setEnviados] = useState<Enviado[]>([])
  const [guardando, setGuardando] = useState(false)
  const [mandando, setMandando] = useState(false)
  const [verTodos, setVerTodos] = useState(false)

  const cargar = () => axiosInstance.get<{ config: Config; ultimos: Enviado[] }>(API)
    .then(r => { setConfig(r.data.config); setGuardada(r.data.config); setEnviados(r.data.ultimos) })
    .catch(() => setFallo(true))
  useEffect(() => { cargar() }, [])

  if (!config) return fallo ? null : <Cargando tarjeta texto="Cargando recordatorios…" />
  const cambio = JSON.stringify(config) !== JSON.stringify(guardada)
  const set = (p: Partial<Config>) => setConfig({ ...config, ...p })

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const r = (await axiosInstance.put<Config>(API, config)).data
      setConfig(r); setGuardada(r)
      toast.success('Listo', r.activo ? `Se avisa ${r.dias} ${r.dias === 1 ? 'día' : 'días'} antes del vencimiento` : 'Recordatorios apagados')
    } catch (err) {
      toast.error('No se pudo guardar', mensajeError(err, 'Probá de nuevo'))
    } finally { setGuardando(false) }
  }

  const mandarAhora = async () => {
    setMandando(true)
    try {
      const r = (await axiosInstance.post<Resultado>(`${API}/ejecutar`)).data
      if (!r.activo) toast.error('Están apagados', 'Activalos para que se manden')
      else if (r.avisosApp === 0) toast.success('Nada pendiente', 'Todos los que tenían que recibir el recordatorio ya lo recibieron')
      else toast.success('Recordatorios enviados', `${r.avisosApp} ${r.avisosApp === 1 ? 'socio' : 'socios'}${r.mails ? ` · ${r.mails} por mail` : ''}`)
      cargar()
    } catch (err) {
      toast.error('No se pudieron mandar', mensajeError(err, 'Probá de nuevo'))
    } finally { setMandando(false) }
  }

  const visibles = verTodos ? enviados : enviados.slice(0, 5)

  return (
    <form className="gt-card gt-config-seccion" onSubmit={guardar}>
      <div className="gt-card-cabecera">
        <p className="gt-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><BellRing size={16} aria-hidden /> Recordatorio de vencimiento de cuota</p>
        <label className="gt-interruptor">
          <input type="checkbox" checked={config.activo} onChange={e => set({ activo: e.target.checked })} />
          <span>{config.activo ? 'Activado' : 'Apagado'}</span>
        </label>
      </div>
      <p className="gt-text-sm gt-text-muted" style={{ marginTop: 0 }}>
        Cada socio recibe un aviso automático antes de que se le venza la cuota, con el plan, la fecha y el precio.
        Le llega a la app y, si tiene mail, también por mail. Se manda una sola vez por vencimiento.
      </p>

      <fieldset disabled={!config.activo} className="gt-config-campos">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label className="gt-label" htmlFor="rec-dias" style={{ margin: 0 }}>Avisar</label>
          <input id="rec-dias" className="gt-input" type="number" min={1} max={15} style={{ width: 80 }} value={config.dias}
            onChange={e => set({ dias: Number(e.target.value) })} />
          <span>días antes de que venza</span>
        </div>
        <label className="gt-check">
          <input type="checkbox" checked={config.avisarVencida} onChange={e => set({ avisarVencida: e.target.checked })} />
          Si se le pasa, avisarle también cuando ya venció
        </label>
        <label className="gt-check">
          <input type="checkbox" checked={config.porMail} onChange={e => set({ porMail: e.target.checked })} />
          También por mail
          {!config.mailListo && <span className="gt-text-sm" style={{ color: 'var(--yellow-text)' }}> · el mail del gimnasio todavía no está configurado (solo llega a la app)</span>}
        </label>
      </fieldset>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando || !cambio || config.dias < 1 || config.dias > 15}>
          {guardando ? <><Spinner /> Guardando…</> : 'Guardar'}
        </button>
        <button type="button" className="gt-btn gt-btn-secondary" disabled={mandando || cambio || !config.activo} onClick={mandarAhora}
          title={cambio ? 'Guardá los cambios primero' : 'Manda ahora los que correspondan (si no, salen solos durante el día)'}>
          <Send size={15} aria-hidden /> {mandando ? <><Spinner /> Enviando…</> : 'Mandar ahora'}
        </button>
      </div>

      <p className="gt-subtitulo" style={{ marginTop: 18 }}>Enviados en los últimos 30 días ({enviados.length})</p>
      {enviados.length === 0 ? <p className="gt-text-sm gt-text-muted" style={{ margin: 0 }}>Todavía no se mandó ninguno.</p> : (
        <div className="gt-recordatorios">
          {visibles.map(r => (
            <div key={`${r.socioId}-${r.fechaVencimiento}-${r.tipo}`} className="gt-recordatorio-fila">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{r.socio}</strong>
                <small>{r.tipo === 'ANTES' ? 'Por vencer' : 'Ya vencida'} · vence el {formatFecha(r.fechaVencimiento)}</small>
              </span>
              <span className="gt-recordatorio-canales" aria-label={r.porMail ? 'App y mail' : 'Solo app'}>
                <Smartphone size={14} aria-hidden />{r.porMail && <Mail size={14} aria-hidden />}
              </span>
              <span className="gt-text-sm gt-text-muted" style={{ whiteSpace: 'nowrap' }}>{cuando(r.enviado)}</span>
            </div>
          ))}
          {enviados.length > 5 && (
            <button type="button" className="gt-btn-link" onClick={() => setVerTodos(v => !v)}>{verTodos ? 'Ver menos' : `Ver los ${enviados.length}`}</button>
          )}
        </div>
      )}
    </form>
  )
}
