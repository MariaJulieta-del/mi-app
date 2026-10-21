/** Atribución que exigen los términos de las imágenes de ejercicios (dataset hasaneyldrm/exercises-dataset) */
export default function CreditoImagenes({ style }: { style?: React.CSSProperties }) {
  return (
    <p className="gt-text-muted" style={{ fontSize: 11, margin: '10px 0 0', textAlign: 'center', ...style }}>
      Imágenes de ejercicios: © Gym visual —{' '}
      <a href="https://gymvisual.com/" target="_blank" rel="noopener noreferrer">gymvisual.com</a>
    </p>
  )
}
