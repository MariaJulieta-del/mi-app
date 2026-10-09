import { useEffect, useState } from 'react'
import { Check, Copy, MessageCircle, Search } from 'lucide-react'
import Modal from '../../../shared/components/Modal'
import { linksWhatsapp, type Notificacion, type Whatsapp } from '../services/notificacionService'

/**
 * Mandar un aviso por WhatsApp sin API paga: un botón por socio abre WhatsApp con el mensaje listo.
 * Para muchos socios conviene copiar el texto y pegarlo en una lista de difusión.
 */
export default function WhatsappModal({ aviso, onCerrar }: { aviso: Notificacion; onCerrar: () => void }) {
  const [datos, setDatos] = useState<Whatsapp | null>(null)
  const [error, setError] = useState(false)
  const [enviados, setEnviados] = useState<Set<number>>(new Set())
  const [copiado, setCopiado] = useState(false)
  const [buscar, setBuscar] = useState('')

  useEffect(() => { linksWhatsapp(aviso.id).then(setDatos).catch(() => setError(true)) }, [aviso.id])

  const copiar = async () => {
    if (!datos) return
    try { await navigator.clipboard.writeText(datos.texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { /* sin portapapeles */ }
  }

  const q = buscar.trim().toLowerCase()
  const destinos = (datos?.destinos ?? []).filter(d => !q || d.nombre.toLowerCase().includes(q))

  return (
    <Modal titulo={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><MessageCircle size={18} aria-hidden /> Mandar por WhatsApp</span>}
      onCerrar={onCerrar} ancho={560}
      pie={<button type="button" className="gt-btn gt-btn-primary" onClick={onCerrar}>Listo</button>}>
      {error && <div className="gt-alert gt-alert-error">No se pudieron armar los links.</div>}
      {!datos ? (!error && <p className="gt-text-muted">Preparando…</p>) : (
        <>
          <div className="gt-wa-mensaje">
            <pre>{datos.texto}</pre>
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={copiar}>
              {copiado ? <><Check size={14} aria-hidden /> Copiado</> : <><Copy size={14} aria-hidden /> Copiar texto</>}
            </button>
          </div>
          <p className="gt-text-sm gt-text-muted" style={{ margin: '0 0 10px' }}>
            Tocá cada socio: se abre WhatsApp con el mensaje escrito y solo falta darle a enviar.
            {datos.destinos.length > 15 && ' Para tantos socios es más rápido copiar el texto y mandarlo a una lista de difusión.'}
          </p>
          {datos.destinos.length > 6 && (
            <div className="gt-busqueda" style={{ maxWidth: 'none', marginBottom: 8 }}>
              <Search size={16} aria-hidden />
              <input className="gt-input" placeholder="Buscar socio" value={buscar} onChange={e => setBuscar(e.target.value)} aria-label="Buscar socio" />
            </div>
          )}
          {datos.destinos.length === 0 ? (
            <p className="gt-text-muted">Ninguno de los destinatarios tiene un teléfono cargado.</p>
          ) : (
            <div className="gt-wa-lista">
              {destinos.map(d => {
                const ya = enviados.has(d.socioId)
                return (
                  <a key={d.socioId} href={d.link} target="_blank" rel="noopener noreferrer" className={`gt-wa-item${ya ? ' enviado' : ''}`}
                    onClick={() => setEnviados(prev => new Set(prev).add(d.socioId))}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong>{d.nombre}</strong>
                      <small>+{d.telefono}</small>
                    </span>
                    {ya ? <span className="gt-wa-ok"><Check size={14} aria-hidden /> Abierto</span> : <span className="gt-wa-ir"><MessageCircle size={14} aria-hidden /> Abrir</span>}
                  </a>
                )
              })}
            </div>
          )}
          <p className="gt-text-sm gt-text-muted" style={{ margin: '10px 0 0' }}>
            {enviados.size} de {datos.destinos.length} abiertos
            {datos.sinTelefono.length > 0 && ` · ${datos.sinTelefono.length} sin teléfono válido (${datos.sinTelefono.slice(0, 3).join(', ')}${datos.sinTelefono.length > 3 ? '…' : ''})`}
          </p>
        </>
      )}
    </Modal>
  )
}
