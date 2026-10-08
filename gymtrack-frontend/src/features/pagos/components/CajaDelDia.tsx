import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Lock, Plus, Receipt, Trash2, Wallet } from 'lucide-react'
import { obtenerResumen, cerrarCaja, cierresPendientes } from '../services/cierreCajaService'
import { listarEgresos, registrarEgreso, eliminarEgreso } from '../services/egresoService'
import type { CierreCajaResumen } from '../types/CierreCaja'
import type { CategoriaEgreso, Egreso } from '../types/Egreso'
import { CATEGORIAS_GASTO, METODOS, pesos, textoDiferencia, totalArqueo } from '../utils/dinero'
import ArqueoBilletes from './ArqueoBilletes'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { IconButton, Pill, Skeleton } from '../../../shared/components/ui'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'
import { fechaLocalISO, formatFecha } from '../../../shared/utils/fechas'

const moverDia = (iso: string, dias: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  return fechaLocalISO(new Date(y, m - 1, d + dias))
}
const nombreDia = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Caja del día, en el orden en que se usa:
 * 1) cuánto efectivo debería haber, 2) cobros por medio de pago, 3) gastos pagados con la caja,
 * 4) contar y cerrar (diferencia en vivo + cuánto queda para mañana).
 */
export default function CajaDelDia({ fechaInicial, onVerPagos }: { fechaInicial?: string; onVerPagos: (fecha: string) => void }) {
  const toast = useToast()
  const hoy = fechaLocalISO()
  const [fecha, setFecha] = useState(fechaInicial ?? hoy)
  const [resumen, setResumen] = useState<CierreCajaResumen | null>(null)
  const [gastos, setGastos] = useState<Egreso[]>([])
  const [pendientes, setPendientes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Gasto nuevo
  const [gDesc, setGDesc] = useState('')
  const [gMonto, setGMonto] = useState('')
  const [gCat, setGCat] = useState<CategoriaEgreso>('VARIOS')
  const [guardandoGasto, setGuardandoGasto] = useState(false)
  const [borrar, setBorrar] = useState<Egreso | null>(null)

  // Cierre
  const [porBilletes, setPorBilletes] = useState(false)
  const [billetes, setBilletes] = useState<Record<number, string>>({})
  const [contadoTexto, setContadoTexto] = useState('')
  const [dejaTexto, setDejaTexto] = useState<string | null>(null)
  const [obs, setObs] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  const [cerrando, setCerrando] = useState(false)

  const cargar = useCallback((dia: string) => {
    Promise.all([obtenerResumen(dia), listarEgresos(dia, dia)])
      .then(([r, g]) => { setResumen(r); setGastos(g); setError(null) })
      .catch(() => setError('No se pudo cargar la caja de ese día'))
    cierresPendientes().then(setPendientes).catch(() => {})
  }, [])

  useEffect(() => { cargar(fecha) }, [fecha, cargar])

  const irA = (dia: string) => {
    setResumen(null)
    setFecha(dia)
    setBilletes({}); setContadoTexto(''); setDejaTexto(null); setObs(''); setPorBilletes(false)
  }

  const contado = porBilletes ? totalArqueo(billetes) : (contadoTexto === '' ? null : Number(contadoTexto))
  const diferencia = resumen && contado != null ? contado - Number(resumen.balanceCalculado) : null
  const dif = textoDiferencia(diferencia)
  // Por defecto se deja el mismo cambio con el que se arrancó (si alcanza)
  const dejaSugerido = resumen ? Math.min(Number(resumen.fondoInicial), Math.max(0, contado ?? Number(resumen.balanceCalculado))) : 0
  const deja = dejaTexto == null ? dejaSugerido : Number(dejaTexto || 0)
  const hay = contado ?? Math.max(0, Number(resumen?.balanceCalculado ?? 0))
  const retiro = Math.max(0, hay - deja)
  const faltaNota = diferencia != null && Math.abs(diferencia) >= 0.5 && !obs.trim()
  const dejaInvalido = deja < 0 || deja > hay

  const porMetodo = useMemo(() => {
    if (!resumen) return []
    const valores = [Number(resumen.totalEfectivo), Number(resumen.totalTarjeta), Number(resumen.totalTransferencia)]
    const total = Math.max(1, valores.reduce((a, b) => a + b, 0))
    return METODOS.map((m, i) => ({ ...m, monto: valores[i], pct: Math.round((valores[i] / total) * 100) }))
  }, [resumen])

  const agregarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    const monto = Number(gMonto)
    if (!gDesc.trim() || !(monto > 0)) { toast.error('Faltan datos', 'Poné qué se pagó y el monto'); return }
    setGuardandoGasto(true)
    try {
      await registrarEgreso({ fecha, descripcion: gDesc.trim(), monto, categoria: gCat })
      setGDesc(''); setGMonto('')
      toast.success('Gasto registrado', `${gDesc.trim()} · ${pesos(monto)}`)
      cargar(fecha)
    } catch (err) {
      toast.error('No se pudo registrar', mensajeError(err, 'Error al registrar el gasto'))
    } finally { setGuardandoGasto(false) }
  }

  const quitarGasto = async () => {
    if (!borrar) return
    const g = borrar
    setBorrar(null)
    try { await eliminarEgreso(g.id); cargar(fecha) }
    catch (err) { toast.error('No se pudo borrar', mensajeError(err, 'Error al borrar el gasto')) }
  }

  const cerrar = async () => {
    setConfirmar(false)
    setCerrando(true)
    try {
      await cerrarCaja({ fecha, montoContado: contado ?? undefined, dejaEnCaja: deja, observaciones: obs.trim() || undefined })
      toast.success('Caja cerrada', `${formatFecha(fecha)} · ${contado == null ? 'sin contar' : dif.texto.toLowerCase()}`)
      irA(fecha)
    } catch (err) {
      toast.error('No se pudo cerrar', mensajeError(err, 'Error al cerrar la caja'))
    } finally { setCerrando(false) }
  }

  const otrosPendientes = pendientes.filter(p => p !== fecha)

  return (
    <>
      {/* Navegación por día */}
      <div className="gt-caja-nav">
        <IconButton icono={ChevronLeft} etiqueta="Día anterior" onClick={() => irA(moverDia(fecha, -1))} />
        <div style={{ minWidth: 0 }}>
          <strong className="gt-caja-fecha">{fecha === hoy ? 'Hoy' : nombreDia(fecha)}</strong>
          {fecha === hoy && <span className="gt-text-muted gt-text-sm"> · {nombreDia(fecha)}</span>}
        </div>
        <IconButton icono={ChevronRight} etiqueta="Día siguiente" disabled={fecha >= hoy} onClick={() => irA(moverDia(fecha, 1))} />
        {fecha !== hoy && <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => irA(hoy)}>Ir a hoy</button>}
        <input type="date" className="gt-input" style={{ width: 'auto', marginLeft: 'auto' }} max={hoy} value={fecha}
          onChange={e => e.target.value && irA(e.target.value)} aria-label="Elegir día" />
        {resumen && (resumen.cerrada ? <Pill tono="ok" icono={Lock}>Cerrada</Pill> : <Pill tono="info">Abierta</Pill>)}
      </div>

      {otrosPendientes.length > 0 && (
        <div className="gt-caja-pendientes" role="status">
          <AlertTriangle size={16} aria-hidden />
          <span>Quedaron cajas sin cerrar:</span>
          {otrosPendientes.map(p => (
            <button key={p} type="button" className="gt-filtro-chip" onClick={() => irA(p)}>{formatFecha(p)}</button>
          ))}
        </div>
      )}

      {error && <div className="gt-alert gt-alert-error">{error}</div>}
      {!resumen ? (!error && <div className="gt-caja-grid"><Skeleton alto={200} radio={12} /><Skeleton alto={200} radio={12} /></div>) : (
        <>
          <div className="gt-caja-grid">
            {/* 1. Efectivo */}
            <section className="gt-card">
              <p className="gt-card-title" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={18} aria-hidden /> Efectivo en caja</p>
              <div className="gt-caja-cuenta">
                <div><span>Cambio inicial</span><span>{pesos(resumen.fondoInicial)}</span></div>
                <div><span>+ Cobros en efectivo</span><span>{pesos(resumen.totalEfectivo)}</span></div>
                <div><span>− Gastos pagados con la caja</span><span>{pesos(resumen.totalEgresos)}</span></div>
                <div className="total"><span>Debería haber</span><strong>{pesos(resumen.balanceCalculado)}</strong></div>
              </div>
              {Number(resumen.fondoInicial) === 0 && !resumen.cerrada && (
                <p className="gt-text-sm gt-text-muted" style={{ margin: '8px 0 0' }}>El cambio inicial sale de lo que se dejó en la caja en el cierre anterior.</p>
              )}
            </section>

            {/* 2. Cobros por medio */}
            <section className="gt-card">
              <div className="gt-card-cabecera">
                <p className="gt-card-title" style={{ margin: 0 }}>Cobros del día</p>
                <span className="gt-numero-destacado">{pesos(resumen.totalIngresos)}</span>
              </div>
              {porMetodo.map(m => (
                <div key={m.valor} className="gt-caja-metodo">
                  <span>{m.texto}</span>
                  <div className="gt-barra-pct"><div style={{ width: `${m.pct}%` }} /></div>
                  <strong>{pesos(m.monto)}</strong>
                </div>
              ))}
              <button type="button" className="gt-btn-link gt-text-sm" style={{ marginTop: 8 }} onClick={() => onVerPagos(fecha)}>
                Ver los {resumen.cantidadPagos} {resumen.cantidadPagos === 1 ? 'pago' : 'pagos'} del día →
              </button>
            </section>
          </div>

          {/* 3. Gastos */}
          <section className="gt-card" style={{ marginBottom: 16 }}>
            <p className="gt-card-title" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={18} aria-hidden /> Gastos pagados con la caja
              {gastos.length > 0 && <span className="gt-text-muted" style={{ fontWeight: 500 }}>· {pesos(resumen.totalEgresos)}</span>}
            </p>
            {gastos.length === 0 && <p className="gt-text-sm gt-text-muted" style={{ margin: '0 0 10px' }}>No hubo gastos {fecha === hoy ? 'hoy' : 'ese día'}.</p>}
            {gastos.map(g => (
              <div key={g.id} className="gt-hoy-fila">
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: 14 }}>{g.descripcion}</strong>
                  <span className="gt-text-sm gt-text-muted"> · {CATEGORIAS_GASTO.find(c => c.valor === g.categoria)?.texto ?? g.categoria}{g.registradoPor ? ` · ${g.registradoPor}` : ''}</span>
                </span>
                <strong>{pesos(g.monto)}</strong>
                {!resumen.cerrada && <IconButton icono={Trash2} etiqueta="Borrar gasto" tono="danger" onClick={() => setBorrar(g)} />}
              </div>
            ))}
            {!resumen.cerrada && (
              <form className="gt-caja-gasto" onSubmit={agregarGasto}>
                <input className="gt-input" placeholder="Qué se pagó (ej: artículos de limpieza)" value={gDesc} onChange={e => setGDesc(e.target.value)} aria-label="Descripción del gasto" maxLength={200} />
                <input className="gt-input" type="number" inputMode="decimal" min={0} step="0.01" placeholder="$ Monto" value={gMonto} onChange={e => setGMonto(e.target.value)} aria-label="Monto del gasto" />
                <select className="gt-select" value={gCat} onChange={e => setGCat(e.target.value as CategoriaEgreso)} aria-label="Categoría">
                  {CATEGORIAS_GASTO.map(c => <option key={c.valor} value={c.valor}>{c.texto}</option>)}
                </select>
                <button type="submit" className="gt-btn gt-btn-secondary" disabled={guardandoGasto}><Plus size={16} aria-hidden /> Agregar</button>
              </form>
            )}
          </section>

          {/* 4. Cierre */}
          {resumen.cerrada ? (
            <section className="gt-card gt-caja-cerrada">
              <p className="gt-card-title" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={18} aria-hidden /> Caja cerrada</p>
              <div className="gt-indicadores">
                <div><strong>{pesos(resumen.montoContado ?? null)}</strong><span>contado</span><small>debía haber {pesos(resumen.balanceCalculado)}</small></div>
                <div><strong className={`gt-dif ${textoDiferencia(resumen.diferencia).tono}`}>{textoDiferencia(resumen.diferencia).texto}</strong><span>diferencia</span></div>
                <div><strong>{pesos(resumen.dejaEnCaja ?? 0)}</strong><span>quedó de cambio</span><small>para el día siguiente</small></div>
                <div><strong>{pesos(resumen.retiro ?? null)}</strong><span>se retiró</span></div>
              </div>
              <p className="gt-text-sm gt-text-muted" style={{ margin: '10px 0 0' }}>
                {resumen.creadoPor ? `Cerró ${resumen.creadoPor}` : 'Cerrada'}
                {resumen.createdAt ? ` el ${new Date(resumen.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}
                {resumen.observaciones ? ` · “${resumen.observaciones}”` : ''}
              </p>
            </section>
          ) : (
            <section className="gt-card gt-caja-cierre">
              <div className="gt-card-cabecera">
                <p className="gt-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={18} aria-hidden /> Contar y cerrar</p>
                <label className="gt-check">
                  <input type="checkbox" checked={porBilletes} onChange={e => setPorBilletes(e.target.checked)} /> Contar por billetes
                </label>
              </div>

              <div className="gt-caja-cierre-grid">
                <div>
                  {porBilletes ? (
                    <>
                      <ArqueoBilletes cantidades={billetes} onChange={setBilletes} />
                      <p className="gt-caja-contado">Contaste <strong>{pesos(totalArqueo(billetes))}</strong></p>
                    </>
                  ) : (
                    <div className="gt-form-group">
                      <label className="gt-label" htmlFor="caja-contado">¿Cuánto efectivo hay en la caja?</label>
                      <input id="caja-contado" className="gt-input gt-input-grande" type="number" inputMode="decimal" min={0} step="0.01"
                        placeholder={`Debería haber ${pesos(resumen.balanceCalculado)}`} value={contadoTexto} onChange={e => setContadoTexto(e.target.value)} />
                      <span className="gt-hint">Si no lo contás, se cierra sin controlar la diferencia.</span>
                    </div>
                  )}
                </div>

                <div className="gt-caja-cierre-resultado">
                  <div className={`gt-dif-grande ${dif.tono}`}>
                    <span>Diferencia</span>
                    <strong>{dif.texto}</strong>
                  </div>
                  <div className="gt-form-group">
                    <label className="gt-label" htmlFor="caja-deja">Dejar de cambio para mañana</label>
                    <input id="caja-deja" className={`gt-input${dejaInvalido ? ' gt-input-error' : ''}`} type="number" inputMode="decimal" min={0} step="0.01"
                      value={dejaTexto ?? String(dejaSugerido)} onChange={e => setDejaTexto(e.target.value)} />
                    {dejaInvalido
                      ? <span className="gt-field-error">Tiene que ser entre $0 y {pesos(hay)}</span>
                      : <span className="gt-hint">Retirás {pesos(retiro)}</span>}
                  </div>
                  <div className="gt-form-group">
                    <label className="gt-label" htmlFor="caja-obs">Nota {diferencia != null && Math.abs(diferencia) >= 0.5 && <span style={{ color: 'var(--red)' }}>*</span>}</label>
                    <input id="caja-obs" className={`gt-input${faltaNota ? ' gt-input-error' : ''}`} value={obs} onChange={e => setObs(e.target.value)}
                      placeholder={faltaNota ? 'Contá por qué no cuadra' : 'Opcional'} maxLength={300} />
                  </div>
                  <button type="button" className="gt-btn gt-btn-primary" style={{ width: '100%' }}
                    disabled={cerrando || faltaNota || dejaInvalido} onClick={() => setConfirmar(true)}>
                    <Lock size={16} aria-hidden /> {cerrando ? 'Cerrando…' : `Cerrar caja ${fecha === hoy ? 'de hoy' : `del ${formatFecha(fecha)}`}`}
                  </button>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <ConfirmModal open={!!borrar} title="Borrar gasto" danger confirmLabel="Borrar"
        message={borrar ? `¿Borrar “${borrar.descripcion}” (${pesos(borrar.monto)})?` : ''}
        onConfirm={quitarGasto} onCancel={() => setBorrar(null)} />
      <ConfirmModal open={confirmar} title="Cerrar caja" confirmLabel="Cerrar caja"
        message={`${contado == null ? 'Se cierra sin contar el efectivo.' : `Contaste ${pesos(contado)} (${dif.texto.toLowerCase()}).`} Quedan ${pesos(deja)} de cambio y retirás ${pesos(retiro)}. Después de cerrar no se pueden cambiar los gastos de ese día.`}
        onConfirm={cerrar} onCancel={() => setConfirmar(false)} />
    </>
  )
}
