/** Motivos para elegir al dar de baja a un socio (mismos códigos que el backend) */
export const MOTIVOS_BAJA: { valor: string; texto: string }[] = [
  { valor: 'PRECIO',          texto: 'Precio / no puede pagar' },
  { valor: 'HORARIOS',        texto: 'Los horarios no le sirven' },
  { valor: 'FALTA_TIEMPO',    texto: 'Falta de tiempo' },
  { valor: 'MUDANZA',         texto: 'Se mudó / le queda lejos' },
  { valor: 'SALUD',           texto: 'Lesión o salud' },
  { valor: 'SIN_RESULTADOS',  texto: 'No ve resultados / se aburrió' },
  { valor: 'ATENCION',        texto: 'Atención de profes o recepción' },
  { valor: 'INSTALACIONES',   texto: 'Instalaciones o máquinas' },
  { valor: 'OTRO_GIMNASIO',   texto: 'Se fue a otro gimnasio' },
  { valor: 'OTRO',            texto: 'Otro motivo' },
]

export const textoMotivoBaja = (valor?: string | null) =>
  MOTIVOS_BAJA.find(m => m.valor === valor)?.texto ?? 'Sin especificar'
