// Reservas de clases (con espera), alumno fijo que se anota solo, entrenamientos terminados,
// récords, superseries, logros, retención automática e indicadores del dueño.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

async function nuevoSocio(nombre, dni) {
  const r = await req('POST', '/socios/alta', { token: admin, body: { nombre, apellido: 'Prueba', dni, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
  const id = r.data?.socio?.id ?? r.data?.socioId ?? r.data?.id
  const t = (await req('POST', '/auth/login-socio', { body: { dni, pin: r.data?.pin } })).data?.token
  return { id, t }
}
const a = await nuevoSocio('Ana', '51' + suf)
const b = await nuevoSocio('Beto', '52' + suf)
const c = await nuevoSocio('Caro', '53' + suf)
check(a.t && b.t && c.t, 'tres socios entran con su PIN')

// Clase de mañana con cupo 2
const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const man = new Date(Date.now() + 86400000)
const fecha = `${man.getFullYear()}-${String(man.getMonth() + 1).padStart(2, '0')}-${String(man.getDate()).padStart(2, '0')}`
const dia = DIAS[(man.getDay() + 6) % 7]
let r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Yoga ' + suf, cupoMaximo: 2, horarios: [{ dia, horaInicio: '10:00', horaFin: '11:00' }] } })
const disc = r.data?.id
check(r.status < 300 && disc, 'admin crea disciplina con cupo 2', JSON.stringify(r.data))

console.log('\nAlumno fijo y reservas')
r = await req('POST', `/reservas/disciplinas/${disc}/fijo`, { token: a.t })
check(r.status === 200, 'el socio se anota solo como alumno fijo', JSON.stringify(r.data))
r = await req('GET', '/reservas/agenda', { token: a.t })
let clase = r.data?.find(x => x.disciplinaId === disc && x.fecha === fecha)
check(clase?.miEstado === 'FIJO' && clase.ocupados === 1 && clase.disponibles === 1, 'la agenda muestra su lugar fijo y 1 libre', JSON.stringify(clase))
const cuerpo = { disciplinaId: String(disc), fecha, hora: '10:00' }
r = await req('POST', '/reservas', { token: b.t, body: cuerpo })
check(r.data?.estado === 'CONFIRMADA', 'otro socio reserva el último lugar', JSON.stringify(r.data))
r = await req('POST', '/reservas', { token: c.t, body: cuerpo })
check(r.data?.estado === 'ESPERA' && r.data.posicion === 1, 'con la clase llena queda 1° en espera', JSON.stringify(r.data))
r = await req('POST', '/reservas', { token: b.t, body: cuerpo })
check(r.status === 400, 'no puede reservar dos veces')
r = await req('POST', '/reservas/cancelar', { token: b.t, body: cuerpo })
check(r.status === 200, 'cancela su reserva')
r = await req('GET', '/reservas/mias', { token: c.t })
check(r.data?.some(x => x.disciplinaId === disc && x.miEstado === 'CONFIRMADA'), 'el de la espera pasa a confirmado solo')
r = await req('GET', '/notificaciones/mias', { token: c.t })
check(r.status === 200 && JSON.stringify(r.data).includes('Se liberó un lugar'), 'y le llega el aviso en la app', JSON.stringify(r.data)?.slice(0, 200))
r = await req('POST', '/reservas/cancelar', { token: a.t, body: cuerpo })
check(r.data?.estado === 'LIBERADA', 'el alumno fijo avisa que no va y libera su lugar')
r = await req('GET', '/reservas/clase?disciplinaId=' + disc + '&fecha=' + fecha + '&hora=10:00', { token: admin })
check(r.data?.avisaronQueNo?.length === 1 && r.data.vienen.length === 1, 'el staff ve quién viene y quién avisó que no', JSON.stringify(r.data))
r = await req('POST', '/reservas', { token: a.t, body: cuerpo })
check(r.data?.estado === 'FIJO', 'el fijo recupera su lugar mientras siga libre', JSON.stringify(r.data))
r = await req('POST', '/reservas', { token: a.t, body: { ...cuerpo, hora: '18:00' } })
check(r.status === 400, 'no se puede reservar un horario que no existe')
r = await req('DELETE', `/reservas/disciplinas/${disc}/fijo`, { token: a.t })
check(r.status === 200, 'el socio deja de ser alumno fijo')

console.log('\nEntrenamientos, récords y superseries')
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Fuerza ' + suf, objetivo: 'FUERZA', dificultad: 'MEDIA' } })
r = await req('POST', `/rutinas/${r.data.id}/clonar`, { token: admin, body: { socioId: a.id } })
const rutina = r.data?.id
const e1 = (await req('POST', `/rutinas/${rutina}/ejercicios`, { token: admin, body: { nombreEjercicio: 'Sentadilla ' + suf, series: 3, repeticiones: 5 }, headers: { 'X-Socio-Id': String(a.id) } })).data
const e2 = (await req('POST', `/rutinas/${rutina}/ejercicios`, { token: admin, body: { nombreEjercicio: 'Estocadas ' + suf, series: 3, repeticiones: 10 }, headers: { 'X-Socio-Id': String(a.id) } })).data
check(e1?.id && e2?.id, 'rutina del socio con dos ejercicios')
r = await req('POST', `/rutinas/${rutina}/ejercicios/${e1.id}/superserie`, { token: admin, body: { unir: true }, headers: { 'X-Socio-Id': String(a.id) } })
const ss = r.data?.filter(x => x.id === e1.id || x.id === e2.id).map(x => x.superserie)
check(ss?.length === 2 && ss[0] != null && ss[0] === ss[1], 'une los dos en superserie', JSON.stringify(ss))
r = await req('POST', `/rutinas/${rutina}/ejercicios/${e2.id}/superserie`, { token: admin, body: { unir: false }, headers: { 'X-Socio-Id': String(a.id) } })
check(r.data?.every(x => x.superserie == null), 'separarlos deja a los dos solos')
r = await req('POST', '/progreso', { token: a.t, body: { rutinaEjercicioId: e1.id, pesoKg: 80, repeticionesReales: 5, seriesRealizadas: 3, rpe: 8 } })
check(r.status === 200, 'guarda la carga con el esfuerzo (RPE)')
r = await req('POST', '/progreso', { token: a.t, body: { rutinaEjercicioId: e1.id, rpe: 15 } })
check(r.status === 400, 'esfuerzo fuera de 1-10 → 400')
r = await req('GET', `/progreso/socio/${a.id}/records`, { token: a.t })
const rec = r.data?.find(x => x.ejercicio === 'Sentadilla ' + suf)
check(Number(rec?.pesoMax) === 80 && Number(rec?.e1rm) > 90, 'calcula el récord y el 1RM estimado', JSON.stringify(rec))
r = await req('GET', `/progreso/socio/${a.id}/records?hastaAyer=true`, { token: a.t })
check(!r.data?.some(x => x.ejercicio === 'Sentadilla ' + suf), 'hastaAyer deja afuera lo de hoy')
r = await req('POST', '/sesiones', { token: a.t, body: { rutinaId: rutina, dia: 1, duracionMin: 45, series: 3, volumenKg: 1200, records: 1, sensacion: 'DURO', comentario: 'Me costó la última serie' } })
check(r.status === 200 && r.data?.sensacion === 'DURO', 'el socio termina el entrenamiento y cuenta cómo se sintió', JSON.stringify(r.data))
const sesion = r.data?.id
r = await req('POST', '/sesiones', { token: a.t, body: { sensacion: 'GENIAL' } })
check(r.status === 400, 'sensación inválida → 400')
r = await req('GET', '/sesiones/recientes', { token: admin })
check(r.data?.some(x => x.id === sesion && x.comentario === 'Me costó la última serie'), 'el profe lo ve en los comentarios recientes')
check((await req('PATCH', `/sesiones/${sesion}/leida`, { token: admin })).status === 200, 'el profe lo marca como leído')
check((await req('GET', '/sesiones/recientes', { token: a.t })).status === 403, 'un socio no ve los comentarios de otros')

console.log('\nLogros y ranking')
r = await req('GET', `/gamificacion/socio/${a.id}`, { token: a.t })
check(r.data?.diasEntrenados >= 1 && r.data.insignias.find(i => i.codigo === 'PRIMER_DIA')?.obtenida && r.data.insignias.find(i => i.codigo === 'RECORD_1')?.obtenida, 'gana las insignias de primer día y primer récord', JSON.stringify(r.data?.insignias?.slice(0, 2)))
check(r.data?.desafio?.meta === 12, 'tiene el desafío del mes')
check((await req('GET', `/gamificacion/socio/${a.id}`, { token: b.t })).status === 403, 'un socio no ve los logros de otro')
r = await req('GET', '/gamificacion/ranking', { token: a.t })
check(!r.data?.top?.some(x => x.socioId === a.id), 'sin elegirlo no aparece en el ranking')
check((await req('PUT', '/gamificacion/ranking', { token: a.t, body: { participa: true } })).data?.participa === true, 'elige aparecer en el ranking')
r = await req('GET', '/gamificacion/ranking', { token: a.t })
check(r.data?.tuPuesto?.socioId === a.id && /Ana P\./.test(r.data.tuPuesto.nombre), 'aparece con nombre e inicial', JSON.stringify(r.data?.tuPuesto))

console.log('\nRetención e indicadores')
r = await req('POST', '/retencion/generar', { token: admin })
check(r.status === 200 && typeof r.data?.tareas === 'number', 'corre la revisión de retención', JSON.stringify(r.data))
r = await req('GET', '/retencion/tareas', { token: admin })
check(Array.isArray(r.data), 'lista las tareas para el staff')
const tarea = r.data?.[0]
if (tarea) {
  check((await req('PATCH', `/retencion/tareas/${tarea.id}`, { token: admin, body: { estado: 'HECHA' } })).status === 200, 'marca una tarea como hecha')
}
check((await req('PATCH', '/retencion/tareas/999999', { token: admin, body: { estado: 'OTRA' } })).status === 400, 'estado inválido → 400')
check((await req('GET', '/retencion/tareas', { token: a.t })).status === 403, 'un socio no ve las tareas de retención')
r = await req('GET', '/reportes/indicadores', { token: admin })
check(r.status === 200 && Number(r.data?.ingresoMensualRecurrente) > 0 && r.data.cohortes.length === 6, 'indicadores del dueño', JSON.stringify(r.data)?.slice(0, 200))

terminar()
