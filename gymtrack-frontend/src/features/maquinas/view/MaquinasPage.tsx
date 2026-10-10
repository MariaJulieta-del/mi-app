import { useEffect, useMemo, useState } from 'react'
import { Cog, Plus, Wrench } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { PageHeader, Resumen, Segmentado } from '../../../shared/components/ui'
import { useToast } from '../../../shared/hooks/useToast'
import { useMaquinas } from '../hooks/useMaquinas'
import { useMantenimientos } from '../hooks/useMantenimientos'
import MisMaquinasTab, { type FiltroMaquinas } from '../components/tabs/MisMaquinasTab'
import MantenimientoTab from '../components/tabs/MantenimientoTab'
import MaquinaFormModal from '../components/MaquinaFormModal'
import MaquinaDetalleModal from '../components/MaquinaDetalleModal'
import ReportarModal from '../components/ReportarModal'
import MantenimientoFormModal from '../components/MantenimientoFormModal'
import { estadoMaquina, pendientesPorMaquina } from '../utils/estadoMaquina'
import type { Maquina } from '../types/Maquina'

type Tab = 'mis' | 'mantenimiento'

/** Qué muestra cada solapa */
const AYUDA_TAB: Record<Tab, string> = {
  mis: 'Las máquinas que tiene tu gimnasio: con su número, estado y los ejercicios que se hacen en cada una. Son las que aparecen al armar rutinas.',
  mantenimiento: 'Fallas reportadas, revisiones y arreglos hechos, con lo que costó cada uno.',
}

/**
 * Máquinas del gimnasio: estado de cada una (operativa / con falla), número visible,
 * ejercicios que se hacen en ella y su historial de arreglos.
 */
