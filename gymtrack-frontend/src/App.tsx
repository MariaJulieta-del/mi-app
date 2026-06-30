import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { Socio } from './types/Socio'
import { obtenerTodos, crearSocio, actualizarSocio, darDeBaja } from './services/socioService'

import SocioForm   from './components/SocioForm'
import SocioTabla  from './components/SocioTabla'

import RutinasList   from './components/RutinasList'
import RutinaForm    from './components/RutinaForm'
import RutinasDetail from './components/RutinasDetail'

import MembresiasList   from './components/MembresiasList'
import MembresiasForm   from './components/MembresiasForm'
import MembresiasDetail from './components/MembresiasDetail'

import PagosList from './components/PagosList'
import PagosForm from './components/PagosForm'

// ──────────────────────────────────────────────
// Sidebar links
// ──────────────────────────────────────────────
const NAV_LINKS = [
  { to: '/',           label: 'Socios'      },
  { to: '/rutinas',    label: 'Rutinas'     },
  { to: '/membresias', label: 'Membresías'  },
  { to: '/pagos',      label: 'Pagos'       },
]

function Sidebar() {
  return (
    <aside className="gt-sidebar">
      <nav>
        {NAV_LINKS.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              'gt-sidebar-link' + (isActive ? ' active' : '')
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

// ──────────────────────────────────────────────
// Página Socios (lógica original)
// ──────────────────────────────────────────────
function SociosPage() {
  const [socios, setSocios]           = useState<Socio[]>([])
  const [socioEditar, setSocioEditar] = useState<Socio | null>(null)
  const [mensaje, setMensaje]         = useState('')
  const [error, setError]             = useState('')

  useEffect(() => { cargarSocios() }, [])

  const cargarSocios = async () => {
    try { setSocios(await obtenerTodos()) }
    catch { setError('Error al cargar los socios') }
  }

  const handleGuardar = async (socio: Socio) => {
    try {
      socioEditar?.id
        ? await actualizarSocio(socioEditar.id, socio)
        : await crearSocio(socio)
      setMensaje(socioEditar?.id ? 'Socio actualizado' : 'Socio registrado')
      setSocioEditar(null)
      setError('')
      cargarSocios()
    } catch {
      setError('Error: el DNI ya existe o hay un problema con los datos')
      setMensaje('')
    }
  }

  const handleEliminar = async (id: number) => {
    try { await darDeBaja(id); setMensaje('Socio dado de baja'); cargarSocios() }
    catch { setError('Error al dar de baja al socio') }
  }

  return (
    <>
      <h1 className="gt-page-title">Socios</h1>

      {mensaje && (
        <div className="gt-alert gt-alert-success">
          {mensaje}
          <button onClick={() => setMensaje('')} style={{ float:'right', background:'none', border:'none', cursor:'pointer', color:'inherit' }}>✕</button>
        </div>
      )}
      {error && (
        <div className="gt-alert gt-alert-error">
          {error}
          <button onClick={() => setError('')} style={{ float:'right', background:'none', border:'none', cursor:'pointer', color:'inherit' }}>✕</button>
        </div>
      )}

      <SocioForm
        onGuardar={handleGuardar}
        socioEditar={socioEditar}
        onCancelar={() => setSocioEditar(null)}
      />
      <SocioTabla
        socios={socios}
        onEditar={(s) => setSocioEditar(s)}
        onEliminar={handleEliminar}
      />
    </>
  )
}

// ──────────────────────────────────────────────
// App principal
// ──────────────────────────────────────────────
export default function App() {
  return (
    <>
      {/* Top bar */}
      <header className="gt-topbar">
        <span className="gt-topbar-brand">💪 GymTrack</span>
        <span className="gt-topbar-user">Julieta G. — Administrador</span>
      </header>

      <div className="gt-layout">
        <Sidebar />

        <main className="gt-content">
          <Routes>
            <Route path="/"                       element={<SociosPage />} />
            <Route path="/rutinas"                element={<RutinasList />} />
            <Route path="/rutinas/nueva"          element={<RutinaForm />} />
            <Route path="/rutinas/editar/:id"     element={<RutinaForm />} />
            <Route path="/rutinas/:id"            element={<RutinasDetail />} />
            <Route path="/membresias"             element={<MembresiasList />} />
            <Route path="/membresias/nueva"       element={<MembresiasForm />} />
            <Route path="/membresias/:id"         element={<MembresiasDetail />} />
            <Route path="/pagos"                  element={<PagosList />} />
            <Route path="/pagos/nuevo"            element={<PagosForm />} />
          </Routes>
        </main>
      </div>
    </>
  )
}
