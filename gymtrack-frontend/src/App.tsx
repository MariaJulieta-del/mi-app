import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import SociosPage from './pages/SociosPage'
import RutinasList from './components/RutinasList'
import RutinaForm from './components/RutinaForm'
import RutinasDetail from './components/RutinasDetail'
import MembresiasList from './components/MembresiasList'
import MembresiasForm from './components/MembresiasForm'
import MembresiasDetail from './components/MembresiasDetail'
import PagosList from './components/PagosList'
import PagosForm from './components/PagosForm'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import AccesoPage from './pages/AccesoPage'
import DisciplinasPage from './pages/DisciplinasPage'
import NotificacionesPage from './pages/NotificacionesPage'
import ReportesPage from './pages/ReportesPage'
import FichaMedicaPage from './pages/FichaMedicaPage'
import SocioPerfilPage from './pages/SocioPerfilPage'
import SaldarDeudaPage from './pages/SaldarDeudaPage'
import EjerciciosPage from './pages/EjerciciosPage'
import MaquinasPage from './pages/MaquinasPage'
// ── Sidebar ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
 { to: '/', label: 'Dashboard', end: true },
 { to: '/acceso', label: 'Acceso', end: false },
 { to: '/socios', label: 'Socios', end: false },
 { to: '/rutinas', label: 'Rutinas', end: false },
 { to: '/membresias', label: 'Membresías', end: false },
 { to: '/pagos', label: 'Pagos', end: false },
 { to: '/disciplinas', label: 'Disciplinas', end: false },
 { to: '/ejercicios', label: 'Ejercicios', end: false },
 { to: '/maquinas', label: 'Máquinas', end: false },
 { to: '/reportes', label: 'Reportes', end: false },
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
// ── Layout principal (con sidebar + topbar) ───────────────────────────────
function AppLayout() {
 const { user, logout } = useAuth()
 return (
 <>
 <header className="gt-topbar">
 <span className="gt-topbar-brand"> GymTrack</span>
 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
 <div className="gt-layout">
 <Sidebar />
 <main className="gt-content">
 <Routes>
 {/* Dashboard como raíz */}
 <Route path="/" element={<DashboardPage />} />
 {/* Control de acceso */}
 <Route path="/acceso" element={<AccesoPage />} />
 {/* Socios */}
 <Route path="/socios" element={<SociosPage />} />
 <Route path="/socios/:socioId/perfil" element={<SocioPerfilPage />} />
 <Route path="/socios/:socioId/ficha" element={<FichaMedicaPage />} />
 {/* Rutinas */}
 <Route path="/rutinas" element={<RutinasList />} />
 <Route path="/rutinas/nueva" element={<RutinaForm />} />
 <Route path="/rutinas/editar/:id" element={<RutinaForm />} />
 <Route path="/rutinas/:id" element={<RutinasDetail />} />
 {/* Membresías */}
 <Route path="/membresias" element={<MembresiasList />} />
 <Route path="/membresias/nueva" element={<MembresiasForm />} />
 <Route path="/membresias/:id" element={<MembresiasDetail />} />
 {/* Pagos */}
 <Route path="/pagos" element={<PagosList />} />
 <Route path="/pagos/nuevo" element={<PagosForm />} />
 <Route path="/pagos/saldar" element={<SaldarDeudaPage />} />
 {/* Nuevos módulos Sprint 3 */}
 <Route path="/disciplinas" element={<DisciplinasPage />} />
 <Route path="/ejercicios" element={<EjerciciosPage />} />
 <Route path="/maquinas" element={<MaquinasPage />} />
 <Route path="/notificaciones" element={<NotificacionesPage />} />
 <Route path="/reportes" element={<ReportesPage />} />
 {/* Fallback */}
 <Route path="*" element={<Navigate to="/" replace />} />
 </Routes>
 </main>
 </div>
 </>
 )
}
// ── App raíz ──────────────────────────────────────────────────────────────
export default function App() {
 return (
 <Routes>
 {/* Ruta pública */}
 <Route path="/login" element={<LoginPage />} />
 {/* Todas las demás rutas requieren autenticación */}
 <Route
 path="/*"
 element={
 <ProtectedRoute>
 <AppLayout />
 </ProtectedRoute>
 }
 />
 </Routes>
 )
}
