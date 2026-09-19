import { useState, useEffect, useMemo } from 'react'
import {
  listarMaquinas, crearMaquina, actualizarMaquina,
  desactivarMaquina, activarMaquina, type Maquina,
} from '../services/maquinaService'
import { listarTodosEjercicios, GRUPOS_CATEGORIAS, type Ejercicio } from '../../ejercicios/services/ejercicioService'
import { MACHINES_CATALOG, CATALOG_MACHINE_GROUPS, type CatalogMaquina } from '../assets/maquinasCatalog'
import {
  listarMantenimientos, crearMantenimiento, actualizarMantenimiento, eliminarMantenimiento,
} from '../services/mantenimientoService'
import type { Mantenimiento, MantenimientoRequest, TipoMantenimiento } from '../types/Mantenimiento'

// ── Constantes ─────────────────────────────────────────────────────
const VACIO: Omit<Maquina, 'id'> = {
  nroMaquina: '', nombre: '', descripcion: '',
  grupos: [], instruccionesUso: '', ajustes: '', activa: true,
}

const MANT_VACIO: MantenimientoRequest = {
  maquinaId: 0, tipo: 'PENDIENTE', descripcion: '',
  fechaMantenimiento: new Date().toISOString().slice(0, 10),
  tecnico: '', costo: undefined, observaciones: '',
}

type Tab = 'catalogo' | 'mis' | 'mantenimiento'

const TIPO_EMOJI: Record<string, string> = {
  'máquina': '⚙️',
  'polea': '🔄',
  'rack': '🏗️',
  'cardio': '🏃',
  'barra libre': '🏋️',
}

