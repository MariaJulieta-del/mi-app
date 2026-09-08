import { useState, useEffect, useRef } from 'react'
import {
  listarTodosEjercicios, crearEjercicio, actualizarEjercicio,
  desactivarEjercicio, activarEjercicio, GRUPOS_MUSCULARES, GRUPOS_CATEGORIAS,
  type Ejercicio
} from '../services/ejercicioService'
import { listarMaquinas, type Maquina } from '../services/maquinaService'

const VACIO: Ejercicio = { nombre: '', descripcion: '', grupoMuscular: '', esMaquina: false, activo: true, imagenUrl: '', maquinaIds: [] }

/** Redimensiona una imagen a max 600px y la convierte a JPEG base64 */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 600
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([])
  const [maquinasCatalogo, setMaquinasCatalogo] = useState<Maquina[]>([])
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ejercicio' | 'maquina'>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState<Ejercicio>(VACIO)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendoImg, setSubiendoImg] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  const cargar = async () => {
    try {
      const [ejs, maks] = await Promise.all([listarTodosEjercicios(), listarMaquinas(true)])
      setEjercicios(ejs)
      setMaquinasCatalogo(maks)
    } catch { setError('Error al cargar ejercicios') }
  }

  useEffect(() => { cargar() }, [])

  const filtrados = ejercicios.filter(e => {
    const matchBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchGrupo = !filtroGrupo || e.grupoMuscular === filtroGrupo
    const matchTipo = filtroTipo === 'todos' || (filtroTipo === 'maquina' ? e.esMaquina : !e.esMaquina)
    return matchBusqueda && matchGrupo && matchTipo
  })

  const abrirNuevo = () => {
    setForm({ ...VACIO, maquinaIds: [] }); setEditandoId(null); setShowForm(true); setError(null)
  }
  const abrirEditar = (e: Ejercicio) => {
    setForm({ ...e, maquinaIds: e.maquinaIds ? [...e.maquinaIds] : [] })
    setEditandoId(e.id!); setShowForm(true); setError(null)
  }
  const cancelar = () => { setShowForm(false); setForm({ ...VACIO, maquinaIds: [] }); setEditandoId(null) }

  const handleImagen = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return
    setSubiendoImg(true)
    try {
      const base64 = await resizeImage(file)
      setForm(f => ({ ...f, imagenUrl: base64 }))
    } catch {
      setError('Error al procesar la imagen')
    } finally {
      setSubiendoImg(false)
    }
  }

  const toggleMaquina = (maquinaId: number) => {
    setForm(f => {
      const ids = f.maquinaIds ?? []
      return {
        ...f,
        maquinaIds: ids.includes(maquinaId) ? ids.filter(id => id !== maquinaId) : [...ids, maquinaId]
      }
    })
  }

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true); setError(null)
    try {
      if (editandoId) {
        await actualizarEjercicio(editandoId, form)
        setMsg('Ejercicio actualizado.')
      } else {
        await crearEjercicio(form)
        setMsg('Ejercicio creado.')
      }
      cancelar(); await cargar()
    } catch { setError('Error al guardar') } finally { setGuardando(false) }
  }

  const toggleActivo = async (e: Ejercicio) => {
    try {
      if (e.activo) await desactivarEjercicio(e.id!)
      else await activarEjercicio(e.id!)
      await cargar()
    } catch { setError('Error al cambiar estado') }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 className="gt-page-title" style={{ margin: 0 }}>Ejercicios y Máquinas</h1>
        <button className="gt-btn gt-btn-primary" onClick={abrirNuevo}>+ Nuevo</button>
      </div>

      {msg && (
        <div className="gt-alert" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#16A34A', marginBottom: 12 }}>
          {msg}
          <button onClick={() => setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Formulario inline */}
      {showForm && (
        <div className="gt-card" style={{ marginBottom: 20, border: '2px solid #2E75B6' }}>
          <p className="gt-card-title">{editandoId ? 'Editar ejercicio' : 'Nuevo ejercicio / máquina'}</p>
          {error && <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          <form onSubmit={guardar}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Col izquierda: datos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Nombre *</label>
                  <input className="gt-input" value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Press de banca, Polea al pecho..." maxLength={80} required />
                </div>
                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Grupo muscular</label>
                  <select className="gt-select" value={form.grupoMuscular ?? ''}
                    onChange={e => setForm(f => ({ ...f, grupoMuscular: e.target.value }))}>
                    <option value="">— Sin especificar —</option>
                    {GRUPOS_MUSCULARES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Descripción / instrucciones</label>
                  <textarea className="gt-textarea" value={form.descripcion ?? ''}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    rows={3} maxLength={300} placeholder="Cómo ejecutar correctamente el ejercicio..." />
                </div>
                <div className="gt-form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                  <input type="checkbox" id="esMaquina" checked={form.esMaquina}
                    onChange={e => setForm(f => ({ ...f, esMaquina: e.target.checked }))} />
                  <label htmlFor="esMaquina" className="gt-label" style={{ margin: 0 }}>
                    Es máquina / equipo
                  </label>
                </div>
              </div>

              {/* Col derecha: imagen + máquinas requeridas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Upload imagen */}
                <div className="gt-form-group" style={{ margin: 0 }}>
                  <label className="gt-label">Imagen representativa</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.imagenUrl ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={form.imagenUrl}
                          alt="Preview"
                          style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, imagenUrl: '' }))}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12, lineHeight: '24px', padding: 0, textAlign: 'center' }}
                        >✕</button>
                      </div>
                    ) : (
                      <div
                        onClick={() => imgRef.current?.click()}
                        style={{
                          border: '2px dashed #D1D5DB', borderRadius: 8, padding: '20px 0',
                          textAlign: 'center', cursor: 'pointer', color: '#9CA3AF', fontSize: 13,
                          background: '#F9FAFB', transition: 'border-color 0.15s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2E75B6')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
                      >
                        {subiendoImg ? '⏳ Procesando...' : '📷 Subir imagen'}
                        <p style={{ margin: '4px 0 0', fontSize: 11 }}>JPG, PNG, GIF — se redimensiona automáticamente</p>
                      </div>
                    )}
                    <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagen} />
                    {!form.imagenUrl && (
                      <button type="button" className="gt-btn gt-btn-secondary" style={{ fontSize: 12 }}
                        onClick={() => imgRef.current?.click()}>
                        Elegir imagen
                      </button>
                    )}
                  </div>
                </div>

                {/* Máquinas requeridas (solo si NO es máquina) */}
                {!form.esMaquina && maquinasCatalogo.length > 0 && (
                  <div className="gt-form-group" style={{ margin: 0 }}>
                    <label className="gt-label">Máquinas requeridas</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto', padding: '4px 0' }}>
                      {maquinasCatalogo.map(m => (
                        <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: (form.maquinaIds ?? []).includes(m.id!) ? '#EFF6FF' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={(form.maquinaIds ?? []).includes(m.id!)}
                            onChange={() => toggleMaquina(m.id!)}
                          />
                          <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#F3F4F6', borderRadius: 4, padding: '1px 5px', color: '#374151' }}>{m.nroMaquina}</span>
                          <span style={{ fontWeight: (form.maquinaIds ?? []).includes(m.id!) ? 600 : 400 }}>{m.nombre}</span>
                          {m.musculosPrincipales && (
                            <span style={{ fontSize: 10, background: '#EFF6FF', color: '#2E75B6', borderRadius: 4, padding: '1px 5px' }}>{m.musculosPrincipales}</span>
                          )}
                        </label>
                      ))}
                    </div>
                    {(form.maquinaIds ?? []).length > 0 && (
                      <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0' }}>
                        {(form.maquinaIds ?? []).length} máquina{(form.maquinaIds ?? []).length !== 1 ? 's' : ''} seleccionada{(form.maquinaIds ?? []).length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" className="gt-btn gt-btn-secondary" onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="gt-card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <input className="gt-input" style={{ flex: 1, minWidth: 160 }}
            placeholder="Buscar por nombre..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <div style={{ display: 'flex', gap: 6 }}>
            {(['todos', 'ejercicio', 'maquina'] as const).map(t => (
              <button key={t} type="button"
                onClick={() => setFiltroTipo(t)}
                style={{
                  padding: '5px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer', border: '1px solid',
                  fontWeight: filtroTipo === t ? 700 : 400,
                  background: filtroTipo === t ? '#1B5E44' : '#fff',
                  color: filtroTipo === t ? '#fff' : '#374151',
                  borderColor: filtroTipo === t ? '#1B5E44' : '#D1D5DB',
                }}>
                {t === 'todos' ? 'Todos' : t === 'maquina' ? '⚙ Máquinas' : '💪 Ejercicios'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button"
              onClick={() => setFiltroGrupo('')}
              style={{
                padding: '4px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer', border: '1px solid',
                fontWeight: filtroGrupo === '' ? 700 : 400,
                background: filtroGrupo === '' ? '#2E75B6' : '#fff',
                color: filtroGrupo === '' ? '#fff' : '#374151',
                borderColor: filtroGrupo === '' ? '#2E75B6' : '#D1D5DB',
              }}>
              Todos los grupos
            </button>
          </div>
          {GRUPOS_CATEGORIAS.map(cat => (
            <div key={cat.label} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 90, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {cat.label}
              </span>
              {cat.grupos.map(g => (
                <button key={g} type="button"
                  onClick={() => setFiltroGrupo(g === filtroGrupo ? '' : g)}
                  style={{
                    padding: '4px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer', border: '1px solid',
                    fontWeight: filtroGrupo === g ? 700 : 400,
                    background: filtroGrupo === g ? '#2E75B6' : '#EFF6FF',
                    color: filtroGrupo === g ? '#fff' : '#2E75B6',
                    borderColor: filtroGrupo === g ? '#2E75B6' : '#BFDBFE',
                  }}>
                  {g}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="gt-card">
        <div style={{ marginBottom: 12, fontSize: 13, color: '#6B7280' }}>
          {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
        </div>
        {filtrados.length === 0 ? (
          <div className="gt-empty">No hay ejercicios que coincidan con el filtro.</div>
        ) : (
          <div className="gt-table-wrap">
            <table className="gt-table">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>Imagen</th>
                  <th>Nombre</th>
                  <th>Grupo</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Máquinas req.</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(e => (
                  <tr key={e.id} style={{ opacity: e.activo ? 1 : 0.55 }}>
                    <td>
                      {e.imagenUrl ? (
                        <img src={e.imagenUrl} alt={e.nombre}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #E5E7EB' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#D1D5DB' }}>
                          {e.esMaquina ? '⚙' : '💪'}
                        </div>
                      )}
                    </td>
                    <td className="gt-fw-600">{e.nombre}</td>
                    <td>
                      {e.grupoMuscular ? (
                        <span style={{ fontSize: 12, background: '#EFF6FF', color: '#2E75B6', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
                          {e.grupoMuscular}
                        </span>
                      ) : <span className="gt-text-muted">—</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: 12, background: e.esMaquina ? '#FEF3C7' : '#F0FDF4', color: e.esMaquina ? '#92400E' : '#16A34A', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
                        {e.esMaquina ? '⚙ Máquina' : '💪 Ejercicio'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#6B7280', maxWidth: 200 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {e.descripcion || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {e.maquinaIds && e.maquinaIds.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {e.maquinaIds.map(mid => {
                            const m = maquinasCatalogo.find(x => x.id === mid)
                            return m ? (
                              <span key={mid} style={{ background: '#FEF3C7', color: '#92400E', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>
                                ⚙ {m.nroMaquina} {m.nombre}
                              </span>
                            ) : null
                          })}
                        </div>
                      ) : <span className="gt-text-muted">—</span>}
                    </td>
                    <td>
                      <span className={`gt-badge ${e.activo ? 'gt-badge-green' : 'gt-badge-red'}`}>
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="gt-btn gt-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => abrirEditar(e)}>Editar</button>
                        <button
                          className={`gt-btn ${e.activo ? 'gt-btn-danger' : 'gt-btn-secondary'}`}
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => toggleActivo(e)}>
                          {e.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
