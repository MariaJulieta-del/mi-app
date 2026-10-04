// Seguridad, pertenencia, QR de ingreso, rutinas, progreso, métricas y auditoría
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { API, check, req, loginAdmin, esperar, terminar } from './comun.mjs'

const sufijo = String(Date.now()).slice(-6)
const dniA = '30' + sufijo, dniB = '31' + sufijo

console.log('\n1) Login staff y límite de intentos')
for (let i = 0; i < 5; i++) await req('POST', '/auth/login', { body: { username: 'nadie' + sufijo, password: 'mal' } })
let r = await req('POST', '/auth/login', { body: { username: 'nadie' + sufijo, password: 'mal' } })
check(r.status === 429, 'el 6.º intento fallido devuelve 429', r.status)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

console.log('\n2) Alta de socios y cobro')
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Ana', apellido: 'Prueba', dni: dniA, telefono: '11 15 2345-6789', tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
check(r.status === 200 || r.status === 201, 'alta socio A', JSON.stringify(r.data))
const socioA = r.data?.socio?.id ?? r.data?.socioId ?? r.data?.id
const pinA = r.data?.pin
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Beto', apellido: 'Prueba', dni: dniB, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const socioB = r.data?.socio?.id ?? r.data?.socioId ?? r.data?.id
check(socioA && socioB, `ids de socios (${socioA}, ${socioB})`, JSON.stringify(r.data))
r = await req('POST', '/pagos/con-membresia', { token: admin, body: { socioId: socioA, planTipo: 'MENSUAL', metodoPago: 'TRANSFERENCIA' } })
check(r.status === 200, 'cobro de renovación a A', JSON.stringify(r.data))

console.log('\n3) Login socio por DNI (no gasta pase)')
r = await req('POST', '/auth/login-socio', { body: { dni: '99999999', pin: '5831' } })
check(r.status === 401 && !/no existe/i.test(r.data?.error ?? ''), 'DNI inexistente: mensaje genérico', JSON.stringify(r.data))
r = await req('POST', '/auth/login-socio', { body: { dni: dniA, pin: pinA } })
check(r.status === 200, 'socio A entra con DNI')
const tokA = r.data.token
r = await req('GET', `/membresias/socio/${socioA}`, { token: tokA })
check(r.status === 200 && r.data.pasesUsados === 0, 'entrar no consumió pase', JSON.stringify(r.data?.pasesUsados))

console.log('\n4) Pertenencia: el socio A no ve datos de otros')
check((await req('GET', `/socios/${socioA}`, { token: tokA })).status === 200, 'A ve su perfil')
check((await req('GET', `/socios/${socioB}`, { token: tokA })).status === 403, 'A NO ve el perfil de B')
check((await req('GET', '/socios/todos', { token: tokA })).status === 403, 'A NO lista socios')
check((await req('GET', `/fichas-medicas/socio/${socioB}`, { token: tokA })).status === 403, 'A NO ve la ficha médica de B')
check((await req('GET', '/pagos', { token: tokA })).status === 403, 'A NO ve pagos')
check((await req('GET', `/membresias/socio/${socioB}`, { token: tokA })).status === 403, 'A NO ve la membresía de B')
check((await req('GET', '/asistencias/hoy', { token: tokA })).status === 403, 'A NO ve asistencias del día')
check((await req('POST', '/asistencias/checkin', { token: tokA, body: { socioId: socioA } })).status === 403, 'A NO puede hacer check-in directo')
check((await req('GET', `/seguimiento/socio/${socioB}/progreso`, { token: tokA })).status === 403, 'A NO ve el progreso de B')

console.log('\n5) QR de ingreso')
r = await req('POST', '/asistencias/qr', { token: tokA, body: { codigo: 'GT1.123.falso' } })
check(r.status === 400, 'QR falso rechazado', JSON.stringify(r.data))
r = await req('GET', '/asistencias/qr-actual', { token: tokA })
check(r.status === 403, 'el socio NO puede pedir el QR vigente')
const qr = (await req('GET', '/asistencias/qr-actual', { token: admin })).data
check(qr?.codigo?.startsWith('GT1.'), 'recepción obtiene el QR vigente')
r = await req('POST', '/asistencias/qr', { token: tokA, body: { codigo: qr.codigo } })
check(r.status === 200 && r.data.permitido === true && r.data.socioId === socioA, 'A registra su ingreso con el QR', JSON.stringify(r.data))
r = await req('GET', `/membresias/socio/${socioA}`, { token: tokA })
check(r.data.pasesUsados === 1, 'se consumió exactamente 1 pase', r.data.pasesUsados)
await req('POST', '/asistencias/qr', { token: tokA, body: { codigo: qr.codigo } })
r = await req('GET', `/membresias/socio/${socioA}`, { token: tokA })
check(r.data.pasesUsados === 1, 'escanear de nuevo el mismo día no gasta otro pase', r.data.pasesUsados)