export default function MaquinasPage() {
  const [tab, setTab] = useState<Tab>('catalogo')

  // ── Estado "Mis máquinas" ──────────────────────────────────────────
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState<Omit<Maquina, 'id'>>({ ...VACIO })
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [verInactivas, setVerInactivas] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // ── Estado Mantenimiento ──────────────────────────────────────────
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [mantForm, setMantForm] = useState<MantenimientoRequest>({ ...MANT_VACIO })
  const [mantEditId, setMantEditId] = useState<number | null>(null)
  const [mantShowForm, setMantShowForm] = useState(false)
  const [mantGuardando, setMantGuardando] = useState(false)
  const [mantError, setMantError] = useState<string | null>(null)
  const [mantMsg, setMantMsg] = useState<string | null>(null)
  const [mantFiltroMaquina, setMantFiltroMaquina] = useState<number | 'todas'>('todas')
  const [mantFiltroTipo, setMantFiltroTipo] = useState<TipoMantenimiento | 'todos'>('todos')

  // ── Estado Catálogo ────────────────────────────────────────────────
  const [catGrupo, setCatGrupo] = useState('')
  const [catQ, setCatQ] = useState('')
  const [catQActivo, setCatQActivo] = useState('')
  const [guardandoCat, setGuardandoCat] = useState<string | null>(null)
  const [catError, setCatError] = useState<string | null>(null)

  const cargar = async () => {
    try {
      const [maks, ejs] = await Promise.all([listarMaquinas(false), listarTodosEjercicios()])
      setMaquinas(maks)
      setEjercicios(ejs.filter(e => !e.esMaquina))
    } catch { setError('Error al cargar') }
  }

  const cargarMantenimientos = async () => {
    try {
      setMantenimientos(await listarMantenimientos())
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? ''
      if (msg) setMantError('Error al cargar mantenimientos: ' + msg)
    }
  }

  useEffect(() => { cargar(); cargarMantenimientos() }, [])

  // Debounce para búsqueda en catálogo
  useEffect(() => {
    const t = setTimeout(() => setCatQActivo(catQ), 300)
    return () => clearTimeout(t)
  }, [catQ])

  // ── Ejercicios compatibles con grupos de una máquina ──────────────
  const ejerciciosCompatibles = (grupos: string[]): Ejercicio[] => {
    if (!grupos || grupos.length === 0) return []
    return ejercicios.filter(e =>
      e.activo && (e.grupos ?? []).some(g => grupos.includes(g))
    )
  }

  // ── Máquinas ya guardadas (por nombre) ────────────────────────────
  const nombresGuardados = useMemo(
    () => new Set(maquinas.map(m => m.nombre.toLowerCase())),
    [maquinas]
  )

  // ── Filtrado del catálogo estático ────────────────────────────────
  const catFiltradas = useMemo(() => {
    return MACHINES_CATALOG.filter(m => {
      const matchGrupo = !catGrupo || m.grupos.includes(catGrupo)
      const matchQ = !catQActivo || m.nombre.toLowerCase().includes(catQActivo.toLowerCase())
      return matchGrupo && matchQ
    })
  }, [catGrupo, catQActivo])

  // Count por grupo para los chips
  const countPorGrupo = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const g of CATALOG_MACHINE_GROUPS) {
      counts[g] = MACHINES_CATALOG.filter(m => m.grupos.includes(g)).length
    }
    return counts
  }, [])

  // ── Guardar del catálogo → base de datos ──────────────────────────
  const guardarDeCatalogo = async (cat: CatalogMaquina) => {
    setGuardandoCat(cat.id)
    setCatError(null)
    try {
      await crearMaquina({
        nroMaquina: '',
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        grupos: [...cat.grupos],
        instruccionesUso: cat.instruccionesUso,
        ajustes: cat.ajustes,
        activa: true,
      })
      setMsg(`"${cat.nombre}" guardada en Mis máquinas.`)
      await cargar()
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? 'Error al guardar'
      setCatError(msg)
    } finally {
      setGuardandoCat(null)
    }
  }

  // ── Mis máquinas: filtro ──────────────────────────────────────────
  const filtradas = maquinas.filter(m => {
    if (!verInactivas && !m.activa) return false
    const matchBusq = m.nombre.toLowerCase().includes(busqueda.toLowerCase())
      || (m.nroMaquina ?? '').toLowerCase().includes(busqueda.toLowerCase())
    const matchGrupo = !filtroGrupo || (m.grupos ?? []).includes(filtroGrupo)
    return matchBusq && matchGrupo
  })

  // ── Form helpers ──────────────────────────────────────────────────
  const abrirNuevo = () => {
    setForm({ ...VACIO }); setEditandoId(null); setShowForm(true); setError(null); setExpandedId(null)
    setTimeout(() => document.getElementById('maq-nro')?.focus(), 50)
  }
  const abrirEditar = (m: Maquina) => {
    setForm({ nroMaquina: m.nroMaquina, nombre: m.nombre, descripcion: m.descripcion ?? '',
      grupos: m.grupos ? [...m.grupos] : [], instruccionesUso: m.instruccionesUso ?? '',
      ajustes: m.ajustes ?? '', activa: m.activa })
    setEditandoId(m.id!); setShowForm(true); setError(null); setExpandedId(null)
  }
  const cancelar = () => { setShowForm(false); setForm({ ...VACIO }); setEditandoId(null) }

  const toggleGrupoForm = (g: string) =>
    setForm(f => ({
      ...f,
      grupos: (f.grupos ?? []).includes(g)
        ? (f.grupos ?? []).filter(x => x !== g)
        : [...(f.grupos ?? []), g],
    }))

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError(null)
    try {
      if (editandoId) { await actualizarMaquina(editandoId, form); setMsg('Máquina actualizada.') }
      else { await crearMaquina(form); setMsg('Máquina creada.') }
      cancelar(); await cargar()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al guardar')
    } finally { setGuardando(false) }
  }

  const toggleActiva = async (m: Maquina) => {
    try {
      if (m.activa) await desactivarMaquina(m.id!)
      else await activarMaquina(m.id!)
      await cargar()
    } catch { setError('Error al cambiar estado') }
  }

  // ── Mantenimiento: helpers ────────────────────────────────────────
  const abrirNuevoMant = () => {
    setMantForm({ ...MANT_VACIO })
    setMantEditId(null)
    setMantShowForm(true)
    setMantError(null)
  }
  const abrirEditarMant = (m: Mantenimiento) => {
    setMantForm({
      maquinaId: m.maquinaId,
      tipo: m.tipo,
      descripcion: m.descripcion,
      fechaMantenimiento: m.fechaMantenimiento ?? new Date().toISOString().slice(0, 10),
      tecnico: m.tecnico ?? '',
      costo: m.costo,
      observaciones: m.observaciones ?? '',
    })
    setMantEditId(m.id!)
    setMantShowForm(true)
    setMantError(null)
  }
  const cancelarMant = () => { setMantShowForm(false); setMantForm({ ...MANT_VACIO }); setMantEditId(null) }

  const guardarMant = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!mantForm.maquinaId) { setMantError('Seleccioná una máquina'); return }
    if (!mantForm.descripcion.trim()) { setMantError('La descripción es obligatoria'); return }
    setMantGuardando(true); setMantError(null)
    try {
      if (mantEditId) {
        await actualizarMantenimiento(mantEditId, mantForm)
        setMantMsg('Mantenimiento actualizado.')
      } else {
        await crearMantenimiento(mantForm)
        setMantMsg('Mantenimiento registrado.')
      }
      cancelarMant()
      await cargarMantenimientos()
    } catch (e: any) {
      setMantError(e?.response?.data?.error ?? 'Error al guardar')
    } finally { setMantGuardando(false) }
  }

  const eliminarMant = async (id: number) => {
    if (!confirm('¿Eliminar este registro de mantenimiento?')) return
    try {
      await eliminarMantenimiento(id)
      setMantMsg('Registro eliminado.')
      await cargarMantenimientos()
    } catch (e: any) {
      setMantError(e?.response?.data?.error ?? 'Error al eliminar')
    }
  }

  const mantFiltrados = useMemo(() => {
    return mantenimientos.filter(m => {
      const matchMaq = mantFiltroMaquina === 'todas' || m.maquinaId === mantFiltroMaquina
      const matchTipo = mantFiltroTipo === 'todos' || m.tipo === mantFiltroTipo
      return matchMaq && matchTipo
    })
  }, [mantenimientos, mantFiltroMaquina, mantFiltroTipo])

  // ── Estilos de tab ────────────────────────────────────────────────
  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: '8px 8px 0 0', fontSize: 14, fontWeight: tab === t ? 700 : 500,
    border: '1.5px solid', borderBottom: 'none', cursor: 'pointer', transition: 'all 0.1s',
    background: tab === t ? '#fff' : '#F9FAFB',
    color: tab === t ? '#78350F' : '#6B7280',
    borderColor: tab === t ? '#D97706' : '#E5E7EB',
  })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Máquinas</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            Equipamiento del gimnasio con seguimiento de mantenimiento
          </p>
        </div>
        {tab === 'mis' && (
          <button className="gt-btn gt-btn-primary" onClick={abrirNuevo}>+ Nueva máquina</button>
        )}
        {tab === 'mantenimiento' && (
          <button className="gt-btn gt-btn-primary" onClick={abrirNuevoMant}>+ Registrar mantenimiento</button>
        )}
      </div>

      {/* ── Mensaje de éxito / error global ── */}
      {msg && (
        <div className="gt-alert" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A', marginBottom: 12 }}>
          {msg}
          <button onClick={() => setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {error && tab === 'mis' && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {mantMsg && (
        <div className="gt-alert" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A', marginBottom: 12 }}>
          {mantMsg}
          <button onClick={() => setMantMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: -1, position: 'relative', zIndex: 1 }}>
        <button style={tabStyle('catalogo')} onClick={() => setTab('catalogo')}>
          📚 Catálogo ({MACHINES_CATALOG.length})
        </button>
        <button style={tabStyle('mis')} onClick={() => setTab('mis')}>
          ⭐ Mis máquinas ({maquinas.filter(m => m.activa).length})
        </button>
        <button style={tabStyle('mantenimiento')} onClick={() => setTab('mantenimiento')}>
          🔧 Mantenimiento ({mantenimientos.filter(m => m.tipo === 'PENDIENTE').length} pendientes)
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: CATÁLOGO ESTÁTICO
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'catalogo' && (
        <div style={{ border: '1.5px solid #D97706', borderRadius: '0 8px 8px 8px', background: '#fff', padding: 20 }}>

          {/* Error catálogo */}
          {catError && (
            <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
              {catError}
              <button onClick={() => setCatError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {/* Buscador */}
          <input
            className="gt-input"
            placeholder="Buscar máquina en el catálogo…"
            value={catQ}
            onChange={e => setCatQ(e.target.value)}
            style={{ marginBottom: 14, maxWidth: 380 }}
          />

          {/* Chips de grupo con conteo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            <button
              onClick={() => setCatGrupo('')}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1.5px solid',
                fontWeight: !catGrupo ? 700 : 400,
                background: !catGrupo ? '#D97706' : '#fff',
                color: !catGrupo ? '#fff' : '#374151',
                borderColor: !catGrupo ? '#D97706' : '#D1D5DB',
              }}>
              Todos ({MACHINES_CATALOG.length})
            </button>
            {CATALOG_MACHINE_GROUPS.filter(g => countPorGrupo[g] > 0).map(g => (
              <button key={g}
                onClick={() => setCatGrupo(g === catGrupo ? '' : g)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1.5px solid',
                  fontWeight: catGrupo === g ? 700 : 400,
                  background: catGrupo === g ? '#D97706' : '#FEF3C7',
                  color: catGrupo === g ? '#fff' : '#92400E',
                  borderColor: catGrupo === g ? '#D97706' : '#FDE68A',
                }}>
                {g} ({countPorGrupo[g]})
              </button>
            ))}
          </div>

          {/* Resultados */}
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>
            {catFiltradas.length} máquina{catFiltradas.length !== 1 ? 's' : ''} en el catálogo
          </p>

          {catFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: 28, marginBottom: 6 }}>🔍</p>
              <p style={{ margin: 0 }}>No hay máquinas que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {catFiltradas.map(cat => {
                const yaGuardada = nombresGuardados.has(cat.nombre.toLowerCase())
                const cargando = guardandoCat === cat.id
                const ejsRelacionados = ejerciciosCompatibles(cat.grupos)
                return (
                  <div key={cat.id} style={{
                    border: '1.5px solid #E5E7EB', borderRadius: 10,
                    background: yaGuardada ? '#FFFBEB' : '#fff',
                    padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
                    opacity: yaGuardada ? 0.85 : 1,
                  }}>
                    {/* Nombre + tipo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 16, marginRight: 6 }}>{TIPO_EMOJI[cat.tipo] ?? '⚙️'}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{cat.nombre}</span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: '#F3F4F6', color: '#6B7280', textTransform: 'uppercase',
                        letterSpacing: 0.4, whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {cat.tipo}
                      </span>
                    </div>

                    {/* Grupos */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {cat.grupos.map(g => (
                        <span key={g} style={{
                          fontSize: 11, background: '#FEF3C7', color: '#92400E',
                          borderRadius: 4, padding: '2px 8px', fontWeight: 600,
                        }}>{g}</span>
                      ))}
                    </div>

                    {/* Descripción */}
                    <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>
                      {cat.descripcion}
                    </p>

                    {/* Ejercicios compatibles de la DB */}
                    {ejsRelacionados.length > 0 && (
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          Ejercicios que usan esta máquina
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {ejsRelacionados.slice(0, 4).map(e => (
                            <span key={e.id} style={{ fontSize: 11, background: '#EFF6FF', color: '#2E75B6', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
                              💪 {e.nombre}
                            </span>
                          ))}
                          {ejsRelacionados.length > 4 && (
                            <span style={{ fontSize: 11, color: '#9CA3AF', padding: '2px 4px' }}>
                              +{ejsRelacionados.length - 4} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botón guardar */}
                    <button
                      onClick={() => !yaGuardada && !cargando && guardarDeCatalogo(cat)}
                      disabled={yaGuardada || cargando}
                      style={{
                        marginTop: 4, padding: '7px 0', borderRadius: 7, fontSize: 13,
                        border: '1.5px solid', cursor: yaGuardada ? 'default' : 'pointer',
                        fontWeight: 700, transition: 'all 0.1s',
                        background: yaGuardada ? '#F0FDF4' : (cargando ? '#FEF3C7' : '#D97706'),
                        color: yaGuardada ? '#16A34A' : (cargando ? '#92400E' : '#fff'),
                        borderColor: yaGuardada ? '#BBF7D0' : (cargando ? '#FDE68A' : '#B45309'),
                      }}>
                      {yaGuardada ? '✓ Guardada en Mis máquinas' : (cargando ? 'Guardando…' : '+ Agregar a Mis máquinas')}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: MIS MÁQUINAS (base de datos local)
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'mis' && (
        <div style={{ border: '1.5px solid #D97706', borderRadius: '0 8px 8px 8px', background: '#fff', padding: 20 }}>

          {/* ── Formulario inline ── */}
          {showForm && (
            <div className="gt-card" style={{ marginBottom: 20, border: '2px solid #D97706' }}>
              <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: '#111827' }}>
                {editandoId ? 'Editar máquina' : 'Nueva máquina'}
              </p>
              {error && <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>{error}</div>}

              <form onSubmit={guardar}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Col izquierda */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
                      <div className="gt-form-group" style={{ margin: 0 }}>
                        <label className="gt-label">Nro. Máquina <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
                        <input id="maq-nro" className="gt-input" value={form.nroMaquina ?? ''}
                          onChange={e => setForm(f => ({ ...f, nroMaquina: e.target.value || '' }))}
                          placeholder="Ej: M-01" maxLength={20} />
                      </div>
                      <div className="gt-form-group" style={{ margin: 0 }}>
                        <label className="gt-label">Nombre *</label>
                        <input className="gt-input" value={form.nombre}
                          onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                          placeholder="Ej: Prensa de piernas" maxLength={80} required />
                      </div>
                    </div>

                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Descripción</label>
                      <textarea className="gt-textarea" value={form.descripcion ?? ''}
                        onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                        rows={2} maxLength={300} placeholder="Descripción general de la máquina…" />
                    </div>

                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Instrucciones de uso</label>
                      <textarea className="gt-textarea" value={form.instruccionesUso ?? ''}
                        onChange={e => setForm(f => ({ ...f, instruccionesUso: e.target.value }))}
                        rows={2} maxLength={400} placeholder="Cómo usar correctamente la máquina…" />
                    </div>

                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Ajustes y configuración</label>
                      <textarea className="gt-textarea" value={form.ajustes ?? ''}
                        onChange={e => setForm(f => ({ ...f, ajustes: e.target.value }))}
                        rows={2} maxLength={400} placeholder="Cómo ajustar asientos, pesos, palancas…" />
                    </div>
                  </div>

                  {/* Col derecha — grupos musculares */}
                  <div className="gt-form-group" style={{ margin: 0 }}>
                    <label className="gt-label">Grupos musculares que trabaja</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {GRUPOS_CATEGORIAS.map(cat => (
                        <div key={cat.label}>
                          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {cat.label}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {cat.grupos.map(g => {
                              const sel = (form.grupos ?? []).includes(g)
                              return (
                                <button key={g} type="button" onClick={() => toggleGrupoForm(g)}
                                  style={{
                                    padding: '3px 10px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                                    border: '1.5px solid', transition: 'all 0.1s',
                                    borderColor: sel ? '#D97706' : '#D1D5DB',
                                    background: sel ? '#FEF3C7' : '#fff',
                                    color: sel ? '#92400E' : '#6B7280',
                                    fontWeight: sel ? 700 : 400,
                                  }}>
                                  {g}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Preview ejercicios compatibles en formulario */}
                    {(form.grupos ?? []).length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Ejercicios que usarían esta máquina
                        </p>
                        {ejerciciosCompatibles(form.grupos ?? []).length === 0 ? (
                          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                            Ningún ejercicio coincide aún.
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ejerciciosCompatibles(form.grupos ?? []).map(e => (
                              <span key={e.id} style={{ fontSize: 12, background: '#EFF6FF', color: '#2E75B6', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                                💪 {e.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando…' : editandoId ? 'Actualizar' : 'Crear máquina'}
                  </button>
                  <button type="button" className="gt-btn gt-btn-secondary" onClick={cancelar}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Barra de filtros ── */}
          <div style={{ marginBottom: 14, padding: '12px 16px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <input className="gt-input" style={{ flex: 1, minWidth: 160 }}
                placeholder="Buscar por nombre o número…"
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={verInactivas} onChange={e => setVerInactivas(e.target.checked)} />
                Ver inactivas
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setFiltroGrupo('')} type="button"
                  style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                    fontWeight: !filtroGrupo ? 700 : 400,
                    background: !filtroGrupo ? '#D97706' : '#fff',
                    color: !filtroGrupo ? '#fff' : '#374151',
                    borderColor: !filtroGrupo ? '#D97706' : '#D1D5DB',
                  }}>
                  Todos
                </button>
              </div>
              {GRUPOS_CATEGORIAS.map(cat => (
                <div key={cat.label} style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF', minWidth: 88, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {cat.label}
                  </span>
                  {cat.grupos.map(g => (
                    <button key={g} type="button" onClick={() => setFiltroGrupo(g === filtroGrupo ? '' : g)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, border: '1px solid', cursor: 'pointer',
                        fontWeight: filtroGrupo === g ? 700 : 400,
                        background: filtroGrupo === g ? '#D97706' : '#FEF3C7',
                        color: filtroGrupo === g ? '#fff' : '#92400E',
                        borderColor: filtroGrupo === g ? '#D97706' : '#FDE68A',
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── Lista compacta ── */}
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9CA3AF' }}>
            {filtradas.length} máquina{filtradas.length !== 1 ? 's' : ''}
          </p>

          {filtradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: 28, marginBottom: 6 }}>⚙️</p>
              <p style={{ margin: 0, marginBottom: 10 }}>No hay máquinas guardadas todavía.</p>
              <button className="gt-btn gt-btn-secondary" onClick={() => setTab('catalogo')} style={{ fontSize: 13 }}>
                📚 Ver catálogo de máquinas
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtradas.map(m => {
                const isExp = expandedId === m.id
                const ejsComp = ejerciciosCompatibles(m.grupos ?? [])

                return (
                  <div key={m.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #F0F0F0' }}>
                    {/* Fila principal */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: isExp ? '#FFFBEB' : (m.activa ? '#fff' : '#FAFAFA'),
                      opacity: m.activa ? 1 : 0.65, cursor: 'pointer', transition: 'background 0.1s',
                    }}
                      onClick={() => setExpandedId(isExp ? null : m.id!)}
                      onMouseEnter={ev => { if (!isExp) ev.currentTarget.style.background = '#F9FAFB' }}
                      onMouseLeave={ev => { if (!isExp) ev.currentTarget.style.background = m.activa ? '#fff' : '#FAFAFA' }}>

                      {/* Badge de número */}
                      <div style={{
                        width: 48, height: 44, borderRadius: 7, background: '#FEF3C7',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, border: '1px solid #FDE68A',
                      }}>
                        <span style={{ fontSize: 9, color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>NRO</span>
                        <span style={{ fontSize: 13, color: '#78350F', fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}>{m.nroMaquina || '—'}</span>
                      </div>

                      {/* Nombre + grupos */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{m.nombre}</span>
                          {!m.activa && (
                            <span style={{ fontSize: 10, background: '#FEF2F2', color: '#DC2626', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>INACTIVA</span>
                          )}
                        </div>
                        {m.grupos && m.grupos.length > 0 && (
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 3 }}>
                            {m.grupos.map(g => (
                              <span key={g} style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Indicador ejercicios compatibles */}
                      {ejsComp.length > 0 && (
                        <span style={{ fontSize: 11, background: '#EFF6FF', color: '#2E75B6', borderRadius: 6, padding: '2px 8px', fontWeight: 600, flexShrink: 0 }}>
                          💪 {ejsComp.length} ejerc.
                        </span>
                      )}

                      {/* Toggle expand */}
                      <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0, userSelect: 'none' }}>
                        {isExp ? '▲' : '▼'}
                      </span>

                      {/* Acciones */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}
                        onClick={ev => ev.stopPropagation()}>
                        <button className="gt-btn gt-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => abrirEditar(m)}>
                          Editar
                        </button>
                        <button className={`gt-btn ${m.activa ? 'gt-btn-danger' : 'gt-btn-secondary'}`}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => toggleActiva(m)}>
                          {m.activa ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </div>

                    {/* Detalle expandido */}
                    {isExp && (
                      <div style={{ padding: '12px 14px 14px 74px', background: '#FFFDF0', borderTop: '1px solid #E5E7EB' }}>
                        {m.descripcion && (
                          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{m.descripcion}</p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                          {m.instruccionesUso && (
                            <div>
                              <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Instrucciones</p>
                              <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{m.instruccionesUso}</p>
                            </div>
                          )}
                          {m.ajustes && (
                            <div>
                              <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ajustes</p>
                              <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{m.ajustes}</p>
                            </div>
                          )}
                        </div>

                        {/* Ejercicios compatibles */}
                        <div>
                          <p style={{ margin: '0 0 5px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Ejercicios compatibles (por grupo muscular)
                          </p>
                          {ejsComp.length === 0 ? (
                            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                              Ningún ejercicio comparte grupos con esta máquina todavía.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {ejsComp.map(e => (
                                <span key={e.id} style={{ fontSize: 12, background: '#EFF6FF', color: '#2E75B6', borderRadius: 6, padding: '3px 10px', fontWeight: 600, border: '1.5px solid #BFDBFE' }}>
                                  💪 {e.nombre}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: MANTENIMIENTO
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'mantenimiento' && (
        <div style={{ border: '1.5px solid #D97706', borderRadius: '0 8px 8px 8px', background: '#fff', padding: 20 }}>

          {/* Formulario */}
          {mantShowForm && (
            <div className="gt-card" style={{ marginBottom: 20, border: '2px solid #D97706' }}>
              <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 15, color: '#111827' }}>
                {mantEditId ? 'Editar registro de mantenimiento' : 'Registrar mantenimiento'}
              </p>
              {mantError && <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>{mantError}</div>}
              <form onSubmit={guardarMant}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Máquina */}
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Máquina *</label>
                      <select className="gt-input" value={mantForm.maquinaId || ''} required
                        onChange={e => setMantForm(f => ({ ...f, maquinaId: Number(e.target.value) }))}>
                        <option value="">Seleccioná una máquina…</option>
                        {maquinas.filter(m => m.activa).map(m => (
                          <option key={m.id} value={m.id}>
                            {m.nroMaquina ? `[${m.nroMaquina}] ` : ''}{m.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tipo */}
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Estado *</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['PENDIENTE', 'REALIZADO'] as TipoMantenimiento[]).map(t => (
                          <button key={t} type="button"
                            onClick={() => setMantForm(f => ({ ...f, tipo: t }))}
                            style={{
                              flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                              border: '1.5px solid', fontWeight: mantForm.tipo === t ? 700 : 400, transition: 'all 0.1s',
                              background: mantForm.tipo === t ? (t === 'PENDIENTE' ? '#FEF3C7' : '#D1FAE5') : '#fff',
                              color: mantForm.tipo === t ? (t === 'PENDIENTE' ? '#92400E' : '#065F46') : '#6B7280',
                              borderColor: mantForm.tipo === t ? (t === 'PENDIENTE' ? '#D97706' : '#34D399') : '#D1D5DB',
                            }}>
                            {t === 'PENDIENTE' ? '⏳ Pendiente' : '✅ Realizado'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Descripción *</label>
                      <textarea className="gt-textarea" value={mantForm.descripcion} required
                        onChange={e => setMantForm(f => ({ ...f, descripcion: e.target.value }))}
                        rows={3} placeholder="Describí el mantenimiento requerido o realizado…" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Fecha */}
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Fecha</label>
                      <input className="gt-input" type="date"
                        value={mantForm.fechaMantenimiento ?? ''}
                        onChange={e => setMantForm(f => ({ ...f, fechaMantenimiento: e.target.value }))} />
                    </div>

                    {/* Técnico */}
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Técnico / Responsable</label>
                      <input className="gt-input" value={mantForm.tecnico ?? ''}
                        onChange={e => setMantForm(f => ({ ...f, tecnico: e.target.value }))}
                        placeholder="Nombre del técnico o responsable…" maxLength={200} />
                    </div>

                    {/* Costo */}
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Costo (opcional)</label>
                      <input className="gt-input" type="number" min="0" step="0.01"
                        value={mantForm.costo ?? ''}
                        onChange={e => setMantForm(f => ({ ...f, costo: e.target.value ? Number(e.target.value) : undefined }))}
                        placeholder="Ej: 5000" />
                    </div>

                    {/* Observaciones */}
                    <div className="gt-form-group" style={{ margin: 0 }}>
                      <label className="gt-label">Observaciones adicionales</label>
                      <textarea className="gt-textarea" value={mantForm.observaciones ?? ''}
                        onChange={e => setMantForm(f => ({ ...f, observaciones: e.target.value }))}
                        rows={2} placeholder="Notas adicionales, piezas a reponer, etc." />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button type="submit" className="gt-btn gt-btn-primary" disabled={mantGuardando}>
                    {mantGuardando ? 'Guardando…' : mantEditId ? 'Actualizar' : 'Registrar'}
                  </button>
                  <button type="button" className="gt-btn gt-btn-secondary" onClick={cancelarMant}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Estado:</span>
              {(['todos', 'PENDIENTE', 'REALIZADO'] as const).map(t => (
                <button key={t} onClick={() => setMantFiltroTipo(t as any)}
                  style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid',
                    fontWeight: mantFiltroTipo === t ? 700 : 400, transition: 'all .1s',
                    background: mantFiltroTipo === t ? '#D97706' : '#fff',
                    color: mantFiltroTipo === t ? '#fff' : '#374151',
                    borderColor: mantFiltroTipo === t ? '#D97706' : '#D1D5DB',
                  }}>
                  {t === 'todos' ? 'Todos' : t === 'PENDIENTE' ? '⏳ Pendientes' : '✅ Realizados'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Máquina:</span>
              <select className="gt-input" style={{ maxWidth: 200, padding: '5px 8px', fontSize: 13 }}
                value={mantFiltroMaquina}
                onChange={e => setMantFiltroMaquina(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}>
                <option value="todas">Todas</option>
                {maquinas.filter(m => m.activa).map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Panel: Máquinas fuera de servicio ── */}
          {(() => {
            const pendientes = mantenimientos.filter(m => m.tipo === 'PENDIENTE')
            // Agrupar por máquina (puede haber varios registros PENDIENTE por máquina)
            const maquinasFueraMap = new Map<number, { nombre: string; nro: string | undefined; registros: typeof pendientes }>()
            for (const p of pendientes) {
              if (!maquinasFueraMap.has(p.maquinaId)) {
                maquinasFueraMap.set(p.maquinaId, {
                  nombre: p.maquinaNombre ?? `Máquina #${p.maquinaId}`,
                  nro: p.maquinaNroMaquina ?? undefined,
                  registros: [],
                })
              }
              maquinasFueraMap.get(p.maquinaId)!.registros.push(p)
            }
            const maquinasFuera = Array.from(maquinasFueraMap.values())

            return (
              <div style={{
                marginBottom: 20, borderRadius: 10,
                border: maquinasFuera.length > 0 ? '2px solid #FCA5A5' : '1.5px solid #BBF7D0',
                background: maquinasFuera.length > 0 ? '#FFF5F5' : '#F0FDF4',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: maquinasFuera.length > 0 ? '#FEE2E2' : '#DCFCE7',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{maquinasFuera.length > 0 ? '🔴' : '🟢'}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: maquinasFuera.length > 0 ? '#991B1B' : '#166534' }}>
                      {maquinasFuera.length > 0
                        ? `${maquinasFuera.length} máquina${maquinasFuera.length !== 1 ? 's' : ''} fuera de servicio`
                        : 'Todas las máquinas operativas'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span style={{ color: '#DC2626', fontWeight: 600 }}>
                      ⏳ {mantenimientos.filter(m => m.tipo === 'PENDIENTE').length} pendiente{mantenimientos.filter(m => m.tipo === 'PENDIENTE').length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>
                      ✅ {mantenimientos.filter(m => m.tipo === 'REALIZADO').length} realizados
                    </span>
                  </div>
                </div>

                {/* Cards de máquinas fuera de servicio */}
                {maquinasFuera.length > 0 && (
                  <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {maquinasFuera.map(mf => (
                      <div key={mf.nombre} style={{
                        background: '#fff', border: '1.5px solid #FCA5A5', borderRadius: 10,
                        padding: '10px 14px', minWidth: 200, maxWidth: 260,
                        boxShadow: '0 2px 6px rgba(220,38,38,0.08)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                          <span style={{ fontSize: 18 }}>🔧</span>
                          <div>
                            {mf.nro && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                                background: '#FCA5A5', color: '#7F1D1D', borderRadius: 8,
                                padding: '1px 6px', marginRight: 5,
                              }}>#{mf.nro}</span>
                            )}
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{mf.nombre}</span>
                          </div>
                        </div>
                        {mf.registros.map(r => (
                          <div key={r.id} style={{ fontSize: 12, color: '#6B7280', marginLeft: 2, marginBottom: 2 }}>
                            • {r.descripcion.length > 60 ? r.descripcion.slice(0, 60) + '…' : r.descripcion}
                            {r.fechaMantenimiento && (
                              <span style={{ color: '#9CA3AF', marginLeft: 5 }}>({r.fechaMantenimiento.slice(0, 10)})</span>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setMantFiltroMaquina(mf.registros[0].maquinaId)
                            setMantFiltroTipo('PENDIENTE')
                          }}
                          style={{
                            marginTop: 8, background: 'none', border: '1px solid #FCA5A5',
                            color: '#DC2626', borderRadius: 6, padding: '3px 10px', fontSize: 11,
                            cursor: 'pointer', width: '100%', fontWeight: 600,
                          }}>
                          Ver registros →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Lista */}
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#9CA3AF' }}>
            {mantFiltrados.length} registro{mantFiltrados.length !== 1 ? 's' : ''} de mantenimiento
          </p>

          {mantFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: 28, marginBottom: 6 }}>🔧</p>
              <p style={{ margin: 0, marginBottom: 12 }}>
                {mantenimientos.length === 0
                  ? 'No hay registros de mantenimiento todavía.'
                  : 'No hay registros que coincidan con los filtros.'}
              </p>
              {mantenimientos.length === 0 && (
                <button className="gt-btn gt-btn-primary" onClick={abrirNuevoMant}>
                  + Registrar primer mantenimiento
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {mantFiltrados.map(m => (
                <div key={m.id} style={{
                  border: `1.5px solid ${m.tipo === 'PENDIENTE' ? '#FDE68A' : '#BBF7D0'}`,
                  borderRadius: 10, padding: '14px 16px',
                  background: m.tipo === 'PENDIENTE' ? '#FFFBEB' : '#F0FDF4',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      {/* Máquina + tipo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                          background: m.tipo === 'PENDIENTE' ? '#FEF3C7' : '#D1FAE5',
                          color: m.tipo === 'PENDIENTE' ? '#92400E' : '#065F46',
                          border: `1px solid ${m.tipo === 'PENDIENTE' ? '#FDE68A' : '#6EE7B7'}`,
                        }}>
                          {m.tipo === 'PENDIENTE' ? '⏳ PENDIENTE' : '✅ REALIZADO'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                          {m.maquinaNroMaquina ? `[${m.maquinaNroMaquina}] ` : ''}{m.maquinaNombre}
                        </span>
                      </div>

                      {/* Descripción */}
                      <p style={{ margin: '0 0 6px', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                        {m.descripcion}
                      </p>

                      {/* Metadatos */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {m.fechaMantenimiento && (
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            📅 {new Date(m.fechaMantenimiento + 'T00:00:00').toLocaleDateString('es-AR')}
                          </span>
                        )}
                        {m.tecnico && (
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            👤 {m.tecnico}
                          </span>
                        )}
                        {m.costo != null && m.costo > 0 && (
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            💰 ${Number(m.costo).toLocaleString('es-AR')}
                          </span>
                        )}
                        {m.observaciones && (
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            📝 {m.observaciones}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {m.tipo === 'PENDIENTE' && (
                        <button
                          className="gt-btn gt-btn-secondary"
                          style={{ fontSize: 12, color: '#16A34A', borderColor: '#16A34A' }}
                          onClick={() => actualizarMantenimiento(m.id!, { tipo: 'REALIZADO' }).then(cargarMantenimientos)}>
                          ✅ Marcar realizado
                        </button>
                      )}
                      <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
                        onClick={() => abrirEditarMant(m)}>
                        Editar
                      </button>
                      <button className="gt-btn gt-btn-danger" style={{ fontSize: 12 }}
                        onClick={() => eliminarMant(m.id!)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
