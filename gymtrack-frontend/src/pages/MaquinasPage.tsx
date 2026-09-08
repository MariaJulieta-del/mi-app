import { useState, useEffect } from 'react'
import { listarMaquinas, crearMaquina, actualizarMaquina, desactivarMaquina, type Maquina } from '../services/maquinaService'

const VACIO: Omit<Maquina, 'id'> = {
  nroMaquina: '',
  nombre: '',
  descripcion: '',
  musculosPrincipales: '',
  instruccionesUso: '',
  ajustes: '',
  activa: true,
}

export default function MaquinasPage() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [form, setForm] = useState<Omit<Maquina, 'id'>>(VACIO)
  const [editando, setEditando] = useState<number | null>(null)
  const [expandida, setExpandida] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try { setMaquinas(await listarMaquinas(false)) } catch {}
  }

  const set = (campo: keyof typeof VACIO, valor: string | boolean) =>
    setForm(f => ({ ...f, [campo]: valor }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nroMaquina.trim()) { setError('El número de máquina es obligatorio'); return }
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    try {
      setGuardando(true)
      if (editando !== null) {
        await actualizarMaquina(editando, form)
        setExito('Máquina actualizada')
      } else {
        await crearMaquina(form)
        setExito('Máquina creada')
      }
      setForm(VACIO); setEditando(null); setError(null); cargar()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al guardar la máquina'
      setError(msg)
    } finally { setGuardando(false) }
  }

  const handleEditar = (m: Maquina) => {
    setForm({
      nroMaquina: m.nroMaquina,
      nombre: m.nombre,
      descripcion: m.descripcion ?? '',
      musculosPrincipales: m.musculosPrincipales ?? '',
      instruccionesUso: m.instruccionesUso ?? '',
      ajustes: m.ajustes ?? '',
      activa: m.activa,
    })
    setEditando(m.id!)
    setExpandida(null)
    setExito(null); setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDesactivar = async (id: number) => {
    if (!confirm('¿Desactivar esta máquina?')) return
    try { await desactivarMaquina(id); setExito('Máquina desactivada'); cargar() }
    catch { setError('Error al desactivar') }
  }

  return (
    <>
      <h1 className="gt-page-title">Máquinas</h1>

      {exito && (
        <div className="gt-alert gt-alert-success">
          {exito}
          <button onClick={() => setExito(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {error && (
        <div className="gt-alert gt-alert-error">
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── Formulario ── */}
      <div className="gt-card" style={{ marginBottom: 24 }}>
        <p className="gt-card-title">{editando !== null ? 'Editar máquina' : 'Nueva máquina'}</p>
        <form onSubmit={handleSubmit}>
          <div className="gt-form-grid">

            <div className="gt-form-group">
              <label className="gt-label">Nro. máquina *</label>
              <input className="gt-input" value={form.nroMaquina}
                onChange={e => set('nroMaquina', e.target.value)}
                placeholder="Ej: M-01" maxLength={20} />
            </div>

            <div className="gt-form-group">
              <label className="gt-label">Nombre *</label>
              <input className="gt-input" value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="Ej: Sillón de cuádriceps" />
            </div>

            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Músculos principales</label>
              <input className="gt-input" value={form.musculosPrincipales}
                onChange={e => set('musculosPrincipales', e.target.value)}
                placeholder="Ej: Cuádriceps, Recto femoral" />
            </div>

            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Descripción</label>
              <textarea className="gt-textarea" rows={2} value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Descripción general de la máquina" />
            </div>

            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">¿Cómo se usa?</label>
              <textarea className="gt-textarea" rows={3} value={form.instruccionesUso}
                onChange={e => set('instruccionesUso', e.target.value)}
                placeholder="Pasos para usar correctamente la máquina..." />
            </div>

            <div className="gt-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="gt-label">Ajustes y tips</label>
              <textarea className="gt-textarea" rows={3} value={form.ajustes}
                onChange={e => set('ajustes', e.target.value)}
                placeholder="Cómo ajustar el asiento, el agarre, el recorrido..." />
            </div>

          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando !== null ? 'Actualizar' : 'Crear máquina'}
            </button>
            {editando !== null && (
              <button type="button" className="gt-btn gt-btn-secondary"
                onClick={() => { setForm(VACIO); setEditando(null) }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Lista de máquinas ── */}
      {maquinas.length === 0 ? (
        <div className="gt-empty"><p>No hay máquinas registradas</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {maquinas.map(m => (
            <div key={m.id} className="gt-card" style={{ padding: '14px 18px' }}>

              {/* Cabecera */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
                      background: '#F3F4F6', border: '1px solid #E5E7EB',
                      borderRadius: 6, padding: '2px 8px', color: '#374151',
                    }}>
                      {m.nroMaquina}
                    </span>
                    <span className="gt-fw-600" style={{ fontSize: 15 }}>{m.nombre}</span>
                    <span className={m.activa ? 'gt-badge gt-badge-green' : 'gt-badge gt-badge-gray'}>
                      {m.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {m.musculosPrincipales && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>
                      💪 {m.musculosPrincipales}
                    </p>
                  )}
                  {m.descripcion && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151' }}>{m.descripcion}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {(m.instruccionesUso || m.ajustes) && (
                    <button
                      className="gt-btn gt-btn-secondary"
                      style={{ fontSize: 12 }}
                      onClick={() => setExpandida(expandida === m.id ? null : m.id!)}>
                      {expandida === m.id ? '▲ Menos' : '▼ Ver guía'}
                    </button>
                  )}
                  <button className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
                    onClick={() => handleEditar(m)}>Editar</button>
                  {m.activa && (
                    <button className="gt-btn gt-btn-danger" style={{ fontSize: 12 }}
                      onClick={() => handleDesactivar(m.id!)}>Desactivar</button>
                  )}
                </div>
              </div>

              {/* Guía expandida */}
              {expandida === m.id && (
                <div style={{
                  marginTop: 12, paddingTop: 12,
                  borderTop: '1px solid #E5E7EB',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                }}>
                  {m.instruccionesUso && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: '#2E75B6' }}>
                        📋 Cómo se usa
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                        {m.instruccionesUso}
                      </p>
                    </div>
                  )}
                  {m.ajustes && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: 13, color: '#D97706' }}>
                        ⚙️ Ajustes y tips
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                        {m.ajustes}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </>
  )
}
