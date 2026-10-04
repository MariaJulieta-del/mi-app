// Pantalla fija de recepción: solo puede ver el QR y los últimos ingresos
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()

console.log('\nSalud del servicio')
check((await req('GET', '/salud')).status === 200, '/salud responde sin sesión (lo usa Render)')

console.log('\nVincular pantalla')
let r = await req('POST', '/kiosco', { token: admin, body: { nombre: 'Tablet prueba ' + suf } })
check(r.status === 200 && r.data.token, 'el admin vincula una pantalla y recibe su token', JSON.stringify(r.data))
const pantalla = r.data
check((await req('POST', '/kiosco', { token: admin, body: { nombre: '' } })).status === 400, 'el nombre es obligatorio')

// Un socio con ingreso, para ver la lista
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Gabi', apellido: 'Kiosco', dni: '36' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
await req('POST', '/asistencias/checkin', { token: admin, body: { socioId: r.data.socioId } })

console.log('\nLo que SÍ puede la pantalla')
r = await req('GET', '/asistencias/qr-actual', { token: pantalla.token })
check(r.status === 200 && r.data.codigo?.startsWith('GT1.'), 'pide el QR vigente')
r = await req('GET', '/kiosco/ultimos', { token: pantalla.token })
const gabi = r.data?.find?.(x => x.nombre === 'Gabi K.')
check(r.status === 200 && gabi, 've los últimos ingresos con nombre e inicial', JSON.stringify(r.data))
check(gabi && !('dni' in gabi) && !('observacion' in gabi), 'sin DNI ni observaciones')

console.log('\nLo que NO puede la pantalla')
for (const [m, p, desc] of [
  ['GET', '/socios', 'listar socios'], ['GET', '/socios/todos', 'listar todos los socios'],
  ['GET', '/seguimiento/hoy', 'ver la pantalla Hoy'], ['GET', '/asistencias/hoy', 'ver el registro del día'],
  ['POST', '/asistencias/checkin', 'registrar ingresos'], ['GET', '/rutinas/generales', 'ver plantillas'],
  ['GET', '/ejercicios/todos', 'ver el catálogo'], ['GET', '/tarifas', 'ver planes'], ['GET', '/kiosco', 'listar pantallas'],
  ['POST', '/kiosco', 'vincular otra pantalla'],
]) {
  const res = await req(m, p, { token: pantalla.token, body: m === 'POST' ? { socioId: 1, nombre: 'x' } : undefined })
  check(res.status === 403, `no puede ${desc}`, res.status)
}

console.log('\nAdmin: listar y desvincular')
r = await req('GET', '/kiosco', { token: admin })
check(r.data.some(p => p.id === pantalla.id && p.ultimoUso), 'la pantalla aparece con su última conexión')
check((await req('DELETE', `/kiosco/${pantalla.id}`, { token: admin })).status === 204, 'el admin la desvincula')
r = await req('GET', '/asistencias/qr-actual', { token: pantalla.token })
check(r.status === 401, 'la pantalla desvinculada deja de funcionar al instante', r.status)
r = await req('GET', '/auditoria', { token: admin })
check(r.data.some(a => a.accion === 'Vinculó una pantalla de recepción'), 'la auditoría registra la vinculación')
check(r.data.some(a => a.accion === 'Desvinculó una pantalla de recepción'), 'la auditoría registra la desvinculación')

terminar()
