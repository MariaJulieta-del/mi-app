// Historial de pases en el perfil del socio: cuántos le quedan y cuándo los usó.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
await req('POST', '/profesores', { token: admin, body: { username: 'hp' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'hp' + suf, password: 'Profe2026' } })).data?.token

const tipo = 'P' + suf
await req('POST', '/tarifas', { token: admin, body: { tipo, nombre: '8 pases ' + suf, precio: 12000, duracionDias: 30, pasesMensuales: 8 } })
let r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Pía', apellido: 'Pases', dni: '95' + suf, tipoMembresia: tipo, formaDePago: 'EFECTIVO' } })
const socio = r.data?.socioId
const pin = r.data?.pin
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Otro', apellido: 'Socio', dni: '96' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const otro = r.data?.socioId
const pinOtro = r.data?.pin

console.log('\nSin ingresos')
r = await req('GET', `/membresias/socio/${socio}/pases`, { token: admin })
check(r.status === 200 && r.data.tieneMembresia && r.data.actual.restantes === 8 && r.data.actual.pasesMensuales === 8, 'le quedan los 8 pases', JSON.stringify(r.data?.actual))
check(r.data.plan === '8 pases ' + suf && r.data.movimientos.length === 0, 'trae el plan y todavía no hay movimientos')

console.log('\nCon ingresos')
await req('POST', '/asistencias/checkin', { token: admin, body: { socioId: socio } })
await req('POST', '/asistencias/checkin', { token: admin, body: { socioId: socio } })
r = await req('GET', `/membresias/socio/${socio}/pases`, { token: admin })
const movs = r.data?.movimientos ?? []
check(r.data.actual.usados === 1 && r.data.actual.restantes === 7, 'dos ingresos el mismo día gastan un solo pase', JSON.stringify(r.data?.actual))
check(movs.length === 2 && movs.filter(m => m.gastaPase).length === 1 && movs.every(m => m.tipo === 'INGRESO' && m.hora), 'muestra los dos ingresos con hora, y solo uno gasta pase', JSON.stringify(movs))
check(movs[0].fecha >= movs[1].fecha, 'del más reciente al más viejo')

console.log('\nPase libre')
r = await req('GET', `/membresias/socio/${otro}/pases`, { token: admin })
check(r.status === 200 && r.data.actual.libre === true && r.data.actual.restantes === null, 'con pase libre no hay límite', JSON.stringify(r.data?.actual))

console.log('\nQuién lo ve')
check((await req('GET', `/membresias/socio/${socio}/pases`, { token: profe })).status === 200, 'el profe lo ve')
const tSocio = (await req('POST', '/auth/login-socio', { body: { dni: '95' + suf, pin } })).data?.token
check((await req('GET', `/membresias/socio/${socio}/pases`, { token: tSocio })).status === 200, 'el socio ve los suyos')
const tOtro = (await req('POST', '/auth/login-socio', { body: { dni: '96' + suf, pin: pinOtro } })).data?.token
r = await req('GET', `/membresias/socio/${socio}/pases`, { token: tOtro })
check(r.status === 403 || r.status === 404, 'otro socio no ve los de los demás', String(r.status))
check((await req('GET', `/membresias/socio/${socio}/pases`)).status === 401, 'sin sesión → 401')

terminar()
