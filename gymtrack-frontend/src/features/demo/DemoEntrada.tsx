import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Dumbbell, Smartphone, Loader2 } from 'lucide-react'
import { useAuth } from '../../shared/context/AuthContext'
import { entrarDemo, type RolDemo } from './demo'

const OPCIONES: { rol: RolDemo; titulo: string; detalle: string; icono: typeof Building2; principal?: boolean }[] = [
  { rol: 'ADMIN', titulo: 'Entrar a la demo', detalle: 'Como la dueña del gimnasio: ves todo el sistema', icono: Building2, principal: true },
  { rol: 'SOCIO', titulo: 'Probar la app del socio', detalle: 'Rutina, clases, progreso y el ingreso con QR', icono: Smartphone },
  { rol: 'PROFESOR', titulo: 'Entrar como profesor', detalle: 'Recepción, socios, rutinas y clases', icono: Dumbbell },
]

/** Pantalla de entrada de la demo pública: sin usuario ni contraseña, pensada primero para el celular */
export default function DemoEntrada() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [cargando, setCargando] = useState<RolDemo | null>(null)
  const [lento, setLento] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cargando) return
    const t = setTimeout(() => setLento(true), 4000)
    return () => clearTimeout(t)
  }, [cargando])

  const entrar = async (rol: RolDemo) => {
    setCargando(rol); setLento(false); setError(null)
    try {
      login(await entrarDemo(rol))
      navigate('/')
    } catch {
      setError('No pudimos entrar a la demo. Probá de nuevo en un momento.')
    } finally {
      setCargando(null)
    }
  }

  return (
    <div className="gt-demo-entrada">
      <svg className="gt-demo-sierras" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
        <path d="M0 120 V78 L60 46 L104 70 L168 22 L232 72 L284 44 L344 74 L400 50 V120Z" fill="#12352a" />
        <path d="M0 78 L60 46 L104 70 L168 22 L232 72 L284 44 L344 74 L400 50" fill="none" stroke="#f59e0b" strokeWidth="2" />
      </svg>
      <main className="gt-demo-caja">
        <div className="gt-demo-logo"><span className="gt-demo-iso"><Dumbbell size={30} aria-hidden /></span><span>Gym<b>Track</b></span></div>
        <h1>Probá GymTrack</h1>
        <p className="gt-demo-sub">El sistema para gimnasios de barrio: cobros, ingresos, rutinas y clases, en la compu y en el celular de cada socio.</p>

        <div className="gt-demo-opciones">
          {OPCIONES.map(o => (
            <button key={o.rol} type="button" className={'gt-demo-op' + (o.principal ? ' principal' : '')} onClick={() => entrar(o.rol)} disabled={cargando !== null}>
              <span className="gt-demo-op-ico">{cargando === o.rol ? <Loader2 size={22} className="gt-girar" aria-hidden /> : <o.icono size={22} aria-hidden />}</span>
              <span><b>{o.titulo}</b><small>{o.detalle}</small></span>
            </button>
          ))}
        </div>

        {cargando && lento && <p className="gt-demo-nota">Despertando el servidor de la demo… puede tardar hasta un minuto la primera vez.</p>}
        {error && <p className="gt-demo-error">{error}</p>}

        <p className="gt-demo-nota">Son datos de prueba: tocá lo que quieras. Todo vuelve a como estaba cada madrugada.</p>
        <p className="gt-demo-firma">Hecho por <b>SerranaDev</b> · Tecnicatura Superior en Desarrollo de Software · ISAUI</p>
      </main>
    </div>
  )
}
