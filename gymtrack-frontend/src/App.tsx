import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from './shared/context/AuthContext'
import { ToastProvider } from './shared/hooks/useToast'
import CommandPalette from './shared/components/CommandPalette'
import ConfirmModal from './shared/components/ConfirmModal'
import LoginPage from './features/auth/view/LoginPage'
import ProtectedRoute from './shared/components/ProtectedRoute'

// Páginas con carga diferida: cada módulo se descarga recién al navegar a él
const SociosPage         = lazy(() => import('./features/socios/view/SociosPage'))
const RutinasList        = lazy(() => import('./features/rutinas/components/RutinasList'))
const RutinaForm         = lazy(() => import('./features/rutinas/components/RutinaForm'))
const RutinasDetail      = lazy(() => import('./features/rutinas/components/RutinasDetail'))
const AsignarRutinaPage  = lazy(() => import('./features/rutinas/view/AsignarRutinaPage'))
const MembresiasList     = lazy(() => import('./features/membresias/components/MembresiasList'))
const MembresiasForm     = lazy(() => import('./features/membresias/components/MembresiasForm'))
const MembresiasDetail   = lazy(() => import('./features/membresias/components/MembresiasDetail'))
const PagosList          = lazy(() => import('./features/pagos/components/PagosList'))
const PagosForm          = lazy(() => import('./features/pagos/components/PagosForm'))
const DashboardPage      = lazy(() => import('./features/dashboard/view/DashboardPage'))
const AccesoPage         = lazy(() => import('./features/asistencias/view/AccesoPage'))
const EntrenarPage       = lazy(() => import('./features/rutinas/view/EntrenarPage'))
const AuditoriaPage      = lazy(() => import('./features/auditoria/view/AuditoriaPage'))
const HoyPage            = lazy(() => import('./features/seguimiento/view/HoyPage'))
const KioscoPage         = lazy(() => import('./features/asistencias/view/KioscoPage'))
const QrIngresoPage      = lazy(() => import('./features/asistencias/view/QrIngresoPage'))
const EscanearIngresoPage = lazy(() => import('./features/asistencias/view/EscanearIngresoPage'))
const DisciplinasPage    = lazy(() => import('./features/disciplinas/view/DisciplinasPage'))
const NotificacionesPage = lazy(() => import('./features/notificaciones/view/NotificacionesPage'))
const ReportesPage       = lazy(() => import('./features/reportes/view/ReportesPage'))
const FichaMedicaPage    = lazy(() => import('./features/socios/view/FichaMedicaPage'))
const SocioPerfilPage    = lazy(() => import('./features/socios/view/SocioPerfilPage'))
const EjerciciosPage     = lazy(() => import('./features/ejercicios/view/EjerciciosPage'))
const MaquinasPage       = lazy(() => import('./features/maquinas/view/MaquinasPage'))
const ProfesoresPage     = lazy(() => import('./features/profesores/view/ProfesoresPage'))

// ── Sidebar ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/',               label: 'Inicio',          end: true,  roles: ['ADMIN'] },
  { to: '/hoy',            label: 'Hoy',             end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/acceso',         label: 'Acceso',          end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/socios',         label: 'Socios',          end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/rutinas',        label: 'Rutinas',         end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/membresias',     label: 'Membresías',      end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/pagos',          label: 'Pagos',           end: false, roles: ['ADMIN'] },
  { to: '/disciplinas',    label: 'Disciplinas',     end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/ejercicios',     label: 'Ejercicios',      end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/maquinas',       label: 'Máquinas',        end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/profesores',     label: 'Profesores',      end: false, roles: ['ADMIN'] },
  { to: '/reportes',       label: 'Reportes',        end: false, roles: ['ADMIN'] },
  { to: '/notificaciones', label: 'Notificaciones',  end: false, roles: ['ADMIN', 'PROFESOR'] },
  { to: '/auditoria',      label: 'Auditoría',       end: false, roles: ['ADMIN'] },
]

/** Barra inferior del staff en el celular: lo que más se usa en el salón */
const BOTTOM_LINKS = [
  { to: '/hoy',     label: 'Hoy',     icono: '🏠', end: false },
  { to: '/acceso',  label: 'Acceso',  icono: '🚪', end: false },
  { to: '/socios',  label: 'Socios',  icono: '👥', end: false },
  { to: '/rutinas', label: 'Rutinas', icono: '📋', end: false },
]

function BottomNav({ onMas }: { onMas: () => void }) {
  return (
    <nav className="gt-bottom-nav" aria-label="Navegación principal">
      {BOTTOM_LINKS.map(l => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'gt-bottom-link' + (isActive ? ' active' : '')}>
          <span aria-hidden>{l.icono}</span>{l.label}
        </NavLink>
      ))}
      <button type="button" className="gt-bottom-link" onClick={onMas}>
        <span aria-hidden>☰</span>Más
      </button>
    </nav>
  )
}

