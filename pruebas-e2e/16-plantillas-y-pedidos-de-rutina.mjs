// Plantillas en la app del socio, pedidos de rutina personalizada y validaciones de rutinas.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
await req('POST', '/profesores', { token: admin, body: { username: 'pp' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'pp' + suf, password: 'Profe2026' } })).data?.token

const alta = async (dni, nombre) => {
  const r = await req('POST', '/socios/alta', { token: admin, body: { nombre, apellido: 'Prueba', dni, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
  const t = (await req('POST', '/auth/login-socio', { body: { dni, pin: r.data.pin } })).data?.token
  return { id: r.data.socioId, token: t }
}
const ana = await alta('71' + suf, 'Ana')
const beto = await alta('72' + suf, 'Beto')

console.log('\nValidaciones de rutinas')
let r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Mala ' + suf, diasSemana: ['Lunes', 'Feriado'] } })
check(r.status === 400 && /Día/.test(r.data?.error ?? ''), 'día inexistente → 400', JSON.stringify(r.data))
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Mala ' + suf, dificultad: 'EXTREMA' } })
check(r.status === 400, 'dificultad inválida → 400')
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Mala ' + suf, notasProfe: 'x'.repeat(1200) } })
check(r.status === 400, 'indicaciones larguísimas → 400')
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Plantilla visible ' + suf, objetivo: 'FUERZA', diasSemana: ['Lunes', 'Jueves'] } })
const visible = r.data?.id
r = await req('PUT', `/rutinas/${visible}/ejercicios`, { token: admin, body: [{ nombreEjercicio: 'Sentadilla', series: -3, repeticiones: 8, dia: 1 }] })
check(r.status === 400 && /series/i.test(r.data?.error ?? ''), 'series negativas en la lista → 400', JSON.stringify(r.data))
r = await req('PUT', `/rutinas/${visible}/ejercicios`, { token: admin, body: [{ nombreEjercicio: 'Sentadilla', series: 4, repeticiones: 8, dia: 9 }] })
check(r.status === 400, 'día 9 → 400')
r = await req('PUT', `/rutinas/${visible}/ejercicios`, { token: admin, body: [{ nombreEjercicio: 'Sentadilla', series: 4, repeticiones: 8, pesoKg: 60, dia: 1 }, { nombreEjercicio: 'Press banca', series: 4, repeticiones: 10, dia: 2 }] })
check(r.status === 200, 'ejercicios válidos se guardan', String(r.status))
const ejId = r.data?.find(e => e.nombreEjercicio === 'Sentadilla')?.id
r = await req('PATCH', `/rutinas/${visible}/ejercicios/${ejId}`, { token: admin, body: { pesoKg: -10 } })
check(r.status === 400, 'editar un ejercicio con peso negativo → 400', String(r.status))
r = await req('POST', `/rutinas/${visible}/clonar`, { token: admin, body: { nombre: 'x'.repeat(80) } })
check(r.status === 400, 'clonar con nombre larguísimo → 400')

r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Borrador ' + suf } })
const oculta = r.data?.id
await req('PUT', `/rutinas/${oculta}/ejercicios`, { token: admin, body: [{ nombreEjercicio: 'Remo', series: 3, repeticiones: 12, dia: 1 }] })
r = await req('PATCH', `/rutinas/${oculta}/visible`, { token: profe, body: { visible: false } })
check(r.status === 200 && r.data.visibleSocios === false, 'el profe oculta una plantilla')
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Vacía ' + suf } })
const vacia = r.data?.id

console.log('\nPlantillas en la app del socio')
r = await req('GET', '/socio-app/rutinas/plantillas', { token: ana.token })
const ids = (r.data ?? []).map(p => p.id)
check(r.status === 200 && ids.includes(visible), 'el socio ve las plantillas visibles')
check(!ids.includes(oculta) && !ids.includes(vacia), 'no ve las ocultas ni las que no tienen ejercicios')
check((r.data ?? []).every(p => p.socioId == null && p.notasProfe == null), 'solo plantillas y sin notas internas')
check((await req('GET', `/rutinas/${oculta}`, { token: ana.token })).status === 404, 'la oculta tampoco se abre por número')
check((await req('GET', `/socio-app/rutinas/plantillas/${oculta}/ejercicios`, { token: ana.token })).status === 404, 'ni sus ejercicios')
r = await req('GET', `/socio-app/rutinas/plantillas/${visible}/ejercicios`, { token: ana.token })
check(r.status === 200 && r.data.filter(e => !e.esCalentamiento).length === 2, 've los ejercicios de una visible (más la entrada en calor)')
check((await req('GET', '/socio-app/rutinas/plantillas', { token: admin })).status === 403, 'el staff no usa los endpoints del socio')
check((await req('GET', '/socio-app/rutinas/plantillas')).status === 401, 'sin sesión → 401')

r = await req('POST', `/socio-app/rutinas/plantillas/${visible}/elegir`, { token: ana.token })
check(r.status === 200 && r.data.socioId === ana.id && r.data.elegidaPorSocio === true && r.data.cantidadEjercicios === 2, 'el socio se elige una plantilla (con sus ejercicios)', JSON.stringify(r.data))
check(r.data?.id === visible && r.data?.asignada === true, 'no se copia: le queda asignada la misma plantilla', JSON.stringify(r.data))
check((await req('POST', `/socio-app/rutinas/plantillas/${visible}/elegir`, { token: ana.token })).status === 400, 'no puede elegir dos veces la misma')
check((await req('POST', `/socio-app/rutinas/plantillas/${oculta}/elegir`, { token: ana.token })).status === 404, 'no puede elegir una oculta')
// Una rutina personalizada de Ana: Beto no la puede elegir ni ver
const deAna = (await req('POST', '/rutinas', { token: admin, headers: { 'X-Socio-Id': ana.id }, body: { nombre: 'Solo de Ana ' + suf } })).data?.id
check((await req('POST', `/socio-app/rutinas/plantillas/${deAna}/elegir`, { token: beto.token })).status === 404, 'no puede copiarse la rutina de otro socio')
check((await req('GET', `/rutinas/${deAna}`, { token: beto.token })).status === 404, 'otro socio no ve la rutina personalizada de otro')
// Límite semanal: 3 por semana
const extra = []
for (let i = 0; i < 3; i++) {
  const p = (await req('POST', '/rutinas', { token: admin, body: { nombre: `Extra ${i} ${suf}` } })).data.id
  await req('PUT', `/rutinas/${p}/ejercicios`, { token: admin, body: [{ nombreEjercicio: 'Plancha', series: 3, repeticiones: 30, dia: 1 }] })
  extra.push(p)
}
await req('POST', `/socio-app/rutinas/plantillas/${extra[0]}/elegir`, { token: ana.token })
await req('POST', `/socio-app/rutinas/plantillas/${extra[1]}/elegir`, { token: ana.token })
r = await req('POST', `/socio-app/rutinas/plantillas/${extra[2]}/elegir`, { token: ana.token })
check(r.status === 400 && /esta semana/.test(r.data?.error ?? ''), 'más de 3 por semana → 400 con mensaje claro', JSON.stringify(r.data))

console.log('\nPedido de rutina personalizada')
check((await req('GET', '/socio-app/rutinas/pedido', { token: beto.token })).status === 204, 'sin pedidos todavía')
r = await req('POST', '/socio-app/rutinas/pedido', { token: beto.token, body: { objetivo: 'VOLAR', diasSemana: 3 } })
check(r.status === 400, 'objetivo inválido → 400')
r = await req('POST', '/socio-app/rutinas/pedido', { token: beto.token, body: { diasSemana: 9 } })
check(r.status === 400, '9 días por semana → 400')
r = await req('POST', '/socio-app/rutinas/pedido', { token: beto.token, body: { mensaje: 'x'.repeat(600) } })
check(r.status === 400, 'mensaje larguísimo → 400')
const antes = (await req('GET', '/pedidos-rutina/cantidad', { token: profe })).data?.abiertos ?? 0
r = await req('POST', '/socio-app/rutinas/pedido', { token: beto.token, body: { objetivo: 'HIPERTROFIA', diasSemana: 4, mensaje: 'Me molesta el hombro izquierdo' } })
check(r.status === 200 && r.data.estado === 'PENDIENTE' && r.data.socioId === beto.id, 'el socio pide una rutina', JSON.stringify(r.data))
const pedido = r.data?.id
check((await req('POST', '/socio-app/rutinas/pedido', { token: beto.token, body: { diasSemana: 2 } })).status === 400, 'no puede tener dos pedidos abiertos')

r = await req('GET', '/pedidos-rutina/cantidad', { token: profe })
check(r.data?.abiertos === antes + 1, 'al profe le sube el contador', JSON.stringify(r.data))
r = await req('GET', '/pedidos-rutina', { token: profe })
const enBandeja = r.data?.abiertos?.find(p => p.id === pedido)
check(!!enBandeja && enBandeja.mensaje === 'Me molesta el hombro izquierdo' && enBandeja.diasSemana === 4, 'el profe lo ve como tarea pendiente con el detalle')
check((await req('GET', '/pedidos-rutina', { token: beto.token })).status === 403, 'un socio no ve la bandeja del staff')
check((await req('PATCH', `/pedidos-rutina/${pedido}/tomar`, { token: ana.token })).status === 403, 'un socio no puede tomar pedidos')

r = await req('PATCH', `/pedidos-rutina/${pedido}/tomar`, { token: profe })
check(r.status === 200 && r.data.estado === 'EN_CURSO' && r.data.tomadaPor === 'pp' + suf, 'el profe lo toma')
r = await req('GET', '/socio-app/rutinas/pedido', { token: beto.token })
check(r.data?.estado === 'EN_CURSO', 'el socio ve que lo están armando')

// El profe le arma la rutina: el pedido se cierra solo y al socio le llega el aviso
r = await req('POST', '/rutinas', { token: profe, headers: { 'X-Socio-Id': beto.id }, body: { nombre: 'Hipertrofia Beto', objetivo: 'HIPERTROFIA' } })
const rutinaBeto = r.data?.id
r = await req('GET', '/socio-app/rutinas/pedido', { token: beto.token })
check(r.data?.estado === 'HECHA' && r.data.rutinaId === rutinaBeto, 'al armarle la rutina, el pedido se cierra solo', JSON.stringify(r.data))
r = await req('GET', '/notificaciones/mias', { token: beto.token })
check((r.data ?? []).some(n => n.tipo === 'RUTINA' && /lista/.test(n.titulo)), 'al socio le llega el aviso en su app')
r = await req('GET', '/pedidos-rutina/cantidad', { token: profe })
check(r.data?.abiertos === antes, 'y deja de contar como pendiente')
check((await req('PATCH', `/pedidos-rutina/${pedido}/tomar`, { token: profe })).status === 400, 'un pedido cerrado no se puede volver a tomar')

// Descartar con motivo y cancelar
r = await req('POST', '/socio-app/rutinas/pedido', { token: ana.token, body: { diasSemana: 2 } })
const pedidoAna = r.data?.id
check((await req('PATCH', `/pedidos-rutina/${pedidoAna}/descartar`, { token: profe, body: { motivo: 'no' } })).status === 400, 'descartar sin explicar → 400')
r = await req('PATCH', `/pedidos-rutina/${pedidoAna}/descartar`, { token: profe, body: { motivo: 'Pasá el martes así te evaluamos' } })
check(r.status === 200 && r.data.estado === 'DESCARTADA', 'el profe lo descarta con un motivo')
r = await req('GET', '/notificaciones/mias', { token: ana.token })
check((r.data ?? []).some(n => n.tipo === 'RUTINA' && n.mensaje.includes('martes')), 'al socio le llega el motivo')
r = await req('POST', '/socio-app/rutinas/pedido', { token: ana.token, body: {} })
check(r.status === 200, 'puede volver a pedir')
check((await req('DELETE', '/socio-app/rutinas/pedido', { token: ana.token })).status === 204, 'y cancelarlo')
check((await req('DELETE', '/socio-app/rutinas/pedido', { token: ana.token })).status === 400, 'cancelar sin pedido abierto → 400')
const notifsStaff = (await req('GET', '/notificaciones', { token: admin })).data ?? []
check(!notifsStaff.some(n => n.tipo === 'RUTINA'), 'los avisos automáticos no llenan el historial del staff')

terminar()
