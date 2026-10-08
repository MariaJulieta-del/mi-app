// Prueba de los mails con el servidor trucho (no manda mails de verdad).
// Necesita: smtp-trucho.mjs corriendo y el backend con mail.enabled=true apuntando a localhost:2525.
// Uso: node pruebas-e2e/mails.mjs   (ver LEEME.md, "Probar los mails")
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { check, req, loginAdmin, esperar, terminar } from './comun.mjs'

const ARCHIVO = join(dirname(fileURLToPath(import.meta.url)), 'mails-recibidos.json')
const leer = () => { try { return JSON.parse(readFileSync(ARCHIVO, 'utf8')) } catch { return [] } }
/** Espera hasta 5 s a que llegue un mail que cumpla la condición */
async function esperarMail(cond) {
  for (let i = 0; i < 25; i++) {
    const m = leer().find(cond)
    if (m) return m
    await esperar(200)
  }
  return null
}

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

console.log('\nAviso personal por mail')
const correo = `trucho${suf}@gymtrack.test`
let r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Mailú', apellido: 'Trucho', dni: '47' + suf, email: correo, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const socio = r.data?.socioId
check(!!socio, 'socio con mail trucho', JSON.stringify(r.data))
r = await req('POST', '/notificaciones', { token: admin, body: { titulo: `Cambio de horario ñandú ${suf}`, mensaje: 'Mañana abrimos a las 8.', socioId: socio, destinatario: 'SOCIO' } })
check(r.status < 300 && r.data?.id, 'se crea el aviso', JSON.stringify(r.data))
let mail = await esperarMail(m => m.para.includes(correo))
check(!!mail, 'llega el mail al socio')
check(mail?.asunto === `[GymTrack] Cambio de horario ñandú ${suf}`, 'el asunto llega con acentos y ñ', mail?.asunto)
check((mail?.cuerpo ?? '').includes('Mañana abrimos a las 8.'), 'trae el mensaje completo y con acentos', mail?.cuerpo)

console.log('\nAviso a todos')
const antes = leer().length
r = await req('POST', '/notificaciones', { token: admin, body: { titulo: `General ${suf}`, mensaje: 'Para todos', destinatario: 'TODOS' } })
check(r.status < 300, 'se crea el aviso general')
mail = await esperarMail(m => m.asunto === `[GymTrack] General ${suf}` && m.para.includes(correo))
check(!!mail, 'el socio con mail también lo recibe')
await esperar(1000)
const generales = leer().slice(antes).filter(m => m.asunto === `[GymTrack] General ${suf}`)
check(generales.every(m => m.para.length === 1), `se manda uno por uno (${generales.length} mails, sin copias a la vista)`)

console.log('\nSocio sin mail')
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Sin', apellido: 'Mail', dni: '48' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
r = await req('POST', '/notificaciones', { token: admin, body: { titulo: `Sin mail ${suf}`, mensaje: 'x', socioId: r.data?.socioId, destinatario: 'SOCIO' } })
check(r.status < 300, 'el aviso se guarda igual (lo ve en la app)')
await esperar(800)
check(!leer().some(m => m.asunto === `[GymTrack] Sin mail ${suf}`), 'y no intenta mandar mail')

terminar()
