// Limpieza de ejercicios, asistencia a las clases y avisos a los alumnos
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const hoy = DIAS[(new Date().getDay() + 6) % 7]
const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

console.log('\nLimpieza de ejercicios')
const crearEj = async nombre => (await req('POST', '/ejercicios', { token: admin, body: { nombre, esMaquina: false, grupos: ['Pecho'] } })).data
const viejo = await crearEj('Ejercicio viejo ' + suf)
const usado = await crearEj('Ejercicio usado ' + suf)
await crearEj('Prensa Piernas ' + suf)
await crearEj('Prensa de piernas ' + suf)
// "usado" queda en una rutina
let r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Plantilla limpieza ' + suf } })
await req('POST', `/rutinas/${r.data.id}/ejercicios`, { token: admin, body: { nombreEjercicio: usado.nombre, ejercicioCatalogoId: usado.id, series: 3, repeticiones: 10 } })
await req('DELETE', `/ejercicios/${viejo.id}`, { token: admin })
await req('DELETE', `/ejercicios/${usado.id}`, { token: admin })
r = await req('GET', '/ejercicios/limpieza', { token: admin })
check(r.status === 200 && r.data.borrables.some(e => e.id === viejo.id), 'el desactivado sin uso aparece para borrar', JSON.stringify(r.data))
check(r.data.desactivadosEnUso.some(e => e.id === usado.id) && !r.data.borrables.some(e => e.id === usado.id), 'el desactivado que está en una rutina se conserva')
check(r.data.posiblesDuplicados.some(g => g.some(e => e.nombre === 'Prensa Piernas ' + suf) && g.some(e => e.nombre === 'Prensa de piernas ' + suf)), 'detecta "Prensa Piernas" y "Prensa de piernas" como posibles duplicados')
check((await req('DELETE', `/ejercicios/${usado.id}/permanente`, { token: admin })).status === 400, 'no deja borrar un ejercicio que está en una rutina')
r = await req('POST', '/profesores', { token: admin, body: { username: 'profeej' + suf, password: 'Profe2026', nombre: 'Pablo', apellido: 'Clase' + suf } })
const profe = (await req('POST', '/auth/login', { body: { username: 'profeej' + suf, password: 'Profe2026' } })).data.token
check((await req('GET', '/ejercicios/limpieza', { token: profe })).status === 403, 'la limpieza es solo para el admin')
r = await req('POST', '/ejercicios/limpieza', { token: admin })
check(r.status === 200 && r.data.borrados >= 1, `borra los viejos (${r.data?.borrados})`)
r = await req('GET', '/ejercicios/todos', { token: admin })
check(!r.data.some(e => e.id === viejo.id) && r.data.some(e => e.id === usado.id), 'el viejo ya no existe y el usado sigue')
check((await req('GET', '/ejercicios-externos', { token: admin })).status === 403 || (await req('GET', '/ejercicios-externos', { token: admin })).status === 404, 'las integraciones externas viejas ya no están')

