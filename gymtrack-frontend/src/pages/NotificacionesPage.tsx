import { useState, useEffect, useRef } from 'react'
import { listarNotificaciones, crearNotificacion, archivarNotificacion } from '../services/notificacionService'
import { obtenerTodos } from '../services/socioService'
import type { Socio } from '../types/Socio'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../hooks/useToast'

interface Notificacion {
  id: number
  titulo: string
  mensaje: string
  tipo: string
  destinatario: string
  socioId?: number | null
  socioNombre?: string
  fechaCreacion: string
  activa: boolean
}

const TIPOS = [
  { val: 'INFO',         label: 'Información',  bg: 'var(--blue-bg)',   color: 'var(--blue-text)' },
  { val: 'ALERTA',       label: 'Alerta',       bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
  { val: 'URGENTE',      label: 'Urgente',      bg: 'var(--red-light)', color: 'var(--red-text)' },
  { val: 'RECORDATORIO', label: 'Recordatorio', bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  { val: 'VENCIMIENTO',  label: 'Vencimiento',  bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
]

const VACIO = { titulo: '', mensaje: '', tipo: 'INFO', destinatario: 'TODOS' }

function TipoBadge({ tipo }: { tipo: string }) {
  const cfg = TIPOS.find(t => t.val === tipo) ?? { bg: 'var(--bg-surface-2)', color: 'var(--text-muted)', label: tipo }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

export default function NotificacionesPage() {
  const toast = useToast()
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [form, setForm] = useState(VACIO)
  const [creando, setCreando] = useState(false)
  const [confirmarArchivarId, setConfirmarArchivarId] = useState<number | null>(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [verArchivadas, setVerArchivadas] = useState(false)

  // Buscador de socio
  const [socios, setSocios] = useState<Socio[]>([])
  const [socioSel, setSocioSel] = useState<Socio | null>(null)
  const [busquedaSocio, setBusquedaSocio] = useState('')
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try { setNotifs(await listarNotificaciones()) } catch {}
  }

  // Cargar socios cuando abre el buscador
  useEffect(() => {
    if (mostrarBuscador && socios.length === 0) {
      obtenerTodos().then(setSocios).catch(() => {})
    }
    if (mostrarBuscador) setTimeout(() => inputRef.current?.focus(), 50)
  }, [mostrarBuscador])

  const sociosFiltrados = busquedaSocio.length >= 1
    ? socios.filter(s => {
        const q = busquedaSocio.toLowerCase()
        return s.nombre.toLowerCase().includes(q) || s.apellido.toLowerCase().includes(q) || s.dni.includes(q)
      }).slice(0, 6)
    : []

  const seleccionarSocio = (s: Socio) => {
    setSocioSel(s)
    setBusquedaSocio('')
    setMostrarBuscador(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.mensaje.trim()) {
      toast.error('Campos incompletos', 'Título y mensaje son obligatorios')
      return
    }
    if (form.destinatario === 'SOCIO' && !socioSel) {
      toast.error('Faltan datos', 'Seleccioná un socio para la notificación individual')
      return
    }
    setCreando(true)
    try {
      await crearNotificacion({
        ...form,
        socioId: form.destinatario === 'SOCIO' ? socioSel!.id : null,
      })
      toast.success('Notificación enviada', form.titulo)
      setForm(VACIO)
      setSocioSel(null)
      cargar()
    } catch {
      toast.error('Error', 'No se pudo enviar la notificación')
    } finally {
      setCreando(false)
    }
  }

  const handleArchivar = async () => {
    if (confirmarArchivarId === null) return
    const id = confirmarArchivarId
    setConfirmarArchivarId(null)
    try {
      await archivarNotificacion(id)
      toast.success('Notificación archivada')
      cargar()
    } catch {
      toast.error('Error', 'No se pudo archivar la notificación')
    }
  }

  const activas   = notifs.filter(n => n.activa)
  const archivadas = notifs.filter(n => !n.activa)
  const listaVer  = (verArchivadas ? archivadas : activas)
    .filter(n => !filtroTipo || n.tipo === filtroTipo)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>Notificaciones</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {activas.length} activa{activas.length !== 1 ? 's' : ''}
          </span>
          {archivadas.length > 0 && (
            <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
              onClick={() => setVerArchivadas(v => !v)}>
              {verArchivadas ? `Ver activas (${activas.length})` : `Ver archivadas (${archivadas.length})`}
            </button>
          )}
        </div>
      </div>

      {/* ─── Formulario de nueva notificación ─── */}
      <div className="gt-card" style={{ marginBottom: 20 }}>
        <p className="gt-card-title" style={{ marginTop: 0 }}>Nueva notificación</p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="gt-form-grid">

            {/* Título */}
            <div className="gt-form-group">
              <label className="gt-label">Título <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="gt-input" value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Clase cancelada" />
            </div>

            {/* Tipo */}
            <div className="gt-form-group">
              <label className="gt-label">Tipo</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {TIPOS.slice(0, 4).map(t => (
                  <button key={t.val} type="button"
                    onClick={() => setForm({ ...form, tipo: t.val })}
                    style={{
                      padding: '5px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                      border: `1.5px solid ${form.tipo === t.val ? t.color : 'var(--border)'}`,
                      background: form.tipo === t.val ? t.bg : 'var(--bg-surface)',
                      color: form.tipo === t.val ? t.color : 'var(--text-secondary)',
                      fontWeight: form.tipo === t.val ? 700 : 400,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Destinatario */}
            <div className="gt-form-group">
              <label className="gt-label">Destinatario</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {[
                  { val: 'TODOS', label: 'Todos los socios' },
                  { val: 'SOCIO', label: 'Socio específico' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => { setForm({ ...form, destinatario: opt.val }); setSocioSel(null); setMostrarBuscador(false) }}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                      border: `1.5px solid ${form.destinatario === opt.val ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.destinatario === opt.val ? 'var(--accent-light)' : 'var(--bg-surface)',
                      color: form.destinatario === opt.val ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: form.destinatario === opt.val ? 700 : 400,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de socio */}
            {form.destinatario === 'SOCIO' && (
              <div className="gt-form-group">
                <label className="gt-label">Socio <span style={{ color: 'var(--red)' }}>*</span></label>
                {socioSel ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: 'var(--accent-light)',
                    border: '1px solid var(--accent-border)', borderRadius: 8,
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>#{socioSel.id}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {socioSel.nombre} {socioSel.apellido}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>DNI {socioSel.dni}</span>
                    <button type="button"
                      onClick={() => { setSocioSel(null); setMostrarBuscador(true) }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>
                      cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <button type="button" className="gt-btn gt-btn-secondary"
                      onClick={() => setMostrarBuscador(v => !v)}>
                      {mostrarBuscador ? 'Cerrar buscador' : 'Buscar socio'}
                    </button>
                    {mostrarBuscador && (
                      <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                        <input ref={inputRef} className="gt-input"
                          placeholder="Nombre, apellido o DNI..."
                          value={busquedaSocio}
                          onChange={e => setBusquedaSocio(e.target.value)}
                          style={{ marginBottom: 6 }}
                        />
                        {sociosFiltrados.length > 0 && (
                          <div style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-surface)' }}>
                            {sociosFiltrados.map(s => (
                              <div key={s.id} onClick={() => seleccionarSocio(s)}
                                style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 10, color: 'var(--text-secondary)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}>
                                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>#{s.id}</span>
                                <span>{s.nombre} {s.apellido}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>DNI {s.dni}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {busquedaSocio.length > 0 && sociosFiltrados.length === 0 && (
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Sin resultados</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mensaje */}
            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Mensaje <span style={{ color: 'var(--red)' }}>*</span></label>
              <textarea className="gt-textarea" rows={3}
                value={form.mensaje}
                onChange={e => setForm({ ...form, mensaje: e.target.value })}
                placeholder="Contenido de la notificación..." />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={creando}>
              {creando ? 'Enviando...' : 'Enviar notificación'}
            </button>
            {form.destinatario === 'TODOS' && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Se enviará a todos los socios activos
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ─── Lista de notificaciones ─── */}
      <div className="gt-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p className="gt-card-title" style={{ marginTop: 0, marginBottom: 0 }}>
            {verArchivadas ? 'Archivadas' : 'Activas'} ({listaVer.length})
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setFiltroTipo('')}
              style={{
                padding: '3px 10px', borderRadius: 14, fontSize: 12, cursor: 'pointer',
                border: `1.5px solid ${!filtroTipo ? 'var(--accent)' : 'var(--border)'}`,
                background: !filtroTipo ? 'var(--accent-light)' : 'var(--bg-surface)',
                color: !filtroTipo ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              Todos
            </button>
            {TIPOS.map(t => (
              <button key={t.val} onClick={() => setFiltroTipo(filtroTipo === t.val ? '' : t.val)}
                style={{
                  padding: '3px 10px', borderRadius: 14, fontSize: 12, cursor: 'pointer',
                  border: `1.5px solid ${filtroTipo === t.val ? t.color : 'var(--border)'}`,
                  background: filtroTipo === t.val ? t.bg : 'var(--bg-surface)',
                  color: filtroTipo === t.val ? t.color : 'var(--text-muted)',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {listaVer.length === 0 ? (
          <div className="gt-empty">
            {filtroTipo
              ? 'No hay notificaciones de ese tipo.'
              : verArchivadas ? 'No hay notificaciones archivadas.' : 'No hay notificaciones activas.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {listaVer.map(n => (
              <div key={n.id} style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                background: 'var(--bg-surface)',
                opacity: n.activa ? 1 : 0.7,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <TipoBadge tipo={n.tipo} />
                    <span style={{ fontSize: 11, background: 'var(--bg-surface-2)', color: 'var(--text-muted)', borderRadius: 6, padding: '2px 8px', border: '1px solid var(--border)' }}>
                      {n.destinatario === 'TODOS' ? 'Todos' : n.socioNombre ? n.socioNombre : `Socio #${n.socioId}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-xmuted)' }}>
                      {new Date(n.fechaCreacion).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: 14, color: 'var(--text-primary)' }}>{n.titulo}</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{n.mensaje}</p>
                </div>
                {n.activa && (
                  <button
                    className="gt-btn gt-btn-secondary"
                    style={{ marginLeft: 16, flexShrink: 0, fontSize: 12 }}
                    onClick={() => setConfirmarArchivarId(n.id)}>
                    Archivar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmarArchivarId !== null}
        title="Archivar notificación"
        message="¿Archivar esta notificación? Se moverá al historial y dejará de estar activa."
        confirmLabel="Archivar"
        onConfirm={handleArchivar}
        onCancel={() => setConfirmarArchivarId(null)}
      />
    </>
  )
}