console.log('\n6) Rutinas: el socio efectivo sale del token')
r = await req('POST', '/rutinas', { token: admin, headers: { 'X-Socio-Id': socioA }, body: { nombre: 'Fuerza A', diasSemana: ['Lunes', 'Jueves'] } })
check(r.status === 200 || r.status === 201, 'staff crea rutina para A', JSON.stringify(r.data))
const rutA = r.data.id
r = await req('POST', `/rutinas/${rutA}/ejercicios`, { token: admin, headers: { 'X-Socio-Id': socioA }, body: { nombreEjercicio: 'Press banca', series: 3, repeticiones: 10, dia: 1 } })
check(r.status === 200 || r.status === 201, 'staff agrega ejercicio', JSON.stringify(r.data))
const ejId = r.data.id
r = await req('POST', '/rutinas', { token: admin, headers: { 'X-Socio-Id': socioB }, body: { nombre: 'Rutina de B' } })
const rutB = r.data.id
r = await req('GET', '/rutinas', { token: tokA, headers: { 'X-Socio-Id': socioB } })
check(r.status === 200 && r.data.every(x => x.socioId === socioA) && r.data.some(x => x.id === rutA), 'A pide rutinas "de B" por header y recibe solo las suyas')
r = await req('GET', `/rutinas/${rutB}`, { token: tokA, headers: { 'X-Socio-Id': socioB } })
check(r.status !== 200, 'A NO abre la rutina de B', r.status)
check((await req('POST', '/rutinas', { token: tokA, body: { nombre: 'hack' } })).status === 403, 'el socio NO crea rutinas')

console.log('\n7) Progreso y modo entrenamiento')
r = await req('POST', '/progreso', { token: tokA, body: { socioId: socioB, rutinaEjercicioId: ejId, pesoKg: 40, repeticionesReales: 10, seriesRealizadas: 3 } })
check(r.status === 200, 'A guarda progreso (aunque mande el id de B, se guarda como A)', JSON.stringify(r.data))
r = await req('GET', `/seguimiento/socio/${socioA}/progreso`, { token: tokA })
check(r.status === 200 && r.data.ejercicios[0]?.ejercicio === 'Press banca' && Number(r.data.ejercicios[0].pesoActual) === 40, 'progreso de A muestra Press banca 40 kg', JSON.stringify(r.data?.ejercicios))
check(r.data.diasEsteMes >= 1 && r.data.semanas.length === 12, 'asistencia semanal calculada')
r = await req('GET', `/seguimiento/socio/${socioB}/progreso`, { token: admin })
check(r.data.ejercicios.length === 0, 'B no recibió el progreso que A intentó cargarle')

console.log('\n8) Hoy, métricas, riesgo, auditoría')
r = await req('GET', '/seguimiento/hoy', { token: admin })
check(r.status === 200 && r.data.entrenando.some(s => s.socioId === socioA), 'Hoy: A aparece entrenando', JSON.stringify(r.data))
check(r.data.renovarRutina.every(s => s.socioId !== socioA), 'Hoy: A tiene rutina al día')
r = await req('GET', '/reportes/metricas', { token: admin })
check(r.status === 200 && r.data.ocupacion.length === 7, 'métricas OK', r.status)
r = await req('GET', '/reportes/en-riesgo', { token: admin })
check(r.status === 200 && Array.isArray(r.data), 'socios en riesgo OK')
check((await req('GET', '/reportes/metricas', { token: tokA })).status === 403, 'el socio NO ve métricas')
r = await req('GET', '/auditoria', { token: admin })
const cobro = r.data?.find(a => a.accion === 'Cobró un plan' && a.socioId === socioA)
check(cobro && /MENSUAL/.test(cobro.detalle ?? ''), 'auditoría registró el cobro con detalle', JSON.stringify(cobro))
check(r.data?.some(a => a.accion === 'Dio de alta un socio'), 'auditoría registró el alta')

console.log('\n9) Baja: el token del socio deja de servir al instante')
check((await req('DELETE', `/socios/${socioA}`, { token: admin })).status < 300, 'admin da de baja a A')
r = await req('GET', `/socios/${socioA}`, { token: tokA })
check(r.status === 401, 'el token de A ya no sirve', r.status)

console.log('\n10) Políticas varias')
r = await req('POST', '/auth/register', { token: admin, body: { username: 'otroadmin' + sufijo, password: 'Segura123', rol: 'ADMIN' } })
check(r.status === 400, 'no se pueden crear admins por API', r.status)
r = await req('POST', '/profesores', { token: admin, body: { username: 'profe' + sufijo, password: '1234' } })
check(r.status === 400, 'contraseña débil rechazada', r.status)
r = await fetch(API + '/socios', { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' } })
check(r.headers.get('access-control-allow-origin') == null, 'CORS rechaza un origen desconocido')
r = await fetch(API + '/socios', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'GET' } })
check(r.headers.get('access-control-allow-origin') === 'http://localhost:5173', 'CORS acepta el frontend')

terminar()