console.log('\nAsistencia a la clase')
const ahora = new Date().getHours() * 60 + new Date().getMinutes()
const ini = Math.max(0, Math.min(ahora - 20, 23 * 60 + 30)), fin = Math.min(ini + 40, 23 * 60 + 59)
r = await req('GET', '/disciplinas/instructores', { token: admin })
const pablo = r.data.find(p => p.nombre === 'Pablo Clase' + suf)
r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Clase ahora ' + suf, profesorId: pablo.id, cupoMaximo: null, color: 4, activa: true, horarios: [{ dia: hoy, horaInicio: hhmm(ini), horaFin: hhmm(fin) }] } })
const clase = r.data
check(r.status === 201, 'disciplina con una clase en este momento')
const socios = []
for (const n of ['Vino', 'Falto', 'Ajeno']) {
  r = await req('POST', '/socios/alta', { token: admin, body: { nombre: n, apellido: 'Clase' + suf, dni: `5${socios.length}${suf}`, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
  socios.push({ id: r.data.socioId, dni: `5${socios.length}${suf}`, pin: r.data.pin })
}
const [vino, falto, ajeno] = socios
await req('POST', `/disciplinas/${clase.id}/inscripciones`, { token: admin, body: { socioId: vino.id } })
await req('POST', `/disciplinas/${clase.id}/inscripciones`, { token: admin, body: { socioId: falto.id } })
await req('POST', '/asistencias/checkin', { token: admin, body: { socioId: vino.id } })
r = await req('GET', `/disciplinas/${clase.id}/asistencia?semanas=1`, { token: profe })
const sesHoy = r.data?.sesiones?.find(s => s.dia === hoy)
check(r.status === 200 && sesHoy, 'el profesor ve la asistencia de su clase', JSON.stringify(r.data))
check(sesHoy && sesHoy.esperados === 2 && sesHoy.presentes.length === 1 && sesHoy.presentes[0].socioId === vino.id, 'vino 1 de 2: el que ingresó al gimnasio en el horario', JSON.stringify(sesHoy))
const resFalto = r.data.alumnos.find(a => a.socioId === falto.id)
check(resFalto && resFalto.asistencias === 0 && r.data.alumnos[0].socioId === falto.id, 'el resumen pone primero al que no vino')
r = await req('GET', '/disciplinas', { token: profe })
check(r.data.find(x => x.id === clase.id)?.esMia === true, 'la disciplina figura como "mi clase" para su profesor')
check(r.data.find(x => x.id !== clase.id && x.esMia) === undefined, 'las de otros profesores no figuran como suyas')

console.log('\nAvisos a los alumnos')
r = await req('POST', `/disciplinas/${clase.id}/avisos`, { token: profe, body: { titulo: 'Hoy no hay clase', mensaje: 'Se suspende por mantenimiento' } })
check(r.status === 200 && r.data.alumnos === 2, 'el profesor envía un aviso a sus 2 alumnos', JSON.stringify(r.data))
check((await req('POST', `/disciplinas/${clase.id}/avisos`, { token: profe, body: { titulo: '', mensaje: 'x' } })).status === 400, 'el título es obligatorio')
await req('POST', '/notificaciones', { token: admin, body: { titulo: 'General ' + suf, mensaje: 'Para todos', destinatario: 'TODOS' } })
await req('POST', '/notificaciones', { token: admin, body: { titulo: 'Personal ' + suf, mensaje: 'Solo para Vino', socioId: vino.id } })
const tok = async s => (await req('POST', '/auth/login-socio', { body: { dni: s.dni, pin: s.pin } })).data.token
const tVino = await tok(vino), tAjeno = await tok(ajeno)
r = await req('GET', '/notificaciones/mias', { token: tVino })
const titulos = r.data.map(n => n.titulo)
check(r.status === 200 && titulos.includes('Hoy no hay clase'), 'el alumno ve el aviso de su clase en la app')
check(r.data.find(n => n.titulo === 'Hoy no hay clase')?.disciplinaNombre === clase.nombre, 'el aviso indica de qué clase es')
check(titulos.includes('General ' + suf) && titulos.includes('Personal ' + suf), 've también los avisos generales y los personales')
r = await req('GET', '/notificaciones/mias', { token: tAjeno })
const t2 = r.data.map(n => n.titulo)
check(!t2.includes('Hoy no hay clase') && !t2.includes('Personal ' + suf) && t2.includes('General ' + suf), 'otro socio no ve el aviso de la clase ni el personal ajeno')
check((await req('POST', `/disciplinas/${clase.id}/avisos`, { token: tVino, body: { titulo: 'x', mensaje: 'y' } })).status === 403, 'un socio no puede enviar avisos')
check((await req('GET', '/notificaciones/mias', { token: admin })).status === 403, '/mias es solo para socios')
r = await req('GET', '/notificaciones', { token: admin })
check(r.data.some(n => n.destinatario === 'DISCIPLINA' && n.disciplinaNombre === clase.nombre), 'el staff ve el aviso como "Clase: …"')
r = await req('GET', '/auditoria', { token: admin })
check(r.data.some(a => a.accion === 'Envió un aviso a los alumnos de una disciplina'), 'la auditoría registra el aviso')
check(r.data.some(a => a.accion === 'Borró ejercicios viejos'), 'la auditoría registra la limpieza')

terminar()
