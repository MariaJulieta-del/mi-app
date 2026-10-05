// Disciplinas: horarios por día, cupo, varias por socio, membresía vigente, privacidad
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const hoy = DIAS[(new Date().getDay() + 6) % 7]

console.log('\nInstructores')
let r = await req('POST', '/profesores', { token: admin, body: { username: 'instr' + suf, password: 'Instr2026', nombre: 'Laura', apellido: 'Gómez' + suf } })
r = await req('GET', '/disciplinas/instructores', { token: admin })
const laura = r.data.find(p => p.nombre === 'Laura Gómez' + suf)
check(r.status === 200 && laura, 'lista de instructores con el profesor nuevo', JSON.stringify(r.data))

console.log('\nCrear con horarios por día')
const base = { nombre: 'Funcional ' + suf, cupoMaximo: 2, color: 3, profesorId: laura.id, activa: true,
  horarios: [{ dia: 'VIERNES', horaInicio: '09:00', horaFin: '10:00' }, { dia: 'LUNES', horaInicio: '18:00', horaFin: '19:00' }, { dia: 'MIÉRCOLES', horaInicio: '18:00', horaFin: '19:00' }] }
r = await req('POST', '/disciplinas', { token: admin, body: base })
check(r.status === 201, 'se crea la disciplina', JSON.stringify(r.data))
const disc = r.data
check(disc.horarios.map(h => h.dia).join() === 'LUNES,MIÉRCOLES,VIERNES', 'los horarios quedan ordenados de lunes a domingo')
check(disc.instructor === 'Laura Gómez' + suf && disc.color === 3, 'instructor vinculado y color')

console.log('\nValidaciones')
r = await req('POST', '/disciplinas', { token: admin, body: { ...base, nombre: 'Mala', profesorId: null, horarios: [{ dia: 'LUNES', horaInicio: '19:00', horaFin: '18:00' }] } })
check(r.status === 400 && /posterior/.test(r.data.error), 'rechaza fin antes que inicio', JSON.stringify(r.data))
r = await req('POST', '/disciplinas', { token: admin, body: { ...base, nombre: 'Mala', profesorId: null, horarios: [{ dia: 'LUNES', horaInicio: '18:00', horaFin: '19:00' }, { dia: 'LUNES', horaInicio: '18:30', horaFin: '19:30' }] } })
check(r.status === 400 && /superpuestos/.test(r.data.error), 'rechaza horarios superpuestos el mismo día', JSON.stringify(r.data))
r = await req('POST', '/disciplinas', { token: admin, body: { ...base, nombre: 'Yoga ' + suf, horarios: [{ dia: 'LUNES', horaInicio: '18:30', horaFin: '19:30' }] } })
check(r.status === 400 && /ya da/.test(r.data.error), 'un profesor no puede dar dos clases a la misma hora', JSON.stringify(r.data))
r = await req('POST', '/disciplinas', { token: admin, body: { ...base, nombre: 'Mala', profesorId: null, cupoMaximo: 0 } })
check(r.status === 400, 'rechaza cupo 0')

