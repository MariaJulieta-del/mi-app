// Asignar una plantilla no la copia: queda vinculada al socio y la plantilla sabe a quiénes está asignada.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()

const alta = async (dni, nombre) => {
  const r = await req('POST', '/socios/alta', { token: admin, body: { nombre, apellido: 'Asignada', dni, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
  const t = (await req('POST', '/auth/login-socio', { body: { dni, pin: r.data.pin } })).data?.token
  return { id: r.data.socioId, token: t }
}
const ana = await alta('81' + suf, 'Ana')
const beto = await alta('82' + suf, 'Beto')
const caro = await alta('83' + suf, 'Caro')

// Una plantilla con ejercicios y otra vacía
let r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Full body ' + suf, objetivo: 'HIPERTROFIA', diasSemana: ['Lunes', 'Jueves'] } })
const plantilla = r.data?.id
await req('PUT', `/rutinas/${plantilla}/ejercicios`, { token: admin, body: [
  { nombreEjercicio: 'Sentadilla', series: 4, repeticiones: 8, dia: 1 },
  { nombreEjercicio: 'Press de banca', series: 4, repeticiones: 10, dia: 2 },
] })
const vacia = (await req('POST', '/rutinas', { token: admin, body: { nombre: 'Vacía ' + suf } })).data?.id
const totalAntes = (await req('GET', '/rutinas/todas', { token: admin })).data?.length

console.log('\nAsignar sin copiar')
r = await req('POST', `/rutinas/${plantilla}/asignar`, { token: admin, body: { socioId: ana.id } })
check(r.status === 200 && r.data.id === plantilla && r.data.asignada === true && r.data.socioId === ana.id, 'se le asigna la plantilla a Ana (la misma, no una copia)', JSON.stringify(r.data))
check(r.data?.semanasActual === 0 && r.data?.paraRenovar === false, 'las semanas se cuentan desde hoy')
check((await req('GET', '/rutinas/todas', { token: admin })).data?.length === totalAntes, 'no se crea ninguna rutina nueva')
r = await req('POST', `/rutinas/${plantilla}/asignar`, { token: admin, body: { socioId: beto.id } })
check(r.status === 200, 'también a Beto')
r = await req('POST', `/rutinas/${plantilla}/asignar`, { token: admin, body: { socioId: beto.id } })
check(r.status === 200, 'asignarla de nuevo no falla (vuelve a contar las semanas)')
check((await req('POST', `/rutinas/${vacia}/asignar`, { token: admin, body: { socioId: ana.id } })).status === 400, 'una plantilla sin ejercicios no se asigna')
const personal = (await req('POST', '/rutinas', { token: admin, headers: { 'X-Socio-Id': caro.id }, body: { nombre: 'Solo de Caro ' + suf } })).data?.id
check((await req('POST', `/rutinas/${personal}/asignar`, { token: admin, body: { socioId: ana.id } })).status === 400, 'una rutina de un socio no se asigna como plantilla')
check((await req('POST', `/rutinas/${plantilla}/asignar`, { token: admin, body: {} })).status === 400, 'sin socio → 400')
check((await req('POST', `/rutinas/${plantilla}/asignar`, { token: ana.token, body: { socioId: ana.id } })).status === 403, 'un socio no asigna plantillas')

console.log('\nLa plantilla sabe a quiénes está asignada')
r = await req('GET', '/rutinas/generales', { token: admin })
check(r.data?.find(p => p.id === plantilla)?.cantidadAsignados === 2, 'la plantilla figura con 2 socios', JSON.stringify(r.data?.find(p => p.id === plantilla)))
r = await req('GET', `/rutinas/${plantilla}/asignados`, { token: admin })
check(r.status === 200 && r.data.length === 2 && r.data.every(a => a.semanas === 0 && !a.paraRenovar), 'lista de socios con sus semanas')
check(r.data?.some(a => a.socioId === ana.id && a.asignadaPor === 'admin'), 'con quién la asignó')
r = await req('GET', '/rutinas/todas', { token: admin })
check(!r.data?.some(x => x.socioId === ana.id || x.socioId === beto.id), '"De socios" no las muestra: no son personalizadas')
r = await req('GET', '/rutinas/asignaciones', { token: admin })
check(r.status === 200 && r.data.filter(a => a.plantillaId === plantilla).length === 2, 'listado de todas las asignaciones (para renovar)')
check((await req('GET', '/rutinas/asignaciones', { token: ana.token })).status === 403, 'un socio no ve las asignaciones de otros')

console.log('\nEl socio la usa como su rutina')
r = await req('GET', '/rutinas', { token: ana.token })
const enApp = r.data?.find(x => x.id === plantilla)
check(enApp?.asignada === true && enApp.cantidadEjercicios === 2, 'Ana la ve entre sus rutinas', JSON.stringify(r.data))
await req('PATCH', `/rutinas/${plantilla}/visible`, { token: admin, body: { visible: false } })
check((await req('GET', `/rutinas/${plantilla}`, { token: ana.token })).status === 200, 'la abre aunque la plantilla esté oculta para elegir')
r = await req('GET', `/rutinas/${plantilla}/ejercicios`, { token: ana.token })
check(r.status === 200 && r.data.length >= 2, 'y ve sus ejercicios')
check((await req('GET', `/rutinas/${plantilla}`, { token: caro.token })).status === 404, 'Caro (que no la tiene) no la abre si está oculta')
const ejercicio = r.data?.find(e => !e.esCalentamiento)?.id
r = await req('POST', '/progreso', { token: ana.token, body: { rutinaEjercicioId: ejercicio, pesoKg: 60, repeticionesReales: 8, seriesRealizadas: 4 } })
check(r.status === 200, 'Ana registra su progreso en un ejercicio de la plantilla', JSON.stringify(r.data))
check((await req('POST', '/progreso', { token: caro.token, body: { rutinaEjercicioId: ejercicio, pesoKg: 60, repeticionesReales: 8, seriesRealizadas: 4 } })).status === 403, 'Caro no puede registrar progreso en una plantilla que no tiene')
r = await req('POST', '/sesiones', { token: ana.token, body: { rutinaId: plantilla, dia: 1, duracionMin: 40, series: 8, volumenKg: 900, records: 0, sensacion: 'BIEN' } })
check(r.status === 200 && r.data?.rutinaNombre === 'Full body ' + suf, 'su entrenamiento queda registrado con la rutina', JSON.stringify(r.data))
r = await req('GET', `/progreso/socio/${beto.id}/rutina/${plantilla}`, { token: beto.token })
check(r.status === 200 && Object.keys(r.data ?? {}).length === 0, 'el progreso es de cada socio: Beto no ve el de Ana')

console.log('\nPedido de rutina resuelto con una plantilla')
r = await req('POST', '/socio-app/rutinas/pedido', { token: caro.token, body: { objetivo: 'FUERZA', diasSemana: 3 } })
check(r.status === 200, 'Caro pide una rutina')
await req('PATCH', `/rutinas/${plantilla}/visible`, { token: admin, body: { visible: true } })
r = await req('POST', `/rutinas/${plantilla}/asignar`, { token: admin, body: { socioId: caro.id } })
r = await req('GET', '/socio-app/rutinas/pedido', { token: caro.token })
check(r.data?.estado === 'HECHA' && r.data.rutinaId === plantilla, 'al asignarle la plantilla, el pedido se cierra solo', JSON.stringify(r.data))

console.log('\nAjustarla para un socio, quitarla y eliminar la plantilla')
r = await req('POST', `/rutinas/${plantilla}/personalizar`, { token: admin, body: { socioId: ana.id } })
const copiaAna = r.data?.id
check(r.status === 200 && copiaAna !== plantilla && r.data.socioId === ana.id && !r.data.asignada && r.data.cantidadEjercicios === 2, 'ajustar para Ana la copia como rutina propia', JSON.stringify(r.data))
r = await req('GET', `/rutinas/${plantilla}/asignados`, { token: admin })
check(!r.data?.some(a => a.socioId === ana.id), 'y Ana deja de figurar en la plantilla')
check((await req('GET', '/rutinas/todas', { token: admin })).data?.some(x => x.id === copiaAna), 'su copia aparece en "De socios"')
r = await req('DELETE', `/rutinas/${plantilla}`, { token: admin })
check(r.status === 400 && /asignada/.test(r.data?.error ?? ''), 'no se elimina una plantilla que tienen socios', JSON.stringify(r.data))
check((await req('DELETE', `/rutinas/${plantilla}/asignaciones/${beto.id}`, { token: admin })).status === 204, 'se la quita a Beto')
check((await req('DELETE', `/rutinas/${plantilla}/asignaciones/${beto.id}`, { token: admin })).status === 404, 'quitarla dos veces → 404')
check(!(await req('GET', '/rutinas', { token: beto.token })).data?.some(x => x.id === plantilla), 'Beto ya no la tiene')
await req('DELETE', `/rutinas/${plantilla}/asignaciones/${caro.id}`, { token: admin })
check((await req('DELETE', `/rutinas/${plantilla}`, { token: admin })).status === 200, 'sin socios, la plantilla se elimina')
check((await req('GET', `/rutinas/${copiaAna}`, { token: ana.token })).status === 200, 'la copia ajustada de Ana sigue')

console.log('\nEl socio elige una plantilla desde su app')
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Elegible ' + suf } })
const elegible = r.data?.id
await req('PUT', `/rutinas/${elegible}/ejercicios`, { token: admin, body: [{ nombreEjercicio: 'Remo', series: 3, repeticiones: 12, dia: 1 }] })
r = await req('POST', `/socio-app/rutinas/plantillas/${elegible}/elegir`, { token: beto.token })
check(r.status === 200 && r.data.id === elegible && r.data.asignada && r.data.elegidaPorSocio, 'se la asigna (no se copia)', JSON.stringify(r.data))
r = await req('GET', `/rutinas/${elegible}/asignados`, { token: admin })
check(r.data?.[0]?.elegidaPorSocio === true && r.data[0].socioId === beto.id, 'en la plantilla figura que la eligió el socio')

terminar()
