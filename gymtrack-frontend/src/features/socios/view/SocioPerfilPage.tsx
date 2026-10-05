import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'
import { generarPin, cambiarMiPin } from '../services/socioService'
import { PinEntregaModal, CambiarPinModal } from '../components/PinModales'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { useSocioPerfil } from '../hooks/useSocioPerfil'
import EstadoBadge from '../components/EstadoBadge'
import MiSemanaView from '../components/MiSemanaView'
import MembresiaResumen from '../../membresias/components/MembresiaResumen'
import ProgresoSocio from '../../seguimiento/components/ProgresoSocio'
import DisciplinasDelSocio from '../../disciplinas/components/DisciplinasDelSocio'
import SocioInicio from '../components/SocioInicio'
import AvisosSocio from '../components/AvisosSocio'
import RutinaCard from '../../rutinas/components/RutinaCard'
import { linkEditarRutina } from '../../rutinas/utils/rutinaUtils'

export default function SocioPerfilPage() {
  const p = useSocioPerfil()
  const { login } = useAuth()
  const toast = useToast()
  // PIN de acceso a la app
  const [confirmarPin, setConfirmarPin] = useState(false)
  const [pinNuevo, setPinNuevo] = useState<string | null>(null)
  const [cambiandoPin, setCambiandoPin] = useState(false)

  const regenerarPin = async () => {
    setConfirmarPin(false)
    try { setPinNuevo(await generarPin(Number(p.id))) }
    catch { toast.error('Error', 'No se pudo generar el PIN') }
  }
  const cambiarPin = async (actual: string, nuevo: string) => {
    login(await cambiarMiPin(actual, nuevo))   // la sesión anterior deja de valer: se reemplaza por la nueva
    setCambiandoPin(false)
    toast.success('PIN cambiado', 'Usá el nuevo PIN la próxima vez que entres')
  }

  if (p.cargando) return <p className="gt-text-muted">Cargando perfil...</p>
  if (!p.socio) return <div className="gt-alert gt-alert-error">{p.error ?? 'Socio no encontrado.'}</div>

  const { socio, membresia, rutinas, id, esSocio } = p
  const vigente = membresia?.estadoMembresia === 'ACTIVA' && (membresia.diasRestantes ?? 0) >= 0

  return (
    <>
      {!esSocio && (
        <button className="gt-btn gt-btn-secondary" style={{ marginBottom: 16 }} onClick={() => p.navigate('/socios')}>
          ← Volver a Socios
        </button>
      )}

      {p.error && (
        <div className="gt-alert gt-alert-error">
          {p.error}
          <button onClick={() => p.setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* ── Ingreso con QR (solo el socio): recién al escanear se descuenta el pase ── */}
      {esSocio && (
        <Link to="/ingreso" className="gt-ingreso-cta">
          <span className="gt-ingreso-cta-icono">📷</span>
          <span style={{ flex: 1 }}>
            <strong>Escanear QR de ingreso</strong>
            <span className="gt-ingreso-cta-sub">Al llegar al gimnasio, escaneá el código de recepción</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
      )}
      {esSocio && <SocioInicio membresia={membresia} rutinas={rutinas} />}
      {esSocio && <AvisosSocio />}

      {/* ── Encabezado ── */}
      <div className="gt-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{socio.nombre} {socio.apellido}</h1>
              <EstadoBadge activo={socio.activo} estado={socio.estado} />
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: 'var(--text-secondary)' }}>
              <span>DNI <strong>{socio.dni}</strong></span>
              {socio.email && <span>✉ {socio.email}</span>}
              {socio.telefono && <span>📞 {socio.telefono}</span>}
            </div>
          </div>
          {esSocio ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="gt-btn gt-btn-secondary" onClick={() => setCambiandoPin(true)}>🔑 Cambiar PIN</button>
              <button className="gt-btn gt-btn-secondary" onClick={() => p.setConfirmLogout(true)}>Cerrar sesión</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link to={`/rutinas/asignar?socioId=${id}`} className="gt-btn gt-btn-primary">Asignar rutina</Link>
              <Link to={`/socios/${id}/ficha`} className="gt-btn gt-btn-secondary">Ficha médica</Link>
              {socio.activo !== false && (
                <button className="gt-btn gt-btn-secondary" onClick={() => setConfirmarPin(true)} title="Para que entre a la app con DNI + PIN">🔑 Generar PIN</button>
              )}
            </div>
          )}
        </div>

        {!esSocio && p.observacionesMedicas && (
          <div className="gt-alert gt-alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
            <strong>⚠ Ficha médica:</strong> {p.observacionesMedicas}
          </div>
        )}

      </div>

      {/* ── Membresía (una sola por socio) ── */}
      <MembresiaResumen m={membresia} acciones={!esSocio && (
        <>
          <Link to={`/pagos/nuevo?socioId=${id}`} className="gt-btn gt-btn-primary">
            {!membresia ? 'Cobrar plan' : vigente ? 'Renovar / cambiar plan' : 'Renovar'}
          </Link>
          {membresia && p.esAdmin && <Link to={`/membresias/${membresia.id}`} className="gt-btn gt-btn-secondary">Ver pagos</Link>}
          {p.esAdmin && membresia?.estadoMembresia === 'ACTIVA' && (
            <button className="gt-btn gt-btn-danger" onClick={() => p.setConfirmarCancelar(true)}>Cancelar membresía</button>
          )}
        </>
      )} />

      {/* ── Mi semana ── */}
      {rutinas.length > 0 && (
        <MiSemanaView
          rutinas={rutinas}
          ejerciciosPorRutina={p.ejerciciosPorRutina}
          cargandoEjs={p.cargandoEjs}
          maquinas={p.maquinas}
          socioId={id}
          diaSeleccionado={p.diaSeleccionado}
          setDiaSeleccionado={p.setDiaSeleccionado}
          expandedEjs={p.expandedEjs}
          toggleExpandedEj={p.toggleExpandedEj}
          progresoHoy={p.progresoHoy}
          setProgresoHoy={p.setProgresoHoy}
          guardandoProgreso={p.guardandoProgreso}
          onGuardarProgreso={p.handleGuardarProgreso}
        />
      )}

      {/* ── Rutinas ── */}
      <div className="gt-section-header" style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
          Rutinas <span className="gt-text-muted" style={{ fontSize: 13, fontWeight: 400 }}>({rutinas.length})</span>
        </h2>
        {!esSocio && rutinas.length > 0 && <Link to={`/rutinas/asignar?socioId=${id}`} className="gt-btn gt-btn-secondary">+ Asignar otra</Link>}
      </div>

      {rutinas.length === 0 ? (
        esSocio ? <div className="gt-empty">Todavía no tenés rutinas asignadas. Consultá con tu profesor.</div> : (
          <div className="gt-choice-grid" style={{ marginBottom: 20 }}>
            <Link to={`/rutinas/asignar?socioId=${id}`} className="gt-choice" style={{ textDecoration: 'none' }}>
              <p className="gt-choice-icon">📋</p>
              <p className="gt-choice-title">Asignar una plantilla</p>
              <p className="gt-choice-desc">Elegí una rutina modelo y se copia a {socio.nombre}.</p>
            </Link>
            <Link to={`/rutinas/nueva?socioId=${id}`} className="gt-choice" style={{ textDecoration: 'none' }}>
              <p className="gt-choice-icon">✏️</p>
              <p className="gt-choice-title">Crear personalizada</p>
              <p className="gt-choice-desc">Armala a medida con ejercicios del catálogo.</p>
            </Link>
          </div>
        )
      ) : (
        <div className="gt-rutina-grid" style={{ marginBottom: 20 }}>
          {rutinas.map(r => (
            <RutinaCard key={r.id} rutina={r} acciones={
              <>
                <Link to={`/rutinas/${r.id}?socioId=${id}`}>Abrir</Link>
                {!esSocio && <Link to={linkEditarRutina(r, true)}>Editar</Link>}
                {!esSocio && (
                  <button type="button" className="peligro" disabled={p.eliminandoRutinaId === r.id}
                    onClick={() => p.setConfirmarEliminarRutinaId(r.id!)} aria-label={`Eliminar ${r.nombre}`}>🗑</button>
                )}
              </>
            } />
          ))}
        </div>
      )}

      {/* ── Disciplinas (clases grupales) ── */}
      <DisciplinasDelSocio socioId={Number(id)} editable={!esSocio} />

      {/* ── Progreso: cargas y asistencia ── */}
      <div style={{ marginTop: 16 }}>
        <ProgresoSocio socioId={Number(id)} titulo={esSocio ? 'Mi progreso' : 'Progreso del socio'} />
      </div>

      <ConfirmModal
        open={confirmarPin}
        title="Generar un PIN nuevo"
        message={`Se va a generar un PIN nuevo para ${socio.nombre}. El anterior deja de funcionar y se cierran las sesiones que tenga abiertas en su celular.`}
        confirmLabel="Generar PIN"
        cancelLabel="Cancelar"
        onConfirm={regenerarPin}
        onCancel={() => setConfirmarPin(false)}
      />
      {pinNuevo && <PinEntregaModal nombre={`${socio.nombre} ${socio.apellido}`} dni={socio.dni} pin={pinNuevo} onCerrar={() => setPinNuevo(null)} />}
      {cambiandoPin && <CambiarPinModal onGuardar={cambiarPin} onCerrar={() => setCambiandoPin(false)} />}

      <ConfirmModal
        open={p.confirmarEliminarRutinaId !== null}
        title="Eliminar rutina"
        message="¿Eliminar esta rutina? Se borran sus ejercicios y el progreso registrado."
        confirmLabel="Sí, eliminar" cancelLabel="Cancelar" danger
        onConfirm={() => p.confirmarEliminarRutinaId !== null && p.handleEliminarRutina(p.confirmarEliminarRutinaId)}
        onCancel={() => p.setConfirmarEliminarRutinaId(null)}
      />
      <ConfirmModal
        open={p.confirmarCancelar}
        title="Cancelar membresía"
        message={`${socio.nombre} pierde el acceso al gimnasio hasta que le cobres un plan nuevo. ¿Continuar?`}
        confirmLabel="Cancelar membresía" cancelLabel="Volver" danger
        onConfirm={p.handleCancelarMembresia}
        onCancel={() => p.setConfirmarCancelar(false)}
      />
      <ConfirmModal
        open={p.confirmLogout}
        title="Cerrar sesión" message="¿Estás seguro que querés cerrar sesión?"
        confirmLabel="Cerrar sesión" cancelLabel="Cancelar" danger
        onConfirm={() => { p.setConfirmLogout(false); p.logout() }}
        onCancel={() => p.setConfirmLogout(false)}
      />
    </>
  )
}
