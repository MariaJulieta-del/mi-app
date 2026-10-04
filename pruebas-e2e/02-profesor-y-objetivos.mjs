// Permisos del profesor (cobrar sí, ver pagos no) y objetivo de las rutinas
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, esperar, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

console.log('\nProfesor')
let r = await req('POST', '/profesores', { token: admin, body: { username: 'profe' + suf, password: 'Profe2026' } })
check(r.status === 200, 'admin crea profesor', JSON.stringify(r.data))
const profe = (await req('POST', '/auth/login', { body: { username: 'profe' + suf, password: 'Profe2026' } })).data?.token
check(!!profe, 'profesor entra')
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Carla', apellido: 'Test', dni: '32' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const socio = r.data?.socio?.id ?? r.data?.socioId ?? r.data?.id
r = await req('POST', '/pagos/con-membresia', { token: profe, body: { socioId: socio, planTipo: 'TRIMESTRAL', metodoPago: 'EFECTIVO' } })
check(r.status === 200, 'el profesor PUEDE cobrar una renovación', JSON.stringify(r.data))
check((await req('GET', '/pagos', { token: profe })).status === 403, 'el profesor NO ve la lista de pagos')
const mem = (await req('GET', `/membresias/socio/${socio}`, { token: profe })).data
check(mem?.tipoMembresia === 'TRIMESTRAL', 'el profesor ve la membresía renovada (sin montos de pagos)')
check((await req('GET', `/pagos/membresia/${mem.id}`, { token: profe })).status === 403, 'el profesor NO ve el historial de pagos')
check((await req('GET', '/reportes/dashboard', { token: profe })).status === 403, 'el profesor NO ve reportes')
check((await req('GET', '/reportes/metricas', { token: profe })).status === 403, 'el profesor NO ve métricas')
check((await req('GET', '/cierre-caja/resumen', { token: profe })).status === 403, 'el profesor NO ve la caja')
check((await req('GET', '/egresos', { token: profe })).status === 403, 'el profesor NO ve egresos')
check((await req('GET', '/auditoria', { token: profe })).status === 403, 'el profesor NO ve la auditoría')
check((await req('GET', '/pagos', { token: admin })).status === 200, 'el admin sí ve pagos')
r = await req('GET', '/auditoria', { token: admin })
check(r.data.some(a => a.accion === 'Cobró un plan' && a.usuario === 'profe' + suf), 'la auditoría registra que cobró el profesor')

console.log('\nObjetivo de rutinas')
r = await req('POST', '/rutinas', { token: profe, body: { nombre: 'Hipertrofia base', objetivo: 'HIPERTROFIA', dificultad: 'MEDIA' } })
check(r.status < 300 && r.data.objetivo === 'HIPERTROFIA', 'plantilla creada con objetivo', JSON.stringify(r.data))
const plantilla = r.data.id
r = await req('POST', '/rutinas', { token: profe, body: { nombre: 'Mala', objetivo: 'VOLAR' } })
check(r.status === 400, 'objetivo inválido rechazado', r.status)
r = await req('POST', `/rutinas/${plantilla}/clonar`, { token: profe, body: { socioId: socio } })
check(r.status < 300 && r.data.objetivo === 'HIPERTROFIA', 'al asignar la plantilla el objetivo se copia', JSON.stringify(r.data))
r = await req('GET', '/rutinas/generales', { token: profe })
check(r.data.find(x => x.id === plantilla)?.objetivo === 'HIPERTROFIA', 'el listado de plantillas trae el objetivo')
r = await req('PUT', `/rutinas/${plantilla}`, { token: profe, body: { nombre: 'Hipertrofia base', objetivo: 'fuerza' } })
check(r.status < 300 && r.data.objetivo === 'FUERZA', 'se puede cambiar el objetivo (normaliza mayúsculas)', JSON.stringify(r.data))

terminar()
