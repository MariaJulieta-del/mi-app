// Mantenimiento preventivo/correctivo, máquinas en los ejercicios de la rutina,
// motivo de baja de socios y cambio de contraseña del staff.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

console.log('\nMantenimiento')
let r = await req('POST', '/maquinas', { token: admin, body: { nombre: 'Prensa ' + suf, nroMaquina: 'P' + suf.slice(-4), grupos: ['Cuádriceps'], activa: true } })
check(r.status < 300 && !!r.data?.id, 'admin crea máquina', JSON.stringify(r.data))
const maquina = r.data?.id
r = await req('POST', '/mantenimientos', { token: admin, body: { maquinaId: maquina, tipo: 'PENDIENTE', categoria: 'CORRECTIVO', descripcion: 'Cable cortado' } })
check(r.status === 200 && r.data.tipo === 'PENDIENTE' && r.data.categoria === 'CORRECTIVO', 'reporte correctivo queda PENDIENTE con categoría', JSON.stringify(r.data))
const mant = r.data?.id
r = await req('POST', '/mantenimientos', { token: admin, body: { maquinaId: maquina, tipo: 'PREVENTIVO', descripcion: 'Lubricar' } })
check(r.status === 200 && r.data.tipo === 'PENDIENTE' && r.data.categoria === 'PREVENTIVO', 'tipo PREVENTIVO (formato viejo) se acepta como categoría', JSON.stringify(r.data))
r = await req('POST', '/mantenimientos', { token: admin, body: { maquinaId: maquina, tipo: 'PENDIENTE', categoria: 'CUALQUIERA', descripcion: 'x' } })
check(r.status === 400, 'categoría inválida → 400')
r = await req('PUT', `/mantenimientos/${mant}`, { token: admin, body: { tipo: 'REALIZADO' } })
check(r.status === 200 && r.data.tipo === 'REALIZADO' && r.data.categoria === 'CORRECTIVO', 'marcar realizado conserva la categoría', JSON.stringify(r.data))

console.log('\nMáquinas en los ejercicios de la rutina')
r = await req('POST', '/ejercicios', { token: admin, body: { nombre: 'Prensa 45 ' + suf, grupos: ['Cuádriceps'], esMaquina: false, activo: true, maquinaIds: [maquina] } })
check(r.status === 200, 'ejercicio con máquina asociada', JSON.stringify(r.data))
const ejCat = r.data?.id
r = await req('POST', '/rutinas', { token: admin, body: { nombre: 'Piernas ' + suf, objetivo: 'FUERZA', dificultad: 'MEDIA' } })
const rutina = r.data?.id
r = await req('POST', `/rutinas/${rutina}/ejercicios`, { token: admin, body: { nombreEjercicio: 'Prensa 45 ' + suf, ejercicioCatalogoId: ejCat, series: 4, repeticiones: 10 } })
check(r.status === 200 && r.data.maquinas?.[0]?.nroMaquina === 'P' + suf.slice(-4), 'al agregarlo trae la máquina con su número', JSON.stringify(r.data))
r = await req('GET', `/rutinas/${rutina}/ejercicios`, { token: admin })
const ej = r.data?.find(e => e.ejercicioCatalogoId === ejCat)
check(ej?.maquinas?.length === 1 && ej.maquinas[0].nombre === 'Prensa ' + suf, 'la lista de ejercicios trae nombre y número de máquina', JSON.stringify(ej))

console.log('\nBaja de socios con motivo')
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Bruno', apellido: 'Baja', dni: '33' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const socio = r.data?.socio?.id ?? r.data?.socioId ?? r.data?.id
r = await req('PUT', `/socios/${socio}/baja`, { token: admin, body: { motivo: 'INVENTADO' } })
check(r.status === 400, 'motivo inválido → 400')
r = await req('PUT', `/socios/${socio}/baja`, { token: admin, body: { motivo: 'PRECIO', detalle: 'Le subió la cuota' } })
check(r.status === 200, 'baja con motivo', JSON.stringify(r.data))
r = await req('PUT', `/socios/${socio}/baja`, { token: admin, body: { motivo: 'PRECIO' } })
check(r.status === 400, 'no se puede dar de baja dos veces')
r = await req('GET', '/socios/bajas', { token: admin })
let baja = r.data?.find(b => b.socioId === socio)
check(baja?.motivo === 'PRECIO' && baja.detalle === 'Le subió la cuota' && baja.registradoPor === 'admin' && !baja.socioActivo, 'el historial guarda motivo, detalle y quién la registró', JSON.stringify(baja))
await req('PUT', `/socios/${socio}/reactivar`, { token: admin })
baja = (await req('GET', '/socios/bajas', { token: admin })).data?.find(b => b.socioId === socio)
check(baja?.socioActivo === true, 'si vuelve, la baja queda marcada como "volvió"')

console.log('\nCambio de contraseña del staff')
await req('POST', '/profesores', { token: admin, body: { username: 'clave' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'clave' + suf, password: 'Profe2026' } })).data?.token
check(!!profe, 'profesor entra')
r = await req('POST', '/auth/cambiar-password', { token: profe, body: { actual: 'mal12345', nueva: 'Nueva2026x' } })
check(r.status === 400, 'contraseña actual incorrecta → 400')
r = await req('POST', '/auth/cambiar-password', { token: profe, body: { actual: 'Profe2026', nueva: 'corta' } })
check(r.status === 400, 'contraseña nueva débil → 400')
await new Promise(res => setTimeout(res, 1100))   // el token viejo tiene que ser de un segundo anterior
r = await req('POST', '/auth/cambiar-password', { token: profe, body: { actual: 'Profe2026', nueva: 'Nueva2026x' } })
check(r.status === 200 && !!r.data?.token, 'cambia la contraseña y recibe token nuevo', JSON.stringify(r.data))
const profeNuevo = r.data?.token
check((await req('GET', '/socios', { token: profe })).status === 401, 'el token viejo deja de valer')
check((await req('GET', '/socios', { token: profeNuevo })).status === 200, 'el token nuevo funciona')
check((await req('POST', '/auth/login', { body: { username: 'clave' + suf, password: 'Profe2026' } })).status === 401, 'la contraseña vieja ya no entra')
check((await req('POST', '/auth/login', { body: { username: 'clave' + suf, password: 'Nueva2026x' } })).status === 200, 'la contraseña nueva entra')

terminar()
