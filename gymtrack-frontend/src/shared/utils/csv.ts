/** Un valor de celda listo para el CSV */
export function celdaCSV(v: string | number | null | undefined): string {
  if (v == null) return ''
  let s = typeof v === 'number' ? v.toLocaleString('es-AR', { useGrouping: false }) : String(v)
  // Excel ejecuta como fórmula un texto que empieza con = + - @ (o tabulación / retorno):
  // se antepone un apóstrofo para que quede como texto
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Descarga una tabla como CSV que Excel abre bien en español:
 * separador ";" y BOM UTF-8 para los acentos. Los textos que Excel tomaría como
 * fórmula (por ejemplo un nombre que empieza con "=") se guardan como texto.
 */
export function descargarCSV(nombre: string, encabezados: string[], filas: (string | number | null | undefined)[][]) {
  const texto = [encabezados, ...filas].map(f => f.map(celdaCSV).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre.endsWith('.csv') ? nombre : `${nombre}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
