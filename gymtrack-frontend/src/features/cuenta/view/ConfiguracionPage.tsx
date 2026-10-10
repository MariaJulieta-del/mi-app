import { useEffect, useRef, useState } from 'react'
import { ImagePlus, RotateCcw, Trash2 } from 'lucide-react'
import axiosInstance from '../../../shared/services/axiosInstance'
import { PageHeader } from '../../../shared/components/ui'
import RecordatoriosCuota from '../components/RecordatoriosCuota'
import CopiasSeguridad from '../components/CopiasSeguridad'
import { useMarca, type Marca } from '../../../shared/context/MarcaContext'
import { colorDeTexto } from '../../../shared/utils/colores'
import { useToast } from '../../../shared/hooks/useToast'
import { mensajeError } from '../../../shared/utils/errores'

const VERDE = '#1B5E44'
const SUGERIDOS = ['#1B5E44', '#0F766E', '#1D4ED8', '#4338CA', '#7C3AED', '#BE123C', '#C2410C', '#111827']

/** Cada cuántas semanas hay que renovar la rutina de un socio */
function DuracionRutinas() {
  const toast = useToast()
  const [semanas, setSemanas] = useState<number | null>(null)
  const [guardadas, setGuardadas] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  useEffect(() => {
    axiosInstance.get('/api/v1/configuracion/rutinas')
      .then(r => { setSemanas(r.data.semanasMax); setGuardadas(r.data.semanasMax) })
      .catch(() => {})
  }, [])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (semanas == null) return
    setGuardando(true)
    try {
      const r = (await axiosInstance.put('/api/v1/configuracion/rutinas', { semanasMax: semanas })).data
      setGuardadas(r.semanasMax)
      toast.success('Listo', `Las rutinas se renuevan cada ${r.semanasMax} semanas`)
    } catch (err: unknown) {
      toast.error('No se pudo guardar', mensajeError(err, 'Probá de nuevo'))
    } finally { setGuardando(false) }
  }

  if (semanas == null) return null
  return (
    <form className="gt-card gt-config-rutinas" onSubmit={guardar}>
      <p className="gt-card-title" style={{ marginTop: 0 }}>Duración de las rutinas</p>
      <p className="gt-text-sm gt-text-muted" style={{ marginTop: 0 }}>
        Cuánto tiempo puede un socio hacer la misma rutina. Al pasar el límite aparece como <strong>"para renovar"</strong> en Rutinas,
        en el perfil del socio y en las tareas de Hoy. Se cuenta desde la última vez que el profe cambió los ejercicios.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label className="gt-label" htmlFor="cfg-semanas" style={{ margin: 0 }}>Renovar cada</label>
        <input id="cfg-semanas" className="gt-input" type="number" min={2} max={26} style={{ width: 90 }} value={semanas}
          onChange={e => setSemanas(Number(e.target.value))} />
        <span>semanas</span>
        <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando || semanas === guardadas || semanas < 2 || semanas > 26}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      <span className="gt-hint">Entre 2 y 26 semanas. Lo habitual es entre 4 y 8.</span>
    </form>
  )
}

/** Achica la imagen a 256 px como máximo (el logo se guarda en la base) */
function achicarImagen(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (archivo.type === 'image/svg+xml') {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = reject
      r.readAsDataURL(archivo)
      return
    }
    const img = new Image()
    img.onload = () => {
      const escala = Math.min(1, 256 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * escala)
      c.height = Math.round(img.height * escala)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(archivo)
  })
}

