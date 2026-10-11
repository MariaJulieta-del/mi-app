import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import LimiteErrores from './shared/components/LimiteErrores'
import { useState, lazy, Suspense } from 'react'
import {
  Bell, CalendarCheck, CalendarDays, ChartColumn, TrendingUp, CircleUser, ClipboardList, Cog, Dumbbell, House, IdCard,
  LogOut, Menu, Moon, ScanLine, Search, Sun, Settings, ShieldCheck, UserCog, Users, Wallet, type LucideIcon,
} from 'lucide-react'
import { useAuth } from './shared/context/AuthContext'
import { useMarca } from './shared/context/MarcaContext'
import { useTema } from './shared/hooks/useTema'
import { SocioAppProvider } from './features/socioapp/SocioAppContext'
import { PedidosRutinaProvider, usePedidosRutina } from './shared/context/PedidosRutinaContext'
import { ToastProvider } from './shared/hooks/useToast'
import CommandPalette from './shared/components/CommandPalette'
import ConfirmModal from './shared/components/ConfirmModal'
import LoginPage from './features/auth/view/LoginPage'
import ProtectedRoute from './shared/components/ProtectedRoute'
import { CargandoPagina } from './shared/components/ui'

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
const MiCuentaPage       = lazy(() => import('./features/cuenta/view/MiCuentaPage'))
const ConfiguracionPage  = lazy(() => import('./features/cuenta/view/ConfiguracionPage'))
const SocioInicioPage    = lazy(() => import('./features/socioapp/view/SocioInicioPage'))
const SocioRutinaPage    = lazy(() => import('./features/socioapp/view/SocioRutinaPage'))
const SocioClasesPage    = lazy(() => import('./features/socioapp/view/SocioClasesPage'))
const SocioProgresoPage  = lazy(() => import('./features/socioapp/view/SocioProgresoPage'))
const SocioCuentaPage    = lazy(() => import('./features/socioapp/view/SocioCuentaPage'))
const SocioPlantillasPage = lazy(() => import('./features/socioapp/view/SocioPlantillasPage'))

// ── Sidebar ───────────────────────────────────────────────────────────────
type Rol = 'ADMIN' | 'PROFESOR'
interface NavItem { to: string; label: string; icono: LucideIcon; end?: boolean; roles: Rol[] }

/** Menú del staff agrupado por tarea */
const NAV_GRUPOS: { titulo: string; items: NavItem[] }[] = [
  { titulo: 'Día a día', items: [
    { to: '/',          label: 'Inicio',         icono: House,          end: true, roles: ['ADMIN'] },
    { to: '/hoy',       label: 'Hoy',            icono: CalendarCheck,  roles: ['ADMIN', 'PROFESOR'] },
    { to: '/acceso',    label: 'Acceso',         icono: ScanLine,       roles: ['ADMIN', 'PROFESOR'] },
  ] },
  { titulo: 'Socios', items: [
    { to: '/socios',     label: 'Socios',        icono: Users,          roles: ['ADMIN', 'PROFESOR'] },
    { to: '/membresias', label: 'Membresías',    icono: IdCard,         roles: ['ADMIN', 'PROFESOR'] },
    { to: '/pagos',      label: 'Pagos',         icono: Wallet,         roles: ['ADMIN'] },
  ] },
  { titulo: 'Entrenamiento', items: [
    { to: '/rutinas',     label: 'Rutinas',      icono: ClipboardList,  roles: ['ADMIN', 'PROFESOR'] },
    { to: '/disciplinas', label: 'Disciplinas',  icono: CalendarDays,   roles: ['ADMIN', 'PROFESOR'] },
    { to: '/ejercicios',  label: 'Ejercicios',   icono: Dumbbell,       roles: ['ADMIN', 'PROFESOR'] },
    { to: '/maquinas',    label: 'Máquinas',     icono: Cog,            roles: ['ADMIN', 'PROFESOR'] },
  ] },
  { titulo: 'Negocio', items: [
    { to: '/reportes',       label: 'Reportes',       icono: ChartColumn, roles: ['ADMIN'] },
    { to: '/notificaciones', label: 'Notificaciones', icono: Bell,        roles: ['ADMIN', 'PROFESOR'] },
    { to: '/auditoria',      label: 'Auditoría',      icono: ShieldCheck, roles: ['ADMIN'] },
  ] },
  { titulo: 'Configuración', items: [
    { to: '/profesores',    label: 'Profesores',     icono: UserCog,     roles: ['ADMIN'] },
    { to: '/configuracion', label: 'Gimnasio',       icono: Settings,    roles: ['ADMIN'] },
    { to: '/cuenta',        label: 'Mi cuenta',      icono: CircleUser,  roles: ['ADMIN', 'PROFESOR'] },
  ] },
]

/** Barra inferior del staff en el celular: lo que más se usa en el salón */
const BOTTOM_LINKS = [
  { to: '/hoy',     label: 'Hoy',     icono: CalendarCheck },
  { to: '/acceso',  label: 'Acceso',  icono: ScanLine },
  { to: '/socios',  label: 'Socios',  icono: Users },
  { to: '/rutinas', label: 'Rutinas', icono: ClipboardList },
]

/** Contador rojo al lado de un ítem del menú (pedidos de rutina sin resolver) */
function Contador({ ruta }: { ruta: string }) {
  const { abiertos } = usePedidosRutina()
  if (ruta !== '/rutinas' || abiertos === 0) return null
  return <span className="gt-nav-contador" aria-label={`${abiertos} ${abiertos === 1 ? 'pedido' : 'pedidos'} de rutina sin resolver`}>{abiertos > 9 ? '9+' : abiertos}</span>
}

