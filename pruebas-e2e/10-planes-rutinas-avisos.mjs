// Planes que se deshabilitan o borran, edición completa de rutinas de socio (ejercicios y notas del profe),
// instructores solo registrados y avisos por canales (app, mail, WhatsApp).
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

console.log('\nPlanes de membresía')
const tipo = 'PRUEBA' + suf
let r = await req('POST', '/tarifas', { token: admin, body: { tipo, nombre: 'Plan prueba ' + suf, precio: 1000, duracionDias: 30 } })
check(r.status === 200 && r.data.activo === true && r.data.usado === false, 'se crea habilitado y sin usar', JSON.stringify(r.data))
r = await req('PUT', `/tarifas/${tipo}`, { token: admin, body: { precio: 1200, nombre: 'Plan renovado ' + suf, incluye: 'Todo' } })
check(r.status === 200 && r.data.nombre === 'Plan renovado ' + suf && Number(r.data.precio) === 1200 && r.data.incluye === 'Todo', 'se edita nombre, precio y qué incluye', JSON.stringify(r.data))
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Plan', apellido: 'Usado', dni: '49' + suf, tipoMembresia: tipo, formaDePago: 'EFECTIVO' } })
check(r.status === 200, 'se cobra el plan a un socio')
r = await req('GET', '/tarifas', { token: admin })
check(r.data?.find(t => t.tipo === tipo)?.usado === true, 'ahora figura como usado')
r = await req('DELETE', `/tarifas/${tipo}`, { token: admin })
check(r.status === 400, 'un plan usado no se puede borrar')
r = await req('PATCH', `/tarifas/${tipo}/activo`, { token: admin, body: { activo: false } })
check(r.status === 200 && r.data.activo === false, 'se deshabilita')
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Otro', apellido: 'Socio', dni: '50' + suf, tipoMembresia: tipo, formaDePago: 'EFECTIVO' } })
check(r.status === 400, 'un plan deshabilitado no se puede cobrar')
r = await req('PATCH', `/tarifas/${tipo}/activo`, { token: admin, body: { activo: true } })
check(r.data?.activo === true, 'se vuelve a habilitar')
await req('PATCH', `/tarifas/${tipo}/activo`, { token: admin, body: { activo: false } })
const tipo2 = 'BORRAR' + suf
await req('POST', '/tarifas', { token: admin, body: { tipo: tipo2, nombre: 'Para borrar', precio: 500, duracionDias: 7 } })
r = await req('DELETE', `/tarifas/${tipo2}`, { token: admin })
check(r.status === 204, 'un plan sin usar se borra')
await req('POST', '/profesores', { token: admin, body: { username: 'pl' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'pl' + suf, password: 'Profe2026' } })).data?.token
r = await req('PATCH', `/tarifas/MENSUAL/activo`, { token: profe, body: { activo: false } })
check(r.status === 403, 'un profesor no toca los planes')