function Sidebar({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { logout, user } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const rol = user?.rol ?? ''

  return (
    <>
    {abierto && <div className="gt-sidebar-backdrop" onClick={onCerrar} aria-hidden />}
    <aside className={`gt-sidebar${abierto ? ' abierto' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <nav>
        {NAV_LINKS.filter(l => l.roles.includes(rol)).map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => 'gt-sidebar-link' + (isActive ? ' active' : '')}
            onClick={onCerrar}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 12px' }}>
        <button
          onClick={() => setConfirmLogout(true)}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--red)',
            color: 'var(--red)',
            borderRadius: 6,
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>

      <ConfirmModal
        open={confirmLogout}
        title="Cerrar sesión"
        message="¿Estás seguro que querés cerrar sesión?"
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => { setConfirmLogout(false); logout() }}
        onCancel={() => setConfirmLogout(false)}
      />
    </aside>
    </>
  )
}

// ── Icono sol / luna ──────────────────────────────────────────────────────
function IconSun() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

// ── Layout principal (con sidebar + topbar) ───────────────────────────────
function AppLayout() {
  const { user } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('gt-dark') === '1' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('gt-dark', dark ? '1' : '0') } catch { /* sin almacenamiento: no se recuerda el tema */ }
  }, [dark])

  return (
    <>
      <header className="gt-topbar">
        <span className="gt-topbar-brand">GymTrack</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.rol !== 'SOCIO' && (
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
            }}
            title="Buscar socio (Ctrl+K)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Buscar
            <kbd className="gt-topbar-kbd" style={{ fontSize: 10, opacity: 0.75, background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: 3 }}>Ctrl+K</kbd>
          </button>
          )}
          <button
            className="gt-dark-toggle"
            onClick={() => setDark(d => !d)}
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {dark ? <IconSun /> : <IconMoon />}
            <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="gt-topbar-usuario" style={{ color: '#fff', fontSize: 13, opacity: 0.9 }}>
              {user?.username}
            </span>
            <span style={{
              background: user?.rol === 'ADMIN' ? 'var(--yellow-text)' : user?.rol === 'PROFESOR' ? '#3B82F6' : '#10B981',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 20,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              {user?.rol}
            </span>
          </span>
        </div>
      </header>

      {user?.rol !== 'SOCIO' && <CommandPalette />}
      <div className="gt-layout">
        {user?.rol !== 'SOCIO' && <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />}
        {user?.rol !== 'SOCIO' && <BottomNav onMas={() => setMenuAbierto(true)} />}
        <main className={`gt-content${user?.rol === 'SOCIO' ? ' gt-content-socio' : ' gt-content-staff'}`}>
          <Suspense fallback={<p className="gt-text-muted">Cargando...</p>}>
          <Routes>
            {/* ── Rutas SOCIO ── */}
            {user?.rol === 'SOCIO' && user.socioId && (
              <>
                <Route path="/"       element={<Navigate to={`/socios/${user.socioId}/perfil`} replace />} />
                <Route path="/socios/:socioId/perfil" element={<SocioPerfilPage />} />
                <Route path="/rutinas/:id"            element={<RutinasDetail />} />
                <Route path="/rutinas/:id/entrenar"   element={<EntrenarPage />} />
                <Route path="/ingreso"                element={<EscanearIngresoPage />} />
                <Route path="*"       element={<Navigate to={`/socios/${user.socioId}/perfil`} replace />} />
              </>
            )}
            {/* ── Rutas ADMIN y PROFESOR ── */}
            {user?.rol !== 'SOCIO' && (
              <>
                <Route path="/"                            element={user?.rol === 'ADMIN' ? <DashboardPage /> : <Navigate to="/hoy" replace />} />
                <Route path="/hoy"                         element={<HoyPage />} />
                <Route path="/acceso"                      element={<AccesoPage />} />
                <Route path="/qr-ingreso"                  element={<QrIngresoPage />} />
                <Route path="/socios"                      element={<SociosPage />} />
                <Route path="/socios/:socioId/perfil"      element={<SocioPerfilPage />} />
                <Route path="/socios/:socioId/ficha"       element={<FichaMedicaPage />} />
                <Route path="/rutinas"                     element={<RutinasList />} />
                <Route path="/rutinas/asignar"             element={<AsignarRutinaPage />} />
                <Route path="/rutinas/nueva"               element={<RutinaForm />} />
                <Route path="/rutinas/editar/:id"          element={<RutinaForm />} />
                <Route path="/rutinas/:id"                 element={<RutinasDetail />} />
                <Route path="/rutinas/:id/entrenar"        element={<EntrenarPage />} />
                <Route path="/membresias"                  element={<MembresiasList />} />
                <Route path="/membresias/nueva"            element={<MembresiasForm />} />
                <Route path="/membresias/:id"              element={<MembresiasDetail />} />
                {user?.rol === 'ADMIN' && <Route path="/pagos" element={<PagosList />} />}
                <Route path="/pagos/nuevo"                 element={<PagosForm />} />
                <Route path="/disciplinas"                 element={<DisciplinasPage />} />
                <Route path="/ejercicios"                  element={<EjerciciosPage />} />
                <Route path="/maquinas"                    element={<MaquinasPage />} />
                <Route path="/notificaciones"              element={<NotificacionesPage />} />
                {user?.rol === 'ADMIN' && (
                  <>
                    <Route path="/profesores"              element={<ProfesoresPage />} />
                    <Route path="/reportes"                element={<ReportesPage />} />
                    <Route path="/auditoria"               element={<AuditoriaPage />} />
                  </>
                )}
                <Route path="*"                            element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
          </Suspense>
        </main>
      </div>
    </>
  )
}

// ── App raíz ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Pantalla fija de recepción: usa su propio token, no la sesión de un usuario */}
        <Route path="/kiosco" element={<Suspense fallback={null}><KioscoPage /></Suspense>} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ToastProvider>
  )
}
