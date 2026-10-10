import { lazy, Suspense, useState } from 'react'
import { useEjercicios } from '../hooks/useEjercicios'
import { SkeletonTarjetas } from '../../../shared/components/ui'
// El catálogo (1.324 ejercicios) se descarga aparte, recién cuando se abre esa pestaña
const CatalogoEjerciciosTab = lazy(() => import('../components/tabs/CatalogoEjerciciosTab'))
import MisEjerciciosTab from '../components/tabs/MisEjerciciosTab'
import LimpiezaModal from '../components/LimpiezaModal'
import { useAuth } from '../../../shared/context/AuthContext'

export default function EjerciciosPage() {
  const [tab, setTab] = useState<'catalogo' | 'mis'>('catalogo')
  const [lightbox, setLightbox] = useState<{ url: string; nombre: string } | null>(null)
  const ej = useEjercicios()
  const { user } = useAuth()
  const [limpiando, setLimpiando] = useState(false)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 className="gt-page-title" style={{ margin: 0 }}>Ejercicios</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Catálogo de 1.324 ejercicios con GIF y los ejercicios propios del gimnasio
          </p>
        </div>
        {tab === 'mis' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {user?.rol === 'ADMIN' && (
              <button className="gt-btn gt-btn-secondary" onClick={() => setLimpiando(true)}>🧹 Limpiar viejos</button>
            )}
            <button className="gt-btn gt-btn-primary" onClick={ej.abrirNuevo}>+ Nuevo ejercicio</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {([['catalogo', '📚 Catálogo'], ['mis', '⭐ Mis ejercicios']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === key ? 700 : 400,
              background: 'none', borderBottom: tab === key ? '2px solid var(--blue-text)' : '2px solid transparent',
              color: tab === key ? 'var(--blue-text)' : 'var(--text-muted)', marginBottom: -2, transition: 'all 0.15s',
            }}>
            {label}
            {key === 'mis' && ej.ejercicios.filter(e => !e.esMaquina && e.activo).length > 0 && (
              <span style={{ marginLeft: 7, fontSize: 11, background: 'var(--blue-bg)', color: 'var(--blue-text)', borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                {ej.ejercicios.filter(e => !e.esMaquina && e.activo).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {limpiando && (
        <LimpiezaModal onCerrar={() => setLimpiando(false)}
          onListo={n => { setLimpiando(false); ej.setMsg(n === 0 ? 'No había ejercicios para borrar' : `Se borraron ${n} ejercicios viejos`); ej.cargarLocales() }} />
      )}

      {/* Mensajes globales */}
      {ej.msg && (
        <div className="gt-alert gt-alert-success" style={{ marginBottom: 12 }}>
          {ej.msg}
          <button onClick={() => ej.setMsg(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {ej.error && (
        <div className="gt-alert gt-alert-error" style={{ marginBottom: 12 }}>
          {ej.error}
          <button onClick={() => ej.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {tab === 'catalogo' && (
        <Suspense fallback={<SkeletonTarjetas cantidad={6} alto={150} />}>
        <CatalogoEjerciciosTab
          ejercicios={ej.ejercicios}
          setMsg={ej.setMsg}
          setError={ej.setError}
          setLightbox={setLightbox}
          onGuardado={ej.cargarLocales}
        />
        </Suspense>
      )}

      {tab === 'mis' && (
        <MisEjerciciosTab
          filtrados={ej.filtrados}
          ejercicios={ej.ejercicios}
          maquinas={ej.maquinas}
          filtroGrupo={ej.filtroGrupo}
          setFiltroGrupo={ej.setFiltroGrupo}
          busqueda={ej.busqueda}
          setBusqueda={ej.setBusqueda}
          soloSinMaquina={ej.soloSinMaquina}
          setSoloSinMaquina={ej.setSoloSinMaquina}
          asignarMaquina={ej.asignarMaquina}
          verInactivos={ej.verInactivos}
          setVerInactivos={ej.setVerInactivos}
          showForm={ej.showForm}
          form={ej.form}
          setForm={ej.setForm}
          editandoId={ej.editandoId}
          guardando={ej.guardando}
          subiendoImg={ej.subiendoImg}
          expandedId={ej.expandedId}
          setExpandedId={ej.setExpandedId}
          quitandoMaquina={ej.quitandoMaquina}
          imgRef={ej.imgRef}
          maquinasCompatibles={ej.maquinasCompatibles}
          abrirNuevo={ej.abrirNuevo}
          abrirEditar={ej.abrirEditar}
          cancelar={ej.cancelar}
          toggleGrupoForm={ej.toggleGrupoForm}
          toggleMaquinaForm={ej.toggleMaquinaForm}
          handleImagen={ej.handleImagen}
          guardar={ej.guardar}
          toggleActivo={ej.toggleActivo}
          quitarMaquina={ej.quitarMaquina}
          setLightbox={setLightbox}
          onIrCatalogo={() => setTab('catalogo')}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          onKeyDown={e => e.key === 'Escape' && setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.82)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: 24,
          }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: '0 0 16px', textAlign: 'center', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {lightbox.nombre}
          </p>
          <img
            src={lightbox.url}
            alt={lightbox.nombre}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
          <button
            onClick={() => setLightbox(null)}
            style={{
              marginTop: 20, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)',
              color: '#fff', borderRadius: 8, padding: '8px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 600,
            }}>
            ✕ Cerrar
          </button>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 10 }}>
            Hacé clic fuera o Escape para cerrar
          </p>
        </div>
      )}
    </div>
  )
}
