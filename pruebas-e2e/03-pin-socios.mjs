// Ingreso del socio con DNI + PIN
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, esperar, terminar } from './comun.mjs'

const exp = t => JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString()).exp
const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()

console.log('\nAlta con PIN')
let r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Dani', apellido: 'Pin', dni: '33' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const A = { id: r.data.socioId, dni: '33' + suf, pin: r.data.pin }
check(/^[0-9]{4}$/.test(A.pin ?? ''), `el alta devuelve un PIN de 4 dígitos (${A.pin})`)
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Eli', apellido: 'Pin', dni: '34' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const B = { id: r.data.socioId, dni: '34' + suf, pin: r.data.pin }

console.log('\nLogin socio (llamadas por IP: máximo 10 por minuto)')
r = await req('POST', '/auth/login-socio', { body: { dni: A.dni } })                                           // 1
check(r.status === 400, 'sin PIN → pide el PIN', r.status)
const otro = A.pin === '5831' ? '5832' : '5831'
r = await req('POST', '/auth/login-socio', { body: { dni: A.dni, pin: otro } })                                // 2
check(r.status === 401 && /DNI o PIN incorrectos/.test(r.data.error), 'PIN incorrecto → mensaje genérico', JSON.stringify(r.data))
r = await req('POST', '/auth/login-socio', { body: { dni: A.dni, pin: A.pin } })                               // 3
check(r.status === 200, 'DNI + PIN correctos → entra')
const tok1 = r.data.token
const dias = (exp(tok1) * 1000 - Date.now()) / 86400000
check(dias > 29 && dias < 31, `la sesión del socio dura ~30 días (${dias.toFixed(1)})`)

console.log('\nBloqueo por DNI (5 PIN fallidos)')
const malB = B.pin === '5831' ? '5832' : '5831'
for (let i = 0; i < 5; i++) await req('POST', '/auth/login-socio', { body: { dni: B.dni, pin: malB } })        // 4-8
r = await req('POST', '/auth/login-socio', { body: { dni: B.dni, pin: B.pin } })                               // 9
check(r.status === 429, 'después de 5 fallos, ni el PIN correcto entra (429)', r.status)

console.log('\nLogin de staff ya no sirve para socios')
r = await req('POST', '/auth/login', { body: { username: A.dni, password: A.dni } })
check(r.status === 401, 'usuario=DNI / contraseña=DNI ya NO entra', r.status)
r = await req('POST', '/auth/login', { body: { username: A.dni, password: A.pin } })
check(r.status === 401, 'el socio tampoco entra por el login de staff con su PIN', r.status)

console.log('\nPIN nuevo generado por el staff')
check((await req('GET', `/socios/${A.id}`, { token: tok1 })).status === 200, 'el token actual funciona')
await esperar(1100)
r = await req('POST', `/socios/${A.id}/pin`, { token: admin })
check(r.status === 200 && /^[0-9]{4}$/.test(r.data.pin) && r.data.pin !== A.pin, 'el staff genera un PIN nuevo', JSON.stringify(r.data))
const pin2 = r.data.pin
r = await req('GET', `/socios/${A.id}`, { token: tok1 })
check(r.status === 401, 'la sesión vieja del socio se cerró', r.status)
check((await req('POST', `/socios/${A.id}/pin`, { token: tok1 })).status === 401, 'un socio no puede generar PINs')
r = await req('POST', '/auth/login-socio', { body: { dni: A.dni, pin: pin2 } })                                // 10
check(r.status === 200, 'entra con el PIN nuevo', r.status)
const tok2 = r.data.token

console.log('\nEl socio cambia su PIN')
r = await req('POST', '/auth/cambiar-pin', { token: tok2, body: { pinActual: pin2, pinNuevo: '1234' } })
check(r.status === 400, 'rechaza un PIN obvio (1234)', r.status)
r = await req('POST', '/auth/cambiar-pin', { token: tok2, body: { pinActual: pin2, pinNuevo: A.dni.slice(-4) } })
check(r.status === 400, 'rechaza el final del DNI', r.status)
r = await req('POST', '/auth/cambiar-pin', { token: tok2, body: { pinActual: '0000', pinNuevo: '5927' } })
check(r.status === 400, 'rechaza si el PIN actual es incorrecto', r.status)
await esperar(1100)
r = await req('POST', '/auth/cambiar-pin', { token: tok2, body: { pinActual: pin2, pinNuevo: '5927' } })
check(r.status === 200 && r.data.token, 'cambia el PIN y recibe una sesión nueva', JSON.stringify(r.data))
const tok3 = r.data.token
check((await req('GET', `/socios/${A.id}`, { token: tok3 })).status === 200, 'la sesión nueva funciona')
check((await req('GET', `/socios/${A.id}`, { token: tok2 })).status === 401, 'la sesión anterior quedó cerrada')

console.log('\nPIN pendientes (socios sin PIN)')
r = await req('POST', '/socios', { token: admin, body: { nombre: 'Fede', apellido: 'SinPin', dni: '35' + suf, activo: true } })
check(r.status < 300, 'socio creado sin usuario', r.status)
r = await req('POST', '/auth/pines-pendientes', { token: admin })
const fede = r.data?.find?.(x => x.dni === '35' + suf)
check(r.status === 200 && fede && /^[0-9]{4}$/.test(fede.pin), 'el admin genera los PIN pendientes', JSON.stringify(r.data))
check(!r.data.some(x => x.dni === A.dni), 'no regenera el PIN de quien ya tenía')
r = await req('POST', '/auth/pines-pendientes', { token: admin })
check(r.status === 200 && r.data.length === 0, 'una segunda vez no genera nada')
r = await req('GET', '/auditoria', { token: admin })
check(r.data.some(a => a.accion === 'Generó un PIN nuevo para el socio' && a.socioId === A.id), 'la auditoría registra el PIN nuevo')
check(r.data.some(a => a.accion === 'Cambió su PIN'), 'la auditoría registra el cambio de PIN del socio')

terminar()
