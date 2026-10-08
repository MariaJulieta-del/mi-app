import { useState } from 'react'
import { KeyRound, LogOut, Mail, Moon, Phone } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { CargandoPagina } from '../../../shared/components/ui'
import { useAuth } from '../../../shared/context/AuthContext'
import { useToast } from '../../../shared/hooks/useToast'
import { useTema } from '../../../shared/hooks/useTema'
import MembresiaResumen from '../../membresias/components/MembresiaResumen'
import { CambiarPinModal } from '../../socios/components/PinModales'
import { cambiarMiPin } from '../../socios/services/socioService'
import { useSocioApp } from '../SocioAppContext'

/** "Yo": datos del socio, membresía, PIN, tema y cerrar sesión */
export default function SocioCuentaPage() {
  const { socio, membresia, cargando } = useSocioApp()
  const { login, logout } = useAuth()
  const toast = useToast()
  const [oscuro, setOscuro] = useTema()
  const [cambiandoPin, setCambiandoPin] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  if (cargando || !socio) return <CargandoPagina resumen={false} filas={3} />

  const cambiarPin = async (actual: string, nuevo: string) => {
    login(await cambiarMiPin(actual, nuevo))
    setCambiandoPin(false)
    toast.success('PIN cambiado', 'Usá el nuevo PIN la próxima vez que entres')
  }

  return (
    <div className="gt-socio-pagina">
      <section className="gt-card gt-socio-yo">
        <span className="gt-avatar grande" aria-hidden>{`${socio.nombre?.[0] ?? ''}${socio.apellido?.[0] ?? ''}`.toUpperCase()}</span>
        <h1>{socio.nombre} {socio.apellido}</h1>
        <p className="gt-text-muted">DNI {socio.dni}</p>
        <div className="gt-socio-yo-datos">
          {socio.telefono && <span><Phone size={14} aria-hidden /> {socio.telefono}</span>}
          {socio.email && <span><Mail size={14} aria-hidden /> {socio.email}</span>}
        </div>
        <p className="gt-text-sm gt-text-muted" style={{ margin: '8px 0 0' }}>Para cambiar tus datos, pedilo en recepción.</p>
      </section>

      <MembresiaResumen m={membresia} />

      <section className="gt-card gt-socio-ajustes">
        <label className="gt-socio-ajuste">
          <Moon size={18} aria-hidden />
          <span style={{ flex: 1 }}>Modo oscuro</span>
          <span className="gt-switch"><input type="checkbox" checked={oscuro} onChange={e => setOscuro(e.target.checked)} aria-label="Modo oscuro" /></span>
        </label>
        <button type="button" className="gt-socio-ajuste" onClick={() => setCambiandoPin(true)}>
          <KeyRound size={18} aria-hidden /><span style={{ flex: 1 }}>Cambiar mi PIN</span>
        </button>
        <button type="button" className="gt-socio-ajuste peligro" onClick={() => setSaliendo(true)}>
          <LogOut size={18} aria-hidden /><span style={{ flex: 1 }}>Cerrar sesión</span>
        </button>
      </section>

      {cambiandoPin && <CambiarPinModal onGuardar={cambiarPin} onCerrar={() => setCambiandoPin(false)} />}
      <ConfirmModal open={saliendo} title="Cerrar sesión" message="Vas a tener que volver a entrar con tu DNI y PIN."
        confirmLabel="Cerrar sesión" cancelLabel="Cancelar" danger onConfirm={() => { setSaliendo(false); logout() }} onCancel={() => setSaliendo(false)} />
    </div>
  )
}
