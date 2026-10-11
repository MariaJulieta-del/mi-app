// Lista de espera de clases: sin sobreventa, quién pasa cuando se libera un lugar y la última hora.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const hhmm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

async function nuevoSocio(nombre, n) {
  const dni = String(60 + n) + suf
  const r = await req('POST', '/socios/alta', { token: admin, body: { nombre, apellido: 'Espera', dni, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
  const t = (await req('POST', '/auth/login-socio', { body: { dni, pin: r.data?.pin } })).data?.token
  return { id: r.data?.socioId, t, nombre }
}
const socios = []
for (let i = 0; i < 6; i++) socios.push(await nuevoSocio(['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fede'][i], i))
check(socios.every(s => s.t), 'seis socios entran con su PIN')

// Clase de mañana con cupo 1
const man = new Date(Date.now() + 86400000)
const fecha = iso(man)
const dia = DIAS[(man.getDay() + 6) % 7]
const horarios = [{ dia, horaInicio: '10:00', horaFin: '11:00' }]
let r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Spinning ' + suf, cupoMaximo: 1, horarios } })
const disc = r.data?.id
const cuerpo = { disciplinaId: String(disc), fecha, hora: '10:00' }
const estado = async s => (await req('GET', '/reservas/agenda', { token: s.t })).data?.find(x => x.disciplinaId === disc && x.fecha === fecha)

console.log('\nSin sobreventa')
const res = await Promise.all(socios.slice(0, 5).map(s => req('POST', '/reservas', { token: s.t, body: cuerpo })))
const confirmados = res.filter(x => x.data?.estado === 'CONFIRMADA').length
const posiciones = res.filter(x => x.data?.estado === 'ESPERA').map(x => x.data.posicion).sort()
check(confirmados === 1, 'cinco reservan a la vez el único lugar: entra uno solo', JSON.stringify(res.map(x => x.data?.estado ?? x.status)))
check(JSON.stringify(posiciones) === '[1,2,3,4]', 'los otros cuatro quedan en espera con posiciones distintas', JSON.stringify(posiciones))
const orden = []
for (const s of socios.slice(0, 5)) { const c = await estado(s); orden.push({ s, estado: c?.miEstado, pos: c?.miPosicion }) }
const titular = orden.find(o => o.estado === 'CONFIRMADA').s
const espera = orden.filter(o => o.estado === 'ESPERA').sort((x, y) => x.pos - y.pos).map(o => o.s)
r = await req('POST', '/reservas', { token: espera[0].t, body: cuerpo })
check(r.status === 400 && /espera/.test(r.data?.error ?? ''), 'reservar de nuevo estando en espera no le hace perder el lugar', JSON.stringify(r.data))
check((await estado(espera[0])).miPosicion === 1, 'sigue 1° en la espera')

console.log('\nCuando se libera un lugar pasa el primero que puede ir')
const mem = (await req('GET', `/membresias/socio/${espera[0].id}`, { token: admin })).data
await req('PATCH', `/membresias/${mem.id}/estado?nuevoEstado=CANCELADA`, { token: admin })
await req('POST', '/reservas/cancelar', { token: titular.t, body: cuerpo })
check((await estado(espera[1])).miEstado === 'CONFIRMADA', 'el 1° no tiene la cuota vigente: pasa el 2°')
check((await estado(espera[0])).miEstado === 'ESPERA', 'y el 1° sigue esperando')
r = await req('GET', '/notificaciones/mias', { token: espera[1].t })
check((r.data ?? []).some(n => /Se liberó un lugar/.test(n.titulo)), 'al que entró le llega el aviso')

console.log('\nMás cupo, alumno fijo que se va y socio dado de baja')
r = await req('PUT', `/disciplinas/${disc}`, { token: admin, body: { nombre: 'Spinning ' + suf, cupoMaximo: 2, horarios } })
check(r.status === 200, 'el admin sube el cupo a 2')
check((await estado(espera[2])).miEstado === 'CONFIRMADA', 'al subir el cupo entra el siguiente de la espera')

await req('PUT', `/socios/${espera[1].id}/baja`, { token: admin, body: { motivo: 'PRECIO' } })
check((await estado(espera[3])).miEstado === 'CONFIRMADA', 'al dar de baja a un socio, su lugar pasa al que esperaba')

r = await req('POST', '/reservas', { token: socios[5].t, body: cuerpo })
check(r.data?.estado === 'ESPERA', 'otro socio queda en espera')
r = await req('POST', `/disciplinas/${disc}/inscripciones`, { token: admin, body: { socioId: socios[5].id } })
await req('POST', '/reservas/cancelar', { token: socios[5].t, body: cuerpo })
r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Funcional ' + suf, cupoMaximo: 1, horarios } })
const disc2 = r.data?.id
const cuerpo2 = { disciplinaId: String(disc2), fecha, hora: '10:00' }
const fijo = await nuevoSocio('Gabi', 6)
const esperando = await nuevoSocio('Hugo', 7)
await req('POST', `/disciplinas/${disc2}/inscripciones`, { token: admin, body: { socioId: fijo.id } })
r = await req('POST', '/reservas', { token: esperando.t, body: cuerpo2 })
check(r.data?.estado === 'ESPERA', 'clase con su único lugar ocupado por un alumno fijo: queda en espera')
await req('DELETE', `/disciplinas/${disc2}/inscripciones/${fijo.id}`, { token: admin })
const c2 = (await req('GET', '/reservas/agenda', { token: esperando.t })).data?.find(x => x.disciplinaId === disc2 && x.fecha === fecha)
check(c2?.miEstado === 'CONFIRMADA', 'el staff saca al alumno fijo y entra el que esperaba')

console.log('\nÚltima hora antes de la clase')
const ahora = new Date()
const inicio = new Date(ahora.getTime() + 40 * 60000)
if (iso(inicio) !== iso(ahora) || inicio.getHours() >= 23) {
  console.log('  (se saltea: la clase de prueba cruzaría la medianoche)')
} else {
  const fin = new Date(inicio.getTime() + 30 * 60000)
  const hoyDia = DIAS[(ahora.getDay() + 6) % 7]
  r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Ya empieza ' + suf, cupoMaximo: 1, horarios: [{ dia: hoyDia, horaInicio: hhmm(inicio), horaFin: iso(fin) === iso(inicio) ? hhmm(fin) : '23:59' }] } })
  const disc3 = r.data?.id
  const cuerpo3 = { disciplinaId: String(disc3), fecha: iso(ahora), hora: hhmm(inicio) }
  const [x, y] = [fijo, esperando]
  await req('POST', '/reservas', { token: x.t, body: cuerpo3 })
  r = await req('POST', '/reservas', { token: y.t, body: cuerpo3 })
  check(r.data?.estado === 'ESPERA', 'queda en espera de una clase que empieza en 40 minutos')
  await req('POST', '/reservas/cancelar', { token: x.t, body: cuerpo3 })
  const cy = (await req('GET', '/reservas/agenda', { token: y.t })).data?.find(c => c.disciplinaId === disc3)
  check(cy?.miEstado === 'ESPERA' && cy.disponibles === 1, 'en la última hora no se lo confirma solo (no se le cuenta un faltazo sin enterarse)', JSON.stringify(cy))
  r = await req('GET', '/notificaciones/mias', { token: y.t })
  check((r.data ?? []).some(n => /tomalo/.test(n.mensaje)), 'pero se le avisa que hay lugar')
  r = await req('POST', '/reservas', { token: y.t, body: cuerpo3 })
  check(r.data?.estado === 'CONFIRMADA', 'y lo toma desde la espera')
}

terminar()
