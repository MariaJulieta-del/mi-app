import { Link } from 'react-router-dom'
import { Ban, IdCard, Pencil, Plus, RotateCcw, Ticket, Trash2, Users, Wallet } from 'lucide-react'
import { useMembresiasList, colorPara } from '../hooks/useMembresiasList'
import { textoPases, type Tarifa } from '../types/Tarifa'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import Modal from '../../../shared/components/Modal'
import { EmptyState, IconButton, PageHeader, Pill, SkeletonTarjetas } from '../../../shared/components/ui'

const pesos = (n: number) => `$${Number(n).toLocaleString('es-AR')}`

function TarjetaPlan({ p, admin, onEditar, onActivo, onDeshabilitar, onBorrar }: {
  p: Tarifa; admin: boolean; onEditar: () => void; onActivo: () => void; onDeshabilitar: () => void; onBorrar: () => void
}) {
  const color = colorPara(p.tipo)
  const inactivo = p.activo === false
  return (
    <article className={`gt-card gt-plan${inactivo ? ' inactivo' : ''}`} style={{ ['--plan' as string]: color }}>
      <div className="gt-plan-cabecera">
        <div style={{ minWidth: 0 }}>
          <p className="gt-plan-nombre">{p.nombre ?? p.tipo}</p>
          <p className="gt-text-sm gt-text-muted" style={{ margin: 0 }}>{p.duracionDias} días</p>
        </div>
        {inactivo && <Pill tono="neutral" icono={Ban}>Deshabilitado</Pill>}
      </div>
      <p className="gt-plan-precio">{pesos(p.precio)}</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Pill tono={p.pasesMensuales ? 'info' : 'ok'} icono={Ticket}>{textoPases(p.pasesMensuales)}</Pill>
        <Pill tono="neutral" icono={Users}>{p.sociosActivos} {p.sociosActivos === 1 ? 'socio activo' : 'socios activos'}</Pill>
      </div>
      {p.incluye && <p className="gt-text-sm gt-text-muted" style={{ margin: '10px 0 0', lineHeight: 1.5 }}>{p.incluye}</p>}
      {admin && (
        <div className="gt-plan-acciones">
          {inactivo ? (
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={onActivo}><RotateCcw size={14} aria-hidden /> Volver a ofrecer</button>
          ) : (
            <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={onEditar}><Pencil size={14} aria-hidden /> Editar</button>
          )}
          <span style={{ flex: 1 }} />
          {!inactivo && <IconButton icono={Ban} etiqueta="Deshabilitar plan" onClick={onDeshabilitar} />}
          {!p.usado && <IconButton icono={Trash2} etiqueta="Borrar plan" tono="danger" onClick={onBorrar} />}
        </div>
      )}
    </article>
  )
}

