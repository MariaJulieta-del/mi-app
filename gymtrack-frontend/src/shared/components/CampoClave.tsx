import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Campo de contraseña o PIN con el ojo para ver lo que se escribe */
export default function CampoClave(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="gt-campo-clave">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button type="button" className="gt-campo-clave-ojo" onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Ocultar' : 'Mostrar lo que escribo'} title={visible ? 'Ocultar' : 'Mostrar'} aria-pressed={visible}>
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </span>
  )
}