function BottomNav({ onMas }: { onMas: () => void }) {
  return (
    <nav className="gt-bottom-nav" aria-label="Navegación principal">
      {BOTTOM_LINKS.map(l => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => 'gt-bottom-link' + (isActive ? ' active' : '')}>
          <span className="gt-nav-icono"><l.icono size={22} aria-hidden /><Contador ruta={l.to} /></span>{l.label}
        </NavLink>
      ))}
      <button type="button" className="gt-bottom-link" onClick={onMas}>
        <Menu size={22} aria-hidden />Más
      </button>
    </nav>
  )
}

/** Barra inferior de la app del socio */
const SOCIO_LINKS = [
  { to: '/',         label: 'Inicio',   icono: House,         end: true },
  { to: '/mi-rutina', label: 'Rutina',  icono: Dumbbell,      end: false },
  { to: '/clases',   label: 'Clases',   icono: CalendarDays,  end: false },
  { to: '/progreso', label: 'Progreso', icono: TrendingUp,    end: false },
  { to: '/yo',       label: 'Yo',       icono: CircleUser,    end: false },
]

function SocioNav() {
  return (
    <nav className="gt-bottom-nav gt-socio-nav" aria-label="Navegación">
      {SOCIO_LINKS.map(l => (
        <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'gt-bottom-link' + (isActive ? ' active' : '')}>
          <l.icono size={22} aria-hidden />{l.label}
        </NavLink>
      ))}
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
        {NAV_GRUPOS.map(g => {
          const items = g.items.filter(l => l.roles.includes(rol as Rol))
          if (items.length === 0) return null
          return (
            <div key={g.titulo} className="gt-nav-grupo">
              <span className="gt-nav-titulo">{g.titulo}</span>
              {items.map(l => (
                <NavLink key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) => 'gt-sidebar-link' + (isActive ? ' active' : '')} onClick={onCerrar}>
                  <l.icono size={18} aria-hidden />{l.label}<Contador ruta={l.to} />
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
      <div style={{ padding: '12px' }}>
        <button type="button" className="gt-logout" onClick={() => setConfirmLogout(true)}>
          <LogOut size={16} aria-hidden /> Cerrar sesión
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

// ── Layout principal (con sidebar + topbar) ───────────────────────────────
/** Logo y nombre del gimnasio */
function Marca() {
  const { marca } = useMarca()
  return (
    <span className="gt-topbar-brand">
      {marca.logo && <img src={marca.logo} alt="" className="gt-topbar-logo" />}
      <span className="gt-topbar-nombre">{marca.nombre}</span>
    </span>
  )
}

function AppLayout() {
  const { user } = useAuth()
  const ubicacion = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [dark, setDark] = useTema()

  return (
    <>
      <header className="gt-topbar">
        <Marca />
        <div className="gt-topbar-acciones">
          {user?.rol !== 'SOCIO' && (
            <button type="button" className="gt-topbar-btn"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              title="Buscar socio (Ctrl+K)" aria-label="Buscar socio">
              <Search size={14} aria-hidden />
              <span className="gt-topbar-texto">Buscar</span>
              <kbd className="gt-topbar-kbd">Ctrl+K</kbd>
            </button>
          )}
          {user?.rol !== 'SOCIO' && (
            <button type="button" className="gt-dark-toggle" onClick={() => setDark(!dark)}
              title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
              {dark ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
              <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
          )}
          {user?.rol !== 'SOCIO' && (
            <span className="gt-topbar-cuenta">
              <span className="gt-topbar-usuario">{user?.username}</span>
              <span className={`gt-topbar-rol ${user?.rol === 'ADMIN' ? 'admin' : 'profesor'}`}>{user?.rol}</span>
            </span>
          )}
        </div>
      </header>

      {user?.rol !== 'SOCIO' && <CommandPalette />}
      <PedidosRutinaProvider>
      <div className="gt-layout">
        {user?.rol !== 'SOCIO' && <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />}
        {user?.rol !== 'SOCIO' && <BottomNav onMas={() => setMenuAbierto(true)} />}
        {user?.rol === 'SOCIO' && <SocioNav />}
        <main className={`gt-content${user?.rol === 'SOCIO' ? ' gt-content-socio' : ' gt-content-staff'}`}>
          <SocioAppProvider>
          <LimiteErrores reinicio={ubicacion.pathname}>
          <Suspense fallback={<CargandoPagina />}>
          <Routes>
            {/* ── Rutas SOCIO ── */}
            {user?.rol === 'SOCIO' && user.socioId && (
              <>
                <Route path="/"                       element={<SocioInicioPage />} />
                <Route path="/mi-rutina"              element={<SocioRutinaPage />} />
                <Route path="/mi-rutina/plantillas"   element={<SocioPlantillasPage />} />
                <Route path="/clases"                 element={<SocioClasesPage />} />
                <Route path="/progreso"               element={<SocioProgresoPage />} />
                <Route path="/yo"                     element={<SocioCuentaPage />} />
                <Route path="/rutinas/:id"            element={<RutinasDetail />} />
                <Route path="/rutinas/:id/entrenar"   element={<EntrenarPage />} />
                <Route path="/ingreso"                element={<EscanearIngresoPage />} />
                <Route path="*"                       element={<Navigate to="/" replace />} />
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
                <Route path="/cuenta"                      element={<MiCuentaPage />} />
                {user?.rol === 'ADMIN' && <Route path="/configuracion" element={<ConfiguracionPage />} />}
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
          </LimiteErrores>
          </SocioAppProvider>
        </main>
      </div>
      </PedidosRutinaProvider>
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
        <Route path="/kiosco" element={<LimiteErrores completa><Suspense fallback={null}><KioscoPage /></Suspense></LimiteErrores>} />
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
