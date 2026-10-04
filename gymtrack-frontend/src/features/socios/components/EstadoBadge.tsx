/** Etiqueta ACTIVO / INACTIVO del socio */
export default function EstadoBadge({ activo, estado }: { activo?: boolean; estado?: string }) {
  const inactivo = activo === false || estado === 'INACTIVO'
  return (
    <span className={inactivo ? 'gt-badge gt-badge-red' : 'gt-badge gt-badge-green'}>
      {inactivo ? 'INACTIVO' : 'ACTIVO'}
    </span>
  )
}
