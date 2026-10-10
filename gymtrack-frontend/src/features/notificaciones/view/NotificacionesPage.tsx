import { useState } from 'react'
import {
  Archive, Bell, CalendarDays, Mail, MessageCircle, Search, Send, Smartphone, UserRound, Users, X,
} from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { EmptyState, IconButton, PageHeader, Pill, Segmentado, SkeletonTarjetas } from '../../../shared/components/ui'
import { useNotificaciones, TIPOS, TONO_TIPO, PLANTILLAS } from '../hooks/useNotificaciones'
import WhatsappModal from '../components/WhatsappModal'
import type { Notificacion } from '../services/notificacionService'

const textoTipo = (t: string) => TIPOS.find(x => x.val === t)?.label ?? t
const cuando = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

function aQuien(n: Notificacion) {
  if (n.destinatario === 'TODOS') return { icono: Users, texto: 'Todos los socios' }
  if (n.destinatario === 'DISCIPLINA') return { icono: CalendarDays, texto: n.disciplinaNombre ? `Clase de ${n.disciplinaNombre}` : 'Una clase' }
  return { icono: UserRound, texto: n.socioNombre ?? `Socio #${n.socioId}` }
}

/** Avisos que se muestran de entrada en el historial (el resto con "Ver más") */
const POR_TANDA = 10