console.log('\nEditar la rutina de un socio')
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Rut', apellido: 'Edit', dni: '51' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const socio = r.data?.socioId
const pinSocio = r.data?.pin
const h = { 'X-Socio-Id': socio }
r = await req('POST', '/rutinas', { token: admin, headers: h, body: { nombre: 'Personal ' + suf, notasProfe: 'Cuidá la rodilla', diasSemana: ['Lunes', 'Jueves'] } })
check(r.status < 300 && r.data.notasProfe === 'Cuidá la rodilla', 'se crea con las indicaciones del profe', JSON.stringify(r.data))
const rutina = r.data?.id
r = await req('PUT', `/rutinas/${rutina}/ejercicios`, { token: admin, headers: h, body: [
  { nombreEjercicio: 'Sentadilla', series: 4, repeticiones: 8, descansoSeg: 90, dia: 1 },
  { nombreEjercicio: 'Remo', series: 3, repeticiones: 12, descansoSeg: 60, dia: 1 },
  { nombreEjercicio: 'Press banca', series: 4, repeticiones: 10, descansoSeg: 90, dia: 2 },
] })
const calentamiento = (r.data ?? []).filter(e => e.esCalentamiento).length
const principales = (r.data ?? []).filter(e => !e.esCalentamiento)
check(r.status === 200 && principales.length === 3, 'guarda todos los ejercicios juntos', JSON.stringify(r.data).slice(0, 200))
check(calentamiento > 0, 'la entrada en calor queda intacta')
const sentadilla = principales.find(e => e.nombreEjercicio === 'Sentadilla')
const remo = principales.find(e => e.nombreEjercicio === 'Remo')
// El socio registra progreso en el remo
const tSocio = (await req('POST', '/auth/login-socio', { body: { dni: '51' + suf, pin: pinSocio } })).data?.token
r = await req('POST', '/progreso', { token: tSocio, body: { socioId: socio, rutinaEjercicioId: remo?.id, pesoKg: 30, repeticionesReales: 12, seriesRealizadas: 3 } })
check(r.status < 300, 'el socio registra progreso en el remo', JSON.stringify(r.data))
r = await req('PUT', `/rutinas/${rutina}/ejercicios`, { token: admin, headers: h, body: [
  { id: sentadilla?.id, nombreEjercicio: 'Sentadilla', series: 5, repeticiones: 5, descansoSeg: 120, dia: 2, notas: 'Profunda' },
  { nombreEjercicio: 'Peso muerto', series: 3, repeticiones: 6, descansoSeg: 120, dia: 1 },
] })
const despues = (r.data ?? []).filter(e => !e.esCalentamiento)
check(r.status === 200 && despues.length === 2, 'quita el remo (aunque tenía progreso) y agrega peso muerto', JSON.stringify(r.data).slice(0, 300))
const s2 = despues.find(e => e.nombreEjercicio === 'Sentadilla')
check(s2?.id === sentadilla?.id && s2.series === 5 && s2.dia === 2 && s2.notas === 'Profunda', 'actualiza el que ya estaba sin cambiarle el id', JSON.stringify(s2))
check(despues[0].nombreEjercicio === 'Sentadilla' && despues[1].nombreEjercicio === 'Peso muerto', 'respeta el orden en que llegan')
r = await req('PUT', `/rutinas/${rutina}`, { token: admin, headers: h, body: { nombre: 'Personal ' + suf, notasProfe: 'Ya no duele' } })
check(r.data?.notasProfe === 'Ya no duele', 'se editan las indicaciones')
r = await req('PUT', `/rutinas/${rutina}/ejercicios`, { token: admin, headers: h, body: [{ id: 999999999, nombreEjercicio: 'X' }] })
check(r.status === 400, 'un id que no es de la rutina → 400')
r = await req('POST', `/rutinas/${rutina}/clonar`, { token: admin, body: { socioId: null, nombre: 'Plantilla ' + suf } })
check(r.status < 300 && !r.data.notasProfe, 'al guardarla como plantilla no se copian las indicaciones personales')

console.log('\nInstructores')
r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Yoga ' + suf, instructor: 'Inventado', horarios: [{ dia: 'LUNES', horaInicio: '10:00', horaFin: '11:00' }] } })
check(r.status === 201 && !r.data.instructor, 'un nombre escrito a mano no queda como instructor', JSON.stringify(r.data))
const disciplina = r.data?.id

console.log('\nAvisos por canales')
r = await req('GET', '/notificaciones/canales', { token: admin })
check(r.status === 200 && typeof r.data.email === 'boolean' && r.data.socios > 0, 'informa qué canales están listos', JSON.stringify(r.data))
await req('PUT', `/socios/${socio}`, { token: admin, body: { ...(await req('GET', `/socios/${socio}`, { token: admin })).data, telefono: '011 15 4444-5555' } })
r = await req('POST', '/notificaciones', { token: admin, body: { titulo: 'Hola ' + suf, mensaje: 'Mensaje de prueba', socioId: socio, porEmail: false, porWhatsapp: true } })
check(r.status < 300 && r.data.porWhatsapp === true && r.data.porEmail === false && r.data.socioNombre === 'Rut Edit', 'guarda los canales elegidos', JSON.stringify(r.data))
const aviso = r.data?.id
r = await req('GET', `/notificaciones/${aviso}/whatsapp`, { token: admin })
const destino = r.data?.destinos?.[0]
check(destino?.telefono === '5491144445555', 'arma el teléfono para WhatsApp', JSON.stringify(r.data))
check(destino?.link?.startsWith('https://wa.me/5491144445555?text=') && decodeURIComponent(destino.link.split('text=')[1]).includes('Mensaje de prueba'), 'el link trae el mensaje')
r = await req('POST', `/disciplinas/${disciplina}/inscripciones`, { token: admin, body: { socioId: socio } })
r = await req('POST', '/notificaciones', { token: admin, body: { titulo: 'Clase ' + suf, mensaje: 'Hoy no hay clase', disciplinaId: disciplina, porEmail: false } })
check(r.status < 300 && r.data.destinatario === 'DISCIPLINA' && r.data.disciplinaId === disciplina, 'aviso a los alumnos de una clase', JSON.stringify(r.data))
await req('DELETE', `/notificaciones/${aviso}`, { token: admin })
r = await req('GET', '/notificaciones', { token: admin })
check(r.data?.some(x => x.id === aviso && x.activa === false), 'los archivados se siguen viendo en el historial del staff')
r = await req('GET', `/notificaciones/${aviso}/whatsapp`, { token: tSocio })
check(r.status === 401 || r.status === 403, 'un socio no ve los links de WhatsApp')

terminar()