export default function MaquinasPage() {
  const [tab, setTab] = useState<Tab>('mis')
  const [filtro, setFiltro] = useState<FiltroMaquinas>('todas')
  const [detalleId, setDetalleId] = useState<number | null>(null)
  /** Máquina a deshabilitar o eliminar (se confirma antes) */
  const [confirmar, setConfirmar] = useState<{ accion: 'deshabilitar' | 'eliminar'; maquina: Maquina } | null>(null)
  const pedirToggle = (m: Maquina) => (m.activa ? setConfirmar({ accion: 'deshabilitar', maquina: m }) : maq.toggleActiva(m))
  const pedirEliminar = (m: Maquina) => setConfirmar({ accion: 'eliminar', maquina: m })
  const confirmarAccion = async () => {
    if (!confirmar) return
    const { accion, maquina } = confirmar
    setConfirmar(null)
    if (accion === 'deshabilitar') { await maq.toggleActiva(maquina); return }
    const error = await maq.eliminar(maquina)
    if (error) toast.error('No se eliminó', error)
    else if (detalleId === maquina.id) setDetalleId(null)
  }
  const toast = useToast()
  const mant = useMantenimientos()
  const maq = useMaquinas(mant.cargarMantenimientos)

  // Los avisos de los hooks salen como notificación, no como cartel fijo
  useEffect(() => { if (maq.msg) { toast.success(maq.msg); maq.setMsg(null) } }, [maq.msg]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (mant.mantMsg) { toast.success(mant.mantMsg); mant.setMantMsg(null) } }, [mant.mantMsg]) // eslint-disable-line react-hooks/exhaustive-deps

  const pendientes = useMemo(() => pendientesPorMaquina(mant.mantenimientos), [mant.mantenimientos])
  const activas = maq.maquinas.filter(m => m.activa)
  const conProblema = activas.filter(m => estadoMaquina(m, pendientes.get(m.id!)) !== 'operativa').length
  const sinNumero = activas.filter(m => !(m.nroMaquina ?? '').trim()).length
  const sinEjercicios = activas.filter(m => maq.ejerciciosDe(m.id!).length === 0).length
  const anio = String(new Date().getFullYear())
  const gastoAnio = mant.mantenimientos
    .filter(m => (m.fechaMantenimiento ?? m.fechaCreacion ?? '').startsWith(anio))
    .reduce((s, m) => s + Number(m.costo ?? 0), 0)

  const verFiltro = (f: FiltroMaquinas) => { setTab('mis'); setFiltro(prev => (prev === f ? 'todas' : f)) }
  const detalle = maq.maquinas.find(m => m.id === detalleId) ?? null
  const reportando = maq.maquinas.find(m => m.id === maq.reportarId) ?? null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader titulo="Máquinas" subtitulo="Estado del equipamiento, números y arreglos"
        acciones={tab === 'mantenimiento'
          ? <button type="button" className="gt-btn gt-btn-primary" onClick={mant.abrirNuevoMant}><Wrench size={16} aria-hidden /> Registrar mantenimiento</button>
          : <button type="button" className="gt-btn gt-btn-primary" onClick={maq.abrirNuevo}><Plus size={16} aria-hidden /> Nueva máquina</button>} />

      {maq.error && <div className="gt-alert gt-alert-error">{maq.error}</div>}
      {mant.mantError && !mant.mantShowForm && <div className="gt-alert gt-alert-error">{mant.mantError}</div>}

      {!maq.cargando && activas.length > 0 && (
        <Resumen items={[
          { valor: activas.length, texto: 'máquinas en uso' },
          { valor: conProblema, texto: conProblema === 1 ? 'con falla o revisión' : 'con falla o revisión', tono: conProblema ? 'danger' : 'ok', onClick: () => verFiltro('falla'), activo: tab === 'mis' && filtro === 'falla' },
          { valor: sinNumero, texto: 'sin número cargado', tono: sinNumero ? 'warn' : 'ok', onClick: () => verFiltro('sinNumero'), activo: tab === 'mis' && filtro === 'sinNumero' },
          { valor: sinEjercicios, texto: 'sin ejercicios asociados', tono: sinEjercicios ? 'warn' : 'ok', onClick: () => verFiltro('sinEjercicios'), activo: tab === 'mis' && filtro === 'sinEjercicios' },
          { valor: `$${Math.round(gastoAnio).toLocaleString('es-AR')}`, texto: `gastado en arreglos (${anio})` },
        ]} />
      )}

      <div style={{ marginBottom: 14 }}>
        <Segmentado etiqueta="Sección" valor={tab} onChange={setTab} opciones={[
          { valor: 'mis', texto: 'Mis máquinas', icono: Cog, cuenta: maq.cargando ? undefined : activas.length },
          { valor: 'mantenimiento', texto: 'Mantenimiento', icono: Wrench, cuenta: mant.mantCargando ? undefined : mant.mantenimientos.filter(m => m.tipo === 'PENDIENTE').length },
        ]} />
        <p className="gt-tab-ayuda">{AYUDA_TAB[tab]}</p>
      </div>

      {tab === 'mis' && (
        <MisMaquinasTab maq={maq} pendientes={pendientes} filtro={filtro} setFiltro={setFiltro}
          onAbrir={setDetalleId} onToggleActiva={pedirToggle} onEliminar={pedirEliminar} />
      )}
      {tab === 'mantenimiento' && (
        <MantenimientoTab mant={mant} maquinas={maq.maquinas} onEliminar={id => mant.setConfirmarEliminarMantId(id)} />
      )}

      {/* Ventanas */}
      {detalle && (
        <MaquinaDetalleModal maquina={detalle} estado={estadoMaquina(detalle, pendientes.get(detalle.id!))}
          mantenimientos={mant.mantenimientos.filter(r => r.maquinaId === detalle.id)}
          ejercicios={maq.ejercicios}
          onCerrar={() => setDetalleId(null)}
          onEditar={() => { setDetalleId(null); maq.abrirEditar(detalle) }}
          onReportar={() => { setDetalleId(null); maq.abrirReportar(detalle.id!) }}
          onToggleActiva={() => pedirToggle(detalle)}
          onEliminar={() => pedirEliminar(detalle)}
          onMarcarRealizado={mant.marcarRealizado}
          onCambioEjercicios={maq.cargar} />
      )}
      {maq.showForm && (
        <MaquinaFormModal editando={maq.editandoId !== null} form={maq.form} setForm={maq.setForm} toggleGrupo={maq.toggleGrupoForm}
          guardando={maq.guardando} error={maq.error} onGuardar={maq.guardar} onCerrar={maq.cancelar} />
      )}
      {reportando && maq.reportarTipo && (
        <ReportarModal maquina={reportando} tipo={maq.reportarTipo} setTipo={maq.setReportarTipo}
          descripcion={maq.reportarDesc} setDescripcion={maq.setReportarDesc} costo={maq.reportarCosto} setCosto={maq.setReportarCosto}
          guardando={maq.reportarGuardando} error={maq.reportarError} onGuardar={maq.submitReportar} onCerrar={maq.cerrarReportar} />
      )}
      {mant.mantShowForm && (
        <MantenimientoFormModal maquinas={maq.maquinas} form={mant.mantForm} setForm={mant.setMantForm} editando={mant.mantEditId !== null}
          guardando={mant.mantGuardando} error={mant.mantError} onGuardar={mant.guardarMant} onCerrar={mant.cancelarMant} />
      )}

      <ConfirmModal
        open={confirmar !== null}
        title={confirmar?.accion === 'eliminar' ? `Eliminar "${confirmar.maquina.nombre}"` : `Deshabilitar "${confirmar?.maquina.nombre ?? ''}"`}
        message={confirmar?.accion === 'eliminar'
          ? 'Se borra para siempre y se saca de los ejercicios que la usaban. Si tiene arreglos registrados no se puede eliminar (se perdería el historial y lo gastado): en ese caso deshabilitala.'
          : 'Deja de aparecer al armar rutinas y en el listado, pero se guarda su historial. La podés volver a habilitar cuando quieras desde "Ver deshabilitadas".'}
        confirmLabel={confirmar?.accion === 'eliminar' ? 'Eliminar' : 'Deshabilitar'} cancelLabel="Cancelar" danger={confirmar?.accion === 'eliminar'}
        onConfirm={confirmarAccion}
        onCancel={() => setConfirmar(null)}
      />
      <ConfirmModal
        open={mant.confirmarEliminarMantId !== null}
        title="Eliminar registro"
        message="Se borra este registro de mantenimiento y deja de contar en el historial de la máquina."
        confirmLabel="Eliminar" cancelLabel="Cancelar" danger
        onConfirm={() => { const id = mant.confirmarEliminarMantId!; mant.setConfirmarEliminarMantId(null); mant.eliminarMant(id) }}
        onCancel={() => mant.setConfirmarEliminarMantId(null)}
      />
    </div>
  )
}