console.log('\nInscripciones')
const socios = []
for (const n of ['Ana', 'Beto', 'Caro']) {
  r = await req('POST', '/socios/alta', { token: admin, body: { nombre: n, apellido: 'Disc' + suf, dni: `4${socios.length}${suf}`, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
  socios.push({ id: r.data.socioId, dni: `4${socios.length}${suf}`, pin: r.data.pin })
}
r = await req('POST', '/socios', { token: admin, body: { nombre: 'Sin', apellido: 'Membresia' + suf, dni: '49' + suf, activo: true } })
const sinMembresia = r.data.id
const [A, B, C] = socios
check((await req('POST', `/disciplinas/${disc.id}/inscripciones`, { token: admin, body: { socioId: A.id } })).status === 200, 'inscribe a A')
r = await req('POST', `/disciplinas/${disc.id}/inscripciones`, { token: admin, body: { socioId: B.id } })
check(r.status === 200 && r.data.totalInscritos === 2 && r.data.cuposDisponibles === 0, 'inscribe a B y queda completa', JSON.stringify(r.data))
r = await req('POST', `/disciplinas/${disc.id}/inscripciones`, { token: admin, body: { socioId: C.id } })
check(r.status === 400 && /completa/.test(r.data.error), 'no admite más que el cupo', JSON.stringify(r.data))
r = await req('POST', `/disciplinas/${disc.id}/inscripciones`, { token: admin, body: { socioId: A.id } })
check(r.status === 400 && /ya está inscripto/.test(r.data.error), 'no duplica inscripciones')
r = await req('PUT', `/disciplinas/${disc.id}`, { token: admin, body: { ...base, cupoMaximo: 1 } })
check(r.status === 400 && /no puede ser menor/.test(r.data.error), 'no deja bajar el cupo por debajo de los inscriptos', JSON.stringify(r.data))

// Otra disciplina para probar que un socio puede estar en varias
r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Spinning ' + suf, cupoMaximo: null, color: 2, activa: true, horarios: [{ dia: hoy, horaInicio: '07:00', horaFin: '08:00' }] } })
const spin = r.data
r = await req('POST', `/disciplinas/${spin.id}/inscripciones`, { token: admin, body: { socioId: A.id } })
check(r.status === 200, 'A también se inscribe en Spinning (varias disciplinas por socio)')
r = await req('POST', `/disciplinas/${spin.id}/inscripciones`, { token: admin, body: { socioId: sinMembresia } })
check(r.status === 400 && /membresía vigente/.test(r.data.error), 'sin membresía vigente no se puede inscribir', JSON.stringify(r.data))
r = await req('GET', `/disciplinas/socio/${A.id}`, { token: admin })
check(r.data.length === 2, 'el perfil de A muestra sus 2 disciplinas')

console.log('\nLo que ve el socio')
const tokA = (await req('POST', '/auth/login-socio', { body: { dni: A.dni, pin: A.pin } })).data?.token
r = await req('GET', '/disciplinas', { token: tokA })
const vistaA = r.data?.find?.(x => x.id === disc.id)
check(r.status === 200 && vistaA?.inscripto === true, 'el socio ve las disciplinas y cuáles son suyas')
check(vistaA && !vistaA.inscriptos, 'el socio NO ve la lista de inscriptos')
check((await req('GET', `/disciplinas/socio/${A.id}`, { token: tokA })).status === 200, 'el socio ve sus clases')
check((await req('GET', `/disciplinas/socio/${B.id}`, { token: tokA })).status === 403, 'el socio NO ve las clases de otro')
check((await req('POST', `/disciplinas/${spin.id}/inscripciones`, { token: tokA, body: { socioId: A.id } })).status === 403, 'el socio no puede inscribirse solo')
check((await req('GET', `/disciplinas/${disc.id}`, { token: tokA })).status === 403, 'el socio no ve el detalle con alumnos')

console.log('\nQuitar y liberar cupos')
r = await req('DELETE', `/disciplinas/${disc.id}/inscripciones/${B.id}`, { token: admin })
check(r.status === 200 && r.data.totalInscritos === 1, 'quita a B')
const memA = (await req('GET', `/membresias/socio/${A.id}`, { token: admin })).data
check((await req('PATCH', `/membresias/${memA.id}/estado?nuevoEstado=CANCELADA`, { token: admin })).status === 200, 'se cancela la membresía de A')
r = await req('GET', `/disciplinas/${disc.id}`, { token: admin })
check(r.data.inscriptos.find(i => i.socioId === A.id)?.membresiaVigente === false, 'A figura con la membresía vencida/cancelada', JSON.stringify(r.data.inscriptos))
r = await req('POST', `/disciplinas/${disc.id}/liberar-cupos`, { token: admin })
check(r.status === 200 && r.data.liberados === 1, 'liberar cupos saca a quien no tiene membresía vigente', JSON.stringify(r.data))

console.log('\nActivar / desactivar y clases de hoy')
r = await req('GET', '/disciplinas/hoy', { token: admin })
check(r.status === 200 && r.data.some(c => c.disciplinaId === spin.id && c.horaInicio === '07:00'), 'Spinning aparece en las clases de hoy', JSON.stringify(r.data))
check((await req('PATCH', `/disciplinas/${spin.id}/activa?valor=false`, { token: admin })).status === 204, 'desactiva Spinning')
r = await req('GET', '/disciplinas?soloActivas=true', { token: admin })
check(!r.data.some(x => x.id === spin.id), 'ya no aparece entre las activas')
r = await req('POST', `/disciplinas/${spin.id}/inscripciones`, { token: admin, body: { socioId: C.id } })
check(r.status === 400 && /inactiva/.test(r.data.error), 'no admite inscripciones estando inactiva')
check((await req('PATCH', `/disciplinas/${spin.id}/activa?valor=true`, { token: admin })).status === 204, 'se puede reactivar')

r = await req('GET', '/auditoria', { token: admin })
check(r.data.some(a => a.accion === 'Inscribió a un socio en una disciplina' && a.socioId === A.id), 'la auditoría registra las inscripciones')
check(r.data.some(a => a.accion === 'Liberó cupos de una disciplina'), 'la auditoría registra la liberación de cupos')

terminar()
