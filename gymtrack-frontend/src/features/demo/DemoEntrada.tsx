import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Dumbbell, Smartphone, Loader2 } from 'lucide-react'
import { useAuth } from '../../shared/context/AuthContext'
import { despertarServidor, entrarDemo, type RolDemo } from './demo'

const OPCIONES: { rol: RolDemo; titulo: string; detalle: string; puntos: string[]; icono: typeof Building2; principal?: boolean }[] = [
  { rol: 'ADMIN', titulo: 'Entrar como dueño', detalle: 'El gimnasio completo, como lo ve quien lo maneja', icono: Building2, principal: true,
    puntos: ['Resumen del día: quién vino, quién debe la cuota', 'Socios, cobros y cierre de caja', 'Reportes y socios que dejaron de venir'] },
  { rol: 'SOCIO', titulo: 'Entrar como socio', detalle: 'La app que cada socio tiene en su celular', icono: Smartphone,
    puntos: ['La rutina del día y el modo entrenar', 'Progreso, racha y récords', 'Reservar clases y ver la cuota'] },
  { rol: 'PROFESOR', titulo: 'Entrar como profesor', detalle: 'La herramienta del turno en la sala y la recepción', icono: Dumbbell,
    puntos: ['Lo que hay que atender hoy', 'Registrar ingresos y asignar rutinas', 'Clases del día y asistencia'] },
]

/** Pantalla de entrada de la demo pública: sin usuario ni contraseña, pensada primero para el celular */
export default function DemoEntrada() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [cargando, setCargando] = useState<RolDemo | null>(null)
  const [lento, setLento] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { despertarServidor() }, [])

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
        <p className="gt-demo-paso">Elegí cómo querés verlo. <b>No hace falta usuario ni contraseña.</b></p>

        <div className="gt-demo-opciones">
          {OPCIONES.map(o => (
            <button key={o.rol} type="button" className={'gt-demo-op' + (o.principal ? ' principal' : '')} onClick={() => entrar(o.rol)} disabled={cargando !== null}>
              <span className="gt-demo-op-ico">{cargando === o.rol ? <Loader2 size={22} className="gt-girar" aria-hidden /> : <o.icono size={22} aria-hidden />}</span>
              <span><b>{o.titulo}</b><small>{o.detalle}</small><ul className="gt-demo-puntos">{o.puntos.map(p => <li key={p}>{p}</li>)}</ul></span>
            </button>
          ))}
        </div>

        {cargando && lento && <p className="gt-demo-nota">Despertando el servidor de la demo… puede tardar hasta un minuto la primera vez.</p>}
        {error && <p className="gt-demo-error">{error}</p>}

        <p className="gt-demo-nota">Es un gimnasio inventado: cargá socios, cobrá y reservá lo que quieras. Lo que hagas lo ves solo vos y no cambia nada para los demás. Para cambiar de vista, cerrá sesión desde el menú y elegí otra.</p>
        <p className="gt-demo-firma">Hecho por <b>SerranaDev</b> · Tecnicatura Superior en Desarrollo de Software · ISAUI</p>
      </main>
    </div>
  )
}
