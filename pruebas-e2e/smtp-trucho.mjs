// Servidor de mail "trucho" para probar los envíos sin mandar mails de verdad.
// Acepta todo lo que llega por SMTP y lo guarda en pruebas-e2e/mails-recibidos.json.
//
// Uso:  node pruebas-e2e/smtp-trucho.mjs            (escucha en el puerto 2525)
// Y levantar el backend apuntando a este servidor (ver LEEME.md, "Probar los mails").
import net from 'node:net'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUERTO = Number(process.env.SMTP_PORT ?? 2525)
const ARCHIVO = join(dirname(fileURLToPath(import.meta.url)), 'mails-recibidos.json')
const recibidos = []
writeFileSync(ARCHIVO, '[]')

/** Decodifica el asunto si viene en =?UTF-8?B?...?= o =?UTF-8?Q?...?= */
function decodificar(s) {
  return s.replace(/=\?utf-8\?([bq])\?([^?]*)\?=/gi, (_, tipo, txt) =>
    tipo.toLowerCase() === 'b'
      ? Buffer.from(txt, 'base64').toString('utf8')
      : Buffer.from(txt.replace(/_/g, ' ').replace(/=([0-9a-f]{2})/gi, (__, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8'))
}

/** Cuerpo legible: deshace quoted-printable / base64 */
function cuerpoLegible(cab, cuerpo) {
  const cte = /^Content-Transfer-Encoding: *(\S+)/mi.exec(cab)?.[1]?.toLowerCase()
  if (cte === 'quoted-printable') {
    const bytes = cuerpo.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    return Buffer.from(bytes, 'latin1').toString('utf8')
  }
  if (cte === 'base64') return Buffer.from(cuerpo.replace(/\s/g, ''), 'base64').toString('utf8')
  return cuerpo
}

net.createServer(sock => {
  let mail = { de: null, para: [] }
  let enDatos = false
  let datos = ''
  let pendiente = ''
  const responder = l => sock.write(l + '\r\n')
  responder('220 smtp-trucho listo')

  sock.on('data', chunk => {
    pendiente += chunk.toString('utf8')
    let i
    while ((i = pendiente.indexOf('\r\n')) >= 0) {
      const linea = pendiente.slice(0, i)
      pendiente = pendiente.slice(i + 2)
      if (enDatos) {
        if (linea === '.') {
          enDatos = false
          const [cab, ...cuerpo] = datos.split('\r\n\r\n')
          const asunto = /^Subject: (.*(?:\r\n[ \t].*)*)/mi.exec(cab)?.[1]?.replace(/\r\n[ \t]/g, '') ?? ''
          const registro = { ...mail, asunto: decodificar(asunto), cuerpo: cuerpoLegible(cab, cuerpo.join('\r\n\r\n')).slice(0, 2000), recibido: new Date().toISOString() }
          recibidos.push(registro)
          writeFileSync(ARCHIVO, JSON.stringify(recibidos, null, 2))
          console.log(`✉  ${registro.para.join(', ')} — ${registro.asunto}`)
          mail = { de: null, para: [] }
          datos = ''
          responder('250 OK guardado')
        } else {
          datos += (linea.startsWith('..') ? linea.slice(1) : linea) + '\r\n'
        }
        continue
      }
      const cmd = linea.slice(0, 4).toUpperCase()
      if (cmd === 'EHLO' || cmd === 'HELO') { sock.write('250-smtp-trucho\r\n250 OK\r\n') }
      else if (cmd === 'MAIL') { mail.de = /<(.*)>/.exec(linea)?.[1] ?? null; responder('250 OK') }
      else if (cmd === 'RCPT') { mail.para.push(/<(.*)>/.exec(linea)?.[1] ?? ''); responder('250 OK') }
      else if (cmd === 'DATA') { enDatos = true; responder('354 Mandá el mensaje, terminá con .') }
      else if (cmd === 'QUIT') { responder('221 Chau'); sock.end() }
      else responder('250 OK')
    }
  })
  sock.on('error', () => {})
}).listen(PUERTO, () => console.log(`smtp-trucho escuchando en el puerto ${PUERTO} → ${ARCHIVO}`))