/** Marca del gimnasio: nombre, logo y color. Se ve en la barra, el ingreso y la app del socio. */
export default function ConfiguracionPage() {
  const { marca, aplicar } = useMarca()
  const toast = useToast()
  const archivo = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<Marca>(marca)
  const [guardando, setGuardando] = useState(false)
  const color = form.colorAcento ?? VERDE
  const texto = colorDeTexto(color)

  const elegirLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('El archivo no es una imagen'); return }
    try { setForm(x => ({ ...x, logo: null })); const logo = await achicarImagen(f); setForm(x => ({ ...x, logo })) }
    catch { toast.error('No se pudo leer la imagen') }
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const r = (await axiosInstance.put('/api/v1/configuracion/marca', form)).data as Marca
      aplicar(r)
      toast.success('Listo', 'La marca del gimnasio se actualizó')
    } catch (err: unknown) {
      toast.error('No se pudo guardar', mensajeError(err, 'Probá de nuevo'))
    } finally { setGuardando(false) }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <PageHeader titulo="Gimnasio" subtitulo="Nombre, logo y color: se ven en la barra superior, la pantalla de ingreso y la app del socio" />
      <div className="gt-config-grid">
        <form className="gt-card" onSubmit={guardar}>
          <div className="gt-form-group">
            <label className="gt-label" htmlFor="cfg-nombre">Nombre del gimnasio</label>
            <input id="cfg-nombre" className="gt-input" maxLength={80} required value={form.nombre}
              onChange={e => setForm(x => ({ ...x, nombre: e.target.value }))} />
          </div>

          <div className="gt-form-group">
            <span className="gt-label">Logo</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="gt-config-logo">{form.logo ? <img src={form.logo} alt="Logo actual" /> : <ImagePlus size={22} aria-hidden />}</span>
              <button type="button" className="gt-btn gt-btn-secondary" onClick={() => archivo.current?.click()}>
                {form.logo ? 'Cambiar' : 'Subir logo'}
              </button>
              {form.logo && (
                <button type="button" className="gt-btn gt-btn-secondary" onClick={() => setForm(x => ({ ...x, logo: null }))}>
                  <Trash2 size={15} aria-hidden /> Quitar
                </button>
              )}
              <input ref={archivo} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={elegirLogo} />
            </div>
            <span className="gt-hint">PNG cuadrado con fondo transparente queda mejor. Se achica solo. También se usa como ícono de la pestaña del navegador.</span>
          </div>

          <div className="gt-form-group">
            <span className="gt-label">Color principal</span>
            <div className="gt-config-colores" role="radiogroup" aria-label="Colores sugeridos">
              {SUGERIDOS.map(c => (
                <button key={c} type="button" role="radio" aria-checked={color.toUpperCase() === c} aria-label={c}
                  className={`gt-config-color${color.toUpperCase() === c ? ' activo' : ''}`} style={{ background: c }}
                  onClick={() => setForm(x => ({ ...x, colorAcento: c === VERDE ? null : c }))} />
              ))}
              <label className="gt-config-color otro" title="Otro color">
                <input type="color" value={color} onChange={e => setForm(x => ({ ...x, colorAcento: e.target.value.toUpperCase() }))} aria-label="Elegir otro color" />
              </label>
              {form.colorAcento && (
                <button type="button" className="gt-btn gt-btn-secondary gt-btn-sm" onClick={() => setForm(x => ({ ...x, colorAcento: null }))}>
                  <RotateCcw size={13} aria-hidden /> Original
                </button>
              )}
            </div>
          </div>

          <button type="submit" className="gt-btn gt-btn-primary" disabled={guardando || !form.nombre.trim()}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </form>

        {/* Vista previa */}
        <div>
          <span className="gt-subtitulo">Vista previa</span>
          <div className="gt-config-pestana" aria-hidden>
            <img src={form.logo || '/favicon.svg'} alt="" />
            <span>{form.nombre || 'Tu gimnasio'}</span>
            <span className="gt-config-pestana-x">×</span>
          </div>
          <div className="gt-config-preview" aria-hidden>
            <div className="gt-config-preview-barra" style={{ background: color, color: texto }}>
              {form.logo && <img src={form.logo} alt="" />}
              <strong>{form.nombre || 'Tu gimnasio'}</strong>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Entrenar hoy · Lunes</span>
              <span className="gt-text-sm gt-text-muted">Piernas fuerza — Día 1</span>
              <span style={{ display: 'flex', gap: 8 }}>
                <span className="gt-config-preview-btn" style={{ background: color, color: texto }}>Siguiente →</span>
                <span className="gt-config-preview-chip" style={{ borderColor: color, color }}>Activos</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <DuracionRutinas />
      <RecordatoriosCuota />
      <CopiasSeguridad />
    </div>
  )
}
