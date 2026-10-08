/** Número físico de la máquina, bien visible (o aviso de que falta cargarlo) */
export default function NroMaquina({ nro, chico = false }: { nro?: string | null; chico?: boolean }) {
  const tiene = !!nro && nro.trim() !== ''
  return (
    <span className={`gt-maq-nro${tiene ? '' : ' sin'}${chico ? ' chico' : ''}`}
      title={tiene ? `Máquina N° ${nro}` : 'Sin número: cargalo para que el socio sepa a cuál ir'}>
      {tiene ? <><small>N°</small>{nro}</> : <small>sin N°</small>}
    </span>
  )
}