export default function MembresiasList() {
  const m = useMembresiasList()

  return (
    <>
      <PageHeader titulo="Planes de membresía"
        subtitulo="Cada socio tiene una sola membresía: al cobrarle un plan se activa, o se extiende si sigue vigente."
        acciones={<>
          <Link to="/pagos/nuevo" className="gt-btn gt-btn-secondary"><Wallet size={16} aria-hidden /> Cobrar plan</Link>
          {m.isAdmin && <Link to="/membresias/nueva" className="gt-btn gt-btn-primary"><Plus size={16} aria-hidden /> Nuevo plan</Link>}
        </>} />

      {m.error && <div className="gt-alert gt-alert-error">{m.error}</div>}

      {m.cargando ? <SkeletonTarjetas cantidad={4} alto={190} /> : m.planes.length === 0 ? (
        <div className="gt-card"><EmptyState icono={IdCard} titulo="No hay planes" texto="Creá el primero para poder cobrar."
          accion={m.isAdmin && <Link to="/membresias/nueva" className="gt-btn gt-btn-primary">Crear plan</Link>} /></div>
      ) : (
        <>
          <div className="gt-planes">
            {m.activos.map(p => (
              <TarjetaPlan key={p.tipo} p={p} admin={m.isAdmin} onEditar={() => m.iniciarEdicion(p)} onActivo={() => m.cambiarActivo(p, true)}
                onDeshabilitar={() => m.setConfirmar({ plan: p, accion: 'deshabilitar' })} onBorrar={() => m.setConfirmar({ plan: p, accion: 'borrar' })} />
            ))}
          </div>
          {m.deshabilitados.length > 0 && (
            <>
              <p className="gt-subtitulo" style={{ margin: '24px 0 10px' }}>Deshabilitados · no se ofrecen al cobrar</p>
              <div className="gt-planes">
                {m.deshabilitados.map(p => (
                  <TarjetaPlan key={p.tipo} p={p} admin={m.isAdmin} onEditar={() => m.iniciarEdicion(p)} onActivo={() => m.cambiarActivo(p, true)}
                    onDeshabilitar={() => {}} onBorrar={() => m.setConfirmar({ plan: p, accion: 'borrar' })} />
                ))}
              </div>
            </>
          )}
          <p className="gt-hint" style={{ marginTop: 16 }}>
            Los <strong>pases</strong> son los días por mes que puede venir el socio; se reinician cada mes desde que empezó.
            Un plan que ya usó algún socio no se puede borrar: se deshabilita y quien lo tiene lo sigue usando hasta que venza.
          </p>
        </>
      )}

      {m.editando && (
        <Modal titulo="Editar plan" onCerrar={() => m.setEditando(null)} ancho={520}
          pie={<>
            <button type="button" className="gt-btn gt-btn-secondary" onClick={() => m.setEditando(null)}>Cancelar</button>
            <button type="submit" form="form-plan" className="gt-btn gt-btn-primary" disabled={m.guardando}>{m.guardando ? 'Guardando…' : 'Guardar'}</button>
          </>}>
          <form id="form-plan" onSubmit={e => { e.preventDefault(); m.guardarPlan() }}>
            <div className="gt-form-grid">
              <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="gt-label" htmlFor="plan-nombre">Nombre</label>
                <input id="plan-nombre" className="gt-input" value={m.editando.nombre} maxLength={100} autoFocus
                  onChange={e => m.setEditando({ ...m.editando!, nombre: e.target.value })} />
              </div>
              <div className="gt-form-group">
                <label className="gt-label" htmlFor="plan-precio">Precio ($)</label>
                <input id="plan-precio" className="gt-input" type="number" min={1} value={m.editando.precio}
                  onChange={e => m.setEditando({ ...m.editando!, precio: e.target.value })} />
              </div>
              <div className="gt-form-group">
                <label className="gt-label" htmlFor="plan-pases">Pases por mes</label>
                <input id="plan-pases" className="gt-input" type="number" min={1} value={m.editando.pases} placeholder="Vacío = pase libre"
                  onChange={e => m.setEditando({ ...m.editando!, pases: e.target.value })} />
              </div>
              <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="gt-label" htmlFor="plan-incluye">¿Qué incluye?</label>
                <textarea id="plan-incluye" className="gt-textarea" rows={2} maxLength={255} value={m.editando.incluye}
                  onChange={e => m.setEditando({ ...m.editando!, incluye: e.target.value })} />
              </div>
            </div>
            <p className="gt-hint" style={{ margin: 0 }}>Los cambios aplican cuando cada socio renueva: lo que ya pagaron no cambia.</p>
          </form>
        </Modal>
      )}

      <ConfirmModal open={!!m.confirmar} danger
        title={m.confirmar?.accion === 'borrar' ? 'Borrar plan' : 'Deshabilitar plan'}
        confirmLabel={m.confirmar?.accion === 'borrar' ? 'Borrar' : 'Deshabilitar'}
        message={!m.confirmar ? '' : m.confirmar.accion === 'borrar'
          ? `¿Borrar "${m.confirmar.plan.nombre}"? Nadie lo usó, así que no afecta a ningún socio.`
          : `"${m.confirmar.plan.nombre}" deja de ofrecerse al cobrar.${m.confirmar.plan.sociosActivos > 0 ? ` Los ${m.confirmar.plan.sociosActivos} socios que lo tienen lo siguen usando hasta que venza.` : ''} Lo podés volver a habilitar cuando quieras.`}
        onConfirm={m.confirmarAccion} onCancel={() => m.setConfirmar(null)} />
    </>
  )
}
