import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Flame, Play, QrCode, Target, TrendingUp, Trophy } from 'lucide-react'
import { CargandoPagina, Pill } from '../../../shared/components/ui'
import { PasesMeter } from '../../membresias/components/MembresiaResumen'
import AvisosSocio from '../../socios/components/AvisosSocio'
import { colorDisciplina } from '../../disciplinas/utils/disciplinaUtils'
import { formatFecha } from '../../../shared/utils/fechas'
import { useSocioApp } from '../SocioAppContext'
import { misClases, obtenerLogros, type ClaseAgenda, type Logros } from '../services/socioAppService'
import { cuandoClase, ESTADO_CLASE, fechaLarga, proximoDia, rutinaDeHoy, saludo } from '../utils'

/** Inicio del socio: qué le toca hoy, su membresía, sus próximas clases y cómo viene el mes */
export default function SocioInicioPage() {
  const { socioId, socio, membresia, rutinas, cargando } = useSocioApp()
  const [clases, setClases] = useState<ClaseAgenda[] | null>(null)
  const [logros, setLogros] = useState<Logros | null>(null)
  const [ahora] = useState(() => Date.now())

  useEffect(() => {
    misClases().then(setClases).catch(() => setClases([]))
    obtenerLogros(socioId).then(setLogros).catch(() => {})
  }, [socioId])

  if (cargando) return <CargandoPagina resumen={false} filas={4} />

  const hoy = rutinaDeHoy(rutinas)
  const vigente = membresia && membresia.estadoMembresia === 'ACTIVA' && (membresia.diasRestantes ?? 0) >= 0
  const dias = membresia?.diasRestantes ?? 0
  // Rutina armada o renovada (ejercicios cambiados) en los últimos 7 días
  const reciente = (iso?: string | null) => !!iso && ahora - new Date(iso).getTime() < 7 * 86400000
  const nueva = rutinas.find(r => reciente(r.fechaRenovacion ?? r.fechaCreacion))
  const renovada = !!nueva && !reciente(nueva.fechaCreacion)

  return (
    <div className="gt-socio-pagina">
      <header className="gt-socio-saludo">
        <p>{fechaLarga()}</p>
        <h1>{saludo()}, {socio?.nombre ?? ''} 👋</h1>
      </header>

      {/* Membresía: solo si hay algo que avisar */}
      {!vigente && (
        <div className="gt-alert gt-alert-error">
          {membresia ? 'Tu membresía no está vigente. Renovala en recepción para poder ingresar.' : 'Todavía no tenés una membresía. Consultá en recepción.'}
        </div>
      )}

      {/* Lo de hoy */}
      <section className="gt-socio-hero">
        {hoy ? (
          <>
            <span className="gt-socio-hero-eti">Hoy te toca</span>
            <h2>{hoy.rutina.nombre}</h2>
            <p>Día {hoy.dia}{hoy.rutina.cantidadEjercicios ? ` · ${hoy.rutina.cantidadEjercicios} ejercicios en la rutina` : ''}</p>
            <Link to={`/rutinas/${hoy.rutina.id}/entrenar?dia=${hoy.dia}`} className="gt-socio-hero-btn">
              <Play size={20} fill="currentColor" aria-hidden /> Empezar entrenamiento
            </Link>
          </>
        ) : rutinas.length > 0 ? (
          <>
            <span className="gt-socio-hero-eti">Hoy</span>
            <h2>Día de descanso 😌</h2>
            <p>{proximoDia(rutinas[0]) ? `Tu próximo entrenamiento es ${proximoDia(rutinas[0])}.` : 'Recuperarse también es entrenar.'}</p>
            <Link to="/mi-rutina" className="gt-socio-hero-btn secundario">Quiero entrenar igual</Link>
          </>
        ) : (
          <>
            <span className="gt-socio-hero-eti">Bienvenido/a</span>
            <h2>Todavía no tenés rutina</h2>
            <p>Pedile a tu profe que te arme una: la vas a ver acá con los videos de cada ejercicio.</p>
          </>
        )}
        {logros && (
          <div className="gt-socio-hero-stats">
            <span><Flame size={16} aria-hidden /> {logros.rachaActual} {logros.rachaActual === 1 ? 'semana' : 'semanas'} de racha</span>
            <span><Target size={16} aria-hidden /> {logros.desafio.actual}/{logros.desafio.meta} días este mes</span>
          </div>
        )}
      </section>

      {rutinas[0]?.paraRenovar && (
        <div className="gt-alert gt-alert-warning">
          ⏰ Hace {rutinas[0].semanasActual} semanas que hacés <strong>{rutinas[0].nombre}</strong>. Pedile a tu profe que te la renueve. <Link to="/mi-rutina">Ver mi rutina</Link>
        </div>
      )}

      {nueva && hoy?.rutina.id !== nueva.id && (
        <div className="gt-alert gt-alert-info">✨ {renovada ? 'Tu profe te renovó la rutina' : 'Tu profe te armó una rutina nueva'}: <Link to={`/rutinas/${nueva.id}`}>{nueva.nombre}</Link></div>
      )}

      {/* Accesos rápidos */}
      <nav className="gt-socio-accesos" aria-label="Accesos rápidos">
        <Link to="/ingreso"><QrCode size={22} aria-hidden /><span>Escanear ingreso</span></Link>
        <Link to="/clases"><CalendarDays size={22} aria-hidden /><span>Reservar clase</span></Link>
        <Link to="/progreso"><TrendingUp size={22} aria-hidden /><span>Mi progreso</span></Link>
      </nav>

      {/* Membresía */}
      {membresia && (
        <section className="gt-card gt-socio-bloque">
          <div className="gt-socio-bloque-cab">
            <h3>Mi membresía</h3>
            {vigente && dias <= 7
              ? <Pill tono="warn">{dias === 0 ? 'Vence hoy' : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`}</Pill>
              : vigente ? <Pill tono="ok">Al día</Pill> : <Pill tono="danger">Vencida</Pill>}
          </div>
          <p className="gt-text-sm gt-text-muted" style={{ margin: '0 0 8px' }}>{membresia.planNombre} · vence el {formatFecha(membresia.fechaVencimiento)}</p>
          <PasesMeter m={membresia} compacto />
        </section>
      )}

      {/* Próximas clases */}
      {clases && clases.length > 0 && (
        <section className="gt-card gt-socio-bloque">
          <div className="gt-socio-bloque-cab">
            <h3>Tus próximas clases</h3>
            <Link to="/clases" className="gt-socio-ver">Ver todas <ChevronRight size={14} aria-hidden /></Link>
          </div>
          {clases.slice(0, 3).map(c => (
            <div key={`${c.disciplinaId}-${c.fecha}-${c.horaInicio}`} className="gt-socio-clase-mini">
              <span className="gt-disc-punto" style={{ background: colorDisciplina(c.color) }} aria-hidden />
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{c.nombre}</strong>
                <small>{cuandoClase(c.fecha)} · {c.horaInicio}</small>
              </span>
              {c.miEstado && <Pill tono={ESTADO_CLASE[c.miEstado].tono}>{c.miEstado === 'ESPERA' ? `${c.miPosicion}° en espera` : ESTADO_CLASE[c.miEstado].texto}</Pill>}
            </div>
          ))}
        </section>
      )}

      {/* Desafío del mes */}
      {logros && (
        <Link to="/progreso" className="gt-card gt-socio-bloque gt-socio-desafio">
          <span className="gt-socio-desafio-icono"><Trophy size={22} aria-hidden /></span>
          <span style={{ flex: 1 }}>
            <strong>{logros.desafio.completado ? '¡Desafío cumplido! 🎉' : logros.desafio.titulo}</strong>
            <span className="gt-barra-progreso" aria-hidden><span style={{ width: `${Math.min(100, (logros.desafio.actual / logros.desafio.meta) * 100)}%` }} /></span>
            <small>{logros.desafio.actual} de {logros.desafio.meta} días · quedan {logros.desafio.diasRestantes} días del mes</small>
          </span>
          <ChevronRight size={18} aria-hidden />
        </Link>
      )}

      <AvisosSocio />
    </div>
  )
}
