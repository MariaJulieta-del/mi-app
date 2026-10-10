// Planes más vendidos, estado de membresías con uso, máquinas que se deshabilitan o eliminan
// y duración máxima de las rutinas (configurable por el admin).
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
await req('POST', '/profesores', { token: admin, body: { username: 'pv' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'pv' + suf, password: 'Profe2026' } })).data?.token

console.log('\nPlanes más vendidos')
const antes = (await req('GET', '/reportes/planes?meses=1', { token: admin })).data ?? []
const cobrosMensual = antes.find(p => p.tipo === 'MENSUAL')?.cobros ?? 0
let r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Plan', apellido: 'Vendido', dni: '91' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const socio = r.data?.socioId
r = await req('GET', '/reportes/planes?meses=1', { token: admin })
const mensual = r.data?.find(p => p.tipo === 'MENSUAL')
check(r.status === 200 && mensual?.cobros === cobrosMensual + 1, 'el alta suma un cobro al plan', JSON.stringify(mensual))
check(mensual?.nombre && mensual.monto > 0 && mensual.sociosActivos >= 1, 'trae nombre del plan, lo recaudado y los socios que lo tienen')
check(r.data.every((p, i) => i === 0 || r.data[i - 1].cobros >= p.cobros), 'ordenados del más vendido al menos vendido')
check((await req('GET', '/reportes/planes', { token: profe })).status === 403, 'un profesor no ve los planes vendidos')

console.log('\nEstado de membresías y uso')
r = await req('GET', '/reportes/estado-membresias', { token: admin })
const e = r.data
check(r.status === 200 && e.sociosActivos === e.alDia + e.vencidas + e.canceladas + e.sinMembresia, 'cada socio activo cae en un solo estado', JSON.stringify(e))
check(e.porVencer <= e.alDia && e.alDiaQueVinieron + e.alDiaSinVenir === e.alDia, 'los "por vencer" y el uso se cuentan dentro de los que están al día')
check(e.diasPorVencer === 7 && e.diasUso === 30, 'aclara los períodos usados')
r = await req('GET', '/socios/buscar?vista=activos&membresia=VENCIDA&tam=5', { token: admin })
check(r.status === 200 && r.data.items.every(s => s.estadoMembresia === 'VENCIDA'), 'el listado de vencidas solo trae vencidas')

console.log('\nMáquinas: deshabilitar y eliminar')
r = await req('POST', '/maquinas', { token: admin, body: { nombre: 'Borrable ' + suf, grupos: ['Pecho'], activa: true } })
const libre = r.data?.id
r = await req('POST', '/ejercicios', { token: admin, body: { nombre: 'Press borrable ' + suf, grupos: ['Pecho'], esMaquina: true, activo: true, maquinaIds: [libre] } })
const ej = r.data?.id
r = await req('DELETE', `/maquinas/${libre}`, { token: admin })
check(r.status < 300, 'se deshabilita')
check(!(await req('GET', '/maquinas', { token: admin })).data.some(m => m.id === libre), 'deshabilitada no aparece en el listado de activas')
r = await req('PATCH', `/maquinas/${libre}/activar`, { token: admin })
check(r.status < 300 && r.data?.activa === true, 'se vuelve a habilitar')
check((await req('DELETE', `/maquinas/${libre}/definitivo`, { token: profe })).status === 403, 'un profesor no puede eliminar máquinas')
r = await req('DELETE', `/maquinas/${libre}/definitivo`, { token: admin })
check(r.status === 204, 'sin arreglos registrados se elimina', String(r.status))
check((await req('GET', `/maquinas/${libre}`, { token: admin })).status === 404, 'ya no existe')
r = await req('GET', `/ejercicios/${ej}`, { token: admin })
check(r.status === 200 && !(r.data.maquinaIds ?? []).includes(libre), 'el ejercicio que la usaba sigue, sin esa máquina', JSON.stringify(r.data?.maquinaIds))

r = await req('POST', '/maquinas', { token: admin, body: { nombre: 'Con historial ' + suf, grupos: ['Espalda'], activa: true } })
const usada = r.data?.id
await req('POST', '/mantenimientos', { token: admin, body: { maquinaId: usada, tipo: 'PENDIENTE', categoria: 'CORRECTIVO', descripcion: 'Ruido' } })
r = await req('DELETE', `/maquinas/${usada}/definitivo`, { token: admin })
check(r.status === 400 || r.status === 409, 'con arreglos registrados no se elimina', String(r.status))
check(/deshabilitala/i.test(r.data?.error ?? ''), 'y explica que hay que deshabilitarla', JSON.stringify(r.data))
check((await req('GET', `/maquinas/${usada}`, { token: admin })).status === 200, 'la máquina sigue estando')

console.log('\nDuración máxima de las rutinas')
r = await req('GET', '/configuracion/rutinas', { token: profe })
check(r.status === 200 && r.data.semanasMax >= 2, 'el staff ve el límite', JSON.stringify(r.data))
const original = r.data?.semanasMax
check((await req('PUT', '/configuracion/rutinas', { token: profe, body: { semanasMax: 4 } })).status === 403, 'un profesor no lo cambia')
check((await req('PUT', '/configuracion/rutinas', { token: admin, body: { semanasMax: 1 } })).status === 400, 'menos de 2 semanas → 400')
check((await req('PUT', '/configuracion/rutinas', { token: admin, body: { semanasMax: 40 } })).status === 400, 'más de 26 semanas → 400')
r = await req('PUT', '/configuracion/rutinas', { token: admin, body: { semanasMax: 5 } })
check(r.status === 200 && r.data.semanasMax === 5, 'el admin lo cambia')

const h = { 'X-Socio-Id': socio }
r = await req('POST', '/rutinas', { token: admin, headers: h, body: { nombre: 'Vigente ' + suf } })
const rutina = r.data?.id
check(r.data?.semanasMax === 5 && r.data.semanasActual === 0 && r.data.paraRenovar === false, 'una rutina nueva: semana 0 de 5, no hay que renovarla', JSON.stringify(r.data))
await req('PUT', `/rutinas/${rutina}/ejercicios`, { token: admin, headers: h, body: [{ nombreEjercicio: 'Sentadilla', series: 4, repeticiones: 8, dia: 1 }] })
r = await req('GET', `/rutinas/${rutina}`, { token: admin, headers: h })
check(r.data?.fechaRenovacion && r.data.fechaRenovacion >= r.data.fechaCreacion, 'cambiar los ejercicios renueva la fecha', JSON.stringify([r.data?.fechaCreacion, r.data?.fechaRenovacion]))
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Plantilla ' + suf } })
check(r.data?.paraRenovar === false, 'las plantillas nunca quedan "para renovar"')
await req('PUT', '/configuracion/rutinas', { token: admin, body: { semanasMax: original } })

terminar()
