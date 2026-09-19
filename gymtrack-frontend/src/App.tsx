import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './shared/context/AuthContext'
import { ToastProvider } from './shared/hooks/useToast'
import CommandPalette from './shared/components/CommandPalette'
import SociosPage from './features/socios/view/SociosPage'
import RutinasList from './features/rutinas/components/RutinasList'
import RutinaForm from './features/rutinas/components/RutinaForm'
import RutinasDetail from './features/rutinas/components/RutinasDetail'
import MembresiasList from './features/membresias/components/MembresiasList'
import MembresiasForm from './features/membresias/components/MembresiasForm'
import MembresiasDetail from './features/membresias/components/MembresiasDetail'
import PagosList from './features/pagos/components/PagosList'
import PagosForm from './features/pagos/components/PagosForm'
import LoginPage from './features/auth/view/LoginPage'
import ProtectedRoute from './shared/components/ProtectedRoute'
import DashboardPage from './features/dashboard/view/DashboardPage'
import AccesoPage from './features/asistencias/view/AccesoPage'
import DisciplinasPage from './features/disciplinas/view/DisciplinasPage'
import NotificacionesPage from './features/notificaciones/view/NotificacionesPage'
import ReportesPage from './features/reportes/view/ReportesPage'
import FichaMedicaPage from './features/socios/view/FichaMedicaPage'
import SocioPerfilPage from './features/socios/view/SocioPerfilPage'
import SaldarDeudaPage from './features/membresias/view/SaldarDeudaPage'
import EjerciciosPage from './features/ejercicios/view/EjerciciosPage'
import MaquinasPage from './features/maquinas/view/MaquinasPage'

// ── Sidebar ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/',             label: 'Dashboard',      end: true },
  { to: '/acceso',       label: 'Acceso',         end: false },
  { to: '/socios',       label: 'Socios',         end: false },
  { to: '/rutinas',      label: 'Rutinas',        end: false },
  { to: '/membresias',   label: 'Membresías',     end: false },
  { to: '/pagos',        label: 'Pagos',          end: false },
  { to: '/disciplinas',  label: 'Disciplinas',    end: false },
  { to: '/ejercicios',   label: 'Ejercicios',     end: false },
  { to: '/maquinas',     label: 'Máquinas',       end: false },
  { to: '/reportes',     label: 'Reportes',       end: false },
  { to: '/notificaciones', label: 'Notificaciones', end: false },
]

function Sidebar() {
  return (
    <aside className="gt-sidebar">
      <nav>
        {NAV_LINKS.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => 'gt-sidebar-link' + (isActive ? ' active' : '')}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
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
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('gt-dark') === '1' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('gt-dark', dark ? '1' : '0') } catch {}
  }, [dark])

  return (
    <>
      <header className="gt-topbar">
        <span className="gt-topbar-brand">GymTrack</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            <kbd style={{ fontSize: 10, opacity: 0.75, background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: 3 }}>Ctrl+K</kbd>
          </button>
          <button
            className="gt-dark-toggle"
            onClick={() => setDark(d => !d)}
            title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {dark ? <IconSun /> : <IconMoon />}
            <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <span className="gt-topbar-user">
            {user?.username} — {user?.rol}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              borderRadius: 6,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <CommandPalette />
      <div className="gt-layout">
        <Sidebar />
        <main className="gt-content">
          <Routes>
            <Route path="/"                            element={<DashboardPage />} />
            <Route path="/acceso"                      element={<AccesoPage />} />
            <Route path="/socios"                      element={<SociosPage />} />
            <Route path="/socios/:socioId/perfil"      element={<SocioPerfilPage />} />
            <Route path="/socios/:socioId/ficha"       element={<FichaMedicaPage />} />
            <Route path="/rutinas"                     element={<RutinasList />} />
            <Route path="/rutinas/nueva"               element={<RutinaForm />} />
            <Route path="/rutinas/editar/:id"          element={<RutinaForm />} />
            <Route path="/rutinas/:id"                 element={<RutinasDetail />} />
            <Route path="/membresias"                  element={<MembresiasList />} />
            <Route path="/membresias/nueva"            element={<MembresiasForm />} />
            <Route path="/membresias/:id"              element={<MembresiasDetail />} />
            <Route path="/pagos"                       element={<PagosList />} />
            <Route path="/pagos/nuevo"                 element={<PagosForm />} />
            <Route path="/pagos/saldar"                element={<SaldarDeudaPage />} />
            <Route path="/disciplinas"                 element={<DisciplinasPage />} />
            <Route path="/ejercicios"                  element={<EjerciciosPage />} />
            <Route path="/maquinas"                    element={<MaquinasPage />} />
            <Route path="/notificaciones"              element={<NotificacionesPage />} />
            <Route path="/reportes"                    element={<ReportesPage />} />
            <Route path="*"                            element={<Navigate to="/" replace />} />
          </Routes>
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