export default function NotificacionesPage() {
  const n = useNotificaciones()
  const [mostrar, setMostrar] = useState(POR_TANDA)
  const mailListo = !!n.canales?.email

  return (
    <>
      <PageHeader titulo="Notificaciones" subtitulo="Llegan a la app del socio y, si querés, por mail y WhatsApp" />

      <div className="gt-avisos">
        {/* ── Redactar ── */}
        <form className="gt-card gt-aviso-nuevo" onSubmit={n.pedirEnvio} noValidate>
          <div className="gt-card-cabecera">
            <p className="gt-card-title" style={{ margin: 0 }}>Nuevo aviso</p>
            <select className="gt-select gt-aviso-plantillas" value="" aria-label="Usar un mensaje frecuente"
              onChange={e => { const p = PLANTILLAS.find(x => x.nombre === e.target.value); if (p) n.usarPlantilla(p) }}>
              <option value="">Mensajes frecuentes…</option>
              {PLANTILLAS.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
            </select>
          </div>

          <div className="gt-form-group">
            <span className="gt-label">Para</span>
            <Segmentado etiqueta="Destinatarios" valor={n.para} onChange={n.setPara} opciones={[
              { valor: 'TODOS', texto: 'Todos', icono: Users },
              { valor: 'DISCIPLINA', texto: 'Una clase', icono: CalendarDays },
              { valor: 'SOCIO', texto: 'Un socio', icono: UserRound },
            ]} />
            {n.para === 'DISCIPLINA' && (
              <select className="gt-select" style={{ marginTop: 8 }} value={n.disciplinaId} aria-label="Clase"
                onChange={e => n.setDisciplinaId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Elegí la clase…</option>
                {n.disciplinas.map(d => <option key={d.id} value={d.id}>{d.nombre} · {d.totalInscritos} {d.totalInscritos === 1 ? 'alumno' : 'alumnos'}</option>)}
              </select>
            )}
            {n.para === 'SOCIO' && (n.socioSel ? (
              <div className="gt-aviso-socio">
                <UserRound size={16} aria-hidden />
                <strong>{n.socioSel.nombre} {n.socioSel.apellido}</strong>
                <span className="gt-text-sm gt-text-muted">{[n.socioSel.email && 'mail', n.socioSel.telefono && 'teléfono'].filter(Boolean).join(' · ') || 'sin mail ni teléfono'}</span>
                <IconButton icono={X} etiqueta="Cambiar socio" onClick={() => n.setSocioSel(null)} />
              </div>
            ) : (
              <div className="gt-busqueda" style={{ maxWidth: 'none', marginTop: 8 }}>
                <Search size={16} aria-hidden />
                <input className="gt-input" placeholder="Buscar por nombre o DNI…" value={n.busquedaSocio} autoFocus
                  onChange={e => n.setBusquedaSocio(e.target.value)} aria-label="Buscar socio" />
                {n.sociosFiltrados.length > 0 && (
                  <div className="gt-builder-sugerencias">
                    {n.sociosFiltrados.map(s => (
                      <button type="button" key={s.id} className="gt-socio-opcion" onClick={() => { n.setSocioSel(s); n.setBusquedaSocio('') }}>
                        <span>{s.nombre} {s.apellido}</span>
                        <span className="gt-text-muted" style={{ marginLeft: 'auto', fontSize: 12 }}>DNI {s.dni}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="gt-form-group">
            <label className="gt-label" htmlFor="aviso-titulo">Título</label>
            <input id="aviso-titulo" className="gt-input" maxLength={120} value={n.form.titulo} placeholder="Ej: Horario especial por feriado"
              onChange={e => n.setForm({ ...n.form, titulo: e.target.value })} />
          </div>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="aviso-mensaje">Mensaje <span className="gt-text-muted" style={{ fontWeight: 400 }}>· {n.form.mensaje.length}/1000</span></label>
            <textarea id="aviso-mensaje" className="gt-textarea" rows={4} maxLength={1000} value={n.form.mensaje} placeholder="Lo que le querés contar al socio…"
              onChange={e => n.setForm({ ...n.form, mensaje: e.target.value })} />
            {/\[[^\]]+\]/.test(n.form.mensaje) && <span className="gt-hint" style={{ color: 'var(--yellow-text)' }}>Completá lo que está entre corchetes antes de enviar.</span>}
          </div>
          <div className="gt-form-group">
            <span className="gt-label">Tipo</span>
            <div className="gt-chips">
              {TIPOS.filter(t => t.val !== 'CLASE').map(t => (
                <button key={t.val} type="button" className={`gt-chip-btn chico${n.form.tipo === t.val ? ' activo' : ''}`} aria-pressed={n.form.tipo === t.val}
                  onClick={() => n.setForm({ ...n.form, tipo: t.val })}>{t.label}</button>
              ))}
            </div>
          </div>

          <div className="gt-form-group">
            <span className="gt-label">Por dónde</span>
            <div className="gt-canales">
              <label className="gt-canal activo fijo">
                <input type="checkbox" checked disabled />
                <Smartphone size={18} aria-hidden />
                <span><strong>App</strong><small>Siempre: lo ve al entrar</small></span>
              </label>
              <label className={`gt-canal${n.porEmail && mailListo ? ' activo' : ''}${!mailListo ? ' deshabilitado' : ''}`}>
                <input type="checkbox" checked={n.porEmail && mailListo} disabled={!mailListo} onChange={e => n.setPorEmail(e.target.checked)} />
                <Mail size={18} aria-hidden />
                <span><strong>Mail</strong><small>{mailListo ? `${n.canales!.conEmail} socios con mail` : 'Sin configurar todavía'}</small></span>
              </label>
              <label className={`gt-canal${n.porWhatsapp ? ' activo' : ''}`}>
                <input type="checkbox" checked={n.porWhatsapp} onChange={e => n.setPorWhatsapp(e.target.checked)} />
                <MessageCircle size={18} aria-hidden />
                <span><strong>WhatsApp</strong><small>{n.canales ? `${n.canales.conTelefono} con teléfono` : 'Desde tu WhatsApp'}</small></span>
              </label>
            </div>
            {!mailListo && n.canales && (
              <span className="gt-hint">Para mandar mails hay que cargar la casilla del gimnasio en el servidor (instrucciones en CONFIGURAR-MAIL.md).</span>
            )}
          </div>

          <div className="gt-aviso-enviar">
            <span className="gt-text-sm gt-text-muted">
              {n.para === 'TODOS' ? `Llega a ${n.alcance} socios activos` : n.para === 'DISCIPLINA' ? (n.disciplinaId ? `Llega a ${n.alcance} alumnos` : 'Elegí la clase') : n.socioSel ? `Para ${n.socioSel.nombre}` : 'Elegí el socio'}
            </span>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={n.creando}><Send size={16} aria-hidden /> {n.creando ? 'Enviando…' : 'Enviar aviso'}</button>
          </div>
        </form>

        {/* ── Historial ── */}
        <section className="gt-card gt-avisos-historial">
          <div className="gt-card-cabecera">
            <Segmentado etiqueta="Ver" valor={n.verArchivadas ? 'archivados' : 'activos'} onChange={v => n.setVerArchivadas(v === 'archivados')}
              opciones={[{ valor: 'activos', texto: 'Enviados', cuenta: n.activas.length }, { valor: 'archivados', texto: 'Archivados', cuenta: n.archivadas.length }]} />
            <select className="gt-select" style={{ width: 'auto' }} value={n.filtroTipo} onChange={e => n.setFiltroTipo(e.target.value)} aria-label="Tipo">
              <option value="">Todos los tipos</option>
              {TIPOS.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
            </select>
          </div>
          <div className="gt-busqueda" style={{ maxWidth: 'none', marginBottom: 10 }}>
            <Search size={16} aria-hidden />
            <input className="gt-input" placeholder="Buscar en los avisos" value={n.busqueda} onChange={e => n.setBusqueda(e.target.value)} aria-label="Buscar aviso" />
          </div>

          {n.cargando ? <SkeletonTarjetas cantidad={3} alto={84} /> : n.listaVer.length === 0 ? (
            <EmptyState icono={Bell} titulo={n.verArchivadas ? 'No hay avisos archivados' : 'Todavía no mandaste avisos'}
              texto={!n.verArchivadas && !n.filtroTipo && !n.busqueda ? 'Escribí el primero a la izquierda: le llega a cada socio en su app.' : undefined} />
          ) : (
            <div className="gt-avisos-lista">
              {n.listaVer.slice(0, mostrar).map(a => {
                const q = aQuien(a)
                return (
                  <article key={a.id} className="gt-aviso">
                    <div className="gt-aviso-meta">
                      <Pill tono={TONO_TIPO[a.tipo] ?? 'neutral'}>{textoTipo(a.tipo)}</Pill>
                      <span className="gt-aviso-para"><q.icono size={13} aria-hidden /> {q.texto}</span>
                      <span className="gt-text-muted gt-text-sm" style={{ marginLeft: 'auto' }}>{cuando(a.fechaCreacion)}</span>
                    </div>
                    <strong className="gt-aviso-titulo">{a.titulo}</strong>
                    <p className="gt-aviso-texto">{a.mensaje}</p>
                    <div className="gt-aviso-pie">
                      <span className="gt-aviso-canales" aria-label="Canales">
                        <Smartphone size={14} aria-hidden /> App
                        {a.porEmail && mailListo && <><Mail size={14} aria-hidden /> Mail</>}
                      </span>
                      <span style={{ flex: 1 }} />
                      <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => n.setWhatsappDe(a)}>
                        <MessageCircle size={14} aria-hidden /> WhatsApp
                      </button>
                      {a.activa && <IconButton icono={Archive} etiqueta="Archivar" onClick={() => n.setConfirmarArchivarId(a.id)} />}
                    </div>
                  </article>
                )
              })}
              {n.listaVer.length > mostrar && (
                <button type="button" className="gt-btn gt-btn-secondary gt-avisos-mas" onClick={() => setMostrar(m => m + POR_TANDA * 2)}>
                  Ver más ({n.listaVer.length - mostrar} {n.listaVer.length - mostrar === 1 ? 'aviso' : 'avisos'})
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {n.whatsappDe && <WhatsappModal aviso={n.whatsappDe} onCerrar={() => n.setWhatsappDe(null)} />}

      <ConfirmModal open={n.confirmarEnvio} title="Enviar a todos"
        message={`"${n.form.titulo}" le llega a los ${n.alcance} socios activos en la app${n.porEmail && mailListo ? ` y por mail a ${n.canales!.conEmail}` : ''}. ¿Enviar?`}
        confirmLabel="Enviar" onConfirm={n.enviar} onCancel={() => n.setConfirmarEnvio(false)} />
      <ConfirmModal open={n.confirmarArchivarId !== null} title="Archivar aviso"
        message="Deja de mostrarse en la app de los socios. Lo vas a seguir viendo en Archivados."
        confirmLabel="Archivar" onConfirm={n.handleArchivar} onCancel={() => n.setConfirmarArchivarId(null)} />
    </>
  )
}
