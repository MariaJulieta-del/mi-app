// Género y edad del socio, métricas de público y circuito de caja (cambio inicial, gastos, cierre).
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

const iso = d => d.toISOString().slice(0, 10)
const hoy = new Date()
const haceAnios = n => { const d = new Date(hoy); d.setFullYear(d.getFullYear() - n); return iso(d) }

console.log('\nGénero y edad del socio')
let r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Noa', apellido: 'Prueba', dni: '44' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO', genero: 'NO_BINARIO', fechaNacimiento: haceAnios(27) } })
check(r.status === 200, 'alta con género y fecha de nacimiento', JSON.stringify(r.data))
const socio = r.data?.socioId
r = await req('GET', `/socios/${socio}`, { token: admin })
check(r.data?.genero === 'NO_BINARIO' && r.data?.fechaNacimiento === haceAnios(27), 'se guardan género y nacimiento', JSON.stringify(r.data))
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'X', apellido: 'Y', dni: '45' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO', genero: 'OTRO' } })
check(r.status === 400, 'género inválido → 400')
const manana = new Date(hoy); manana.setDate(manana.getDate() + 1)
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'X', apellido: 'Y', dni: '46' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO', fechaNacimiento: iso(manana) } })
check(r.status === 400, 'nacimiento en el futuro → 400')
const datos = (await req('GET', `/socios/${socio}`, { token: admin })).data
r = await req('PUT', `/socios/${socio}`, { token: admin, body: { ...datos, genero: 'femenino' } })
check(r.status === 200 && r.data?.genero === 'FEMENINO', 'al editar se normaliza el género', JSON.stringify(r.data))
r = await req('PUT', `/socios/${socio}`, { token: admin, body: { ...datos, genero: '' } })
check(r.status === 200 && r.data?.genero == null, 'vacío = sin dato')
await req('PUT', `/socios/${socio}`, { token: admin, body: { ...datos, genero: 'NO_BINARIO' } })

console.log('\nPúblico del gimnasio')
await req('POST', '/asistencias/checkin', { token: admin, body: { dni: '44' + suf } })
r = await req('GET', '/reportes/demografia?dias=30', { token: admin })
check(r.status === 200 && r.data.generos?.length === 3 && r.data.edades?.length === 6 && r.data.franjas?.length === 6, 'devuelve géneros, rangos de edad y franjas', JSON.stringify(r.data).slice(0, 200))
const nb = r.data?.generos?.find(g => g.clave === 'NO_BINARIO')
check(nb?.socios >= 1, 'cuenta al socio no binario')
check(typeof r.data?.edadPromedio === 'number', 'calcula la edad promedio')
const rango = r.data?.edades?.find(g => g.nombre === '25 a 34')
check(rango?.socios >= 1, 'lo ubica en el rango de 25 a 34')
await req('POST', '/profesores', { token: admin, body: { username: 'pub' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'pub' + suf, password: 'Profe2026' } })).data?.token
r = await req('GET', '/reportes/demografia', { token: profe })
check(r.status === 403, 'un profesor no ve las métricas del negocio')

console.log('\nCaja: cambio inicial, gastos y cierre')
// Un día viejo y distinto en cada corrida para no chocar con cierres anteriores
const base = new Date(2015, 0, 1)
const F = new Date(base); F.setDate(base.getDate() + (Math.floor(Date.now() / 1000) % 3000))
const dia = iso(F)
const F2 = new Date(F); F2.setDate(F.getDate() + 1)
const dia2 = iso(F2)

r = await req('POST', '/egresos', { token: admin, body: { fecha: dia, descripcion: 'Lavandina', monto: 500, categoria: 'LIMPIEZA' } })
check(r.status === 200 && r.data.registradoPor === 'admin', 'gasto de caja con quién lo cargó', JSON.stringify(r.data))
const gasto = r.data?.id
r = await req('GET', `/cierre-caja/resumen?fecha=${dia}`, { token: admin })
const res = r.data
check(r.status === 200 && Number(res.totalEgresos) === 500 && !res.cerrada, 'el resumen suma el gasto')
check(Math.abs(Number(res.balanceCalculado) - (Number(res.fondoInicial) + Number(res.totalEfectivo) - 500)) < 0.01, 'debería haber = cambio inicial + efectivo − gastos', JSON.stringify(res))

r = await req('POST', '/cierre-caja', { token: admin, body: { fecha: dia, montoContado: 1000, dejaEnCaja: 5000 } })
check(r.status === 400, 'no se puede dejar más de lo que hay → 400')
r = await req('POST', '/cierre-caja', { token: admin, body: { fecha: dia, montoContado: -5 } })
check(r.status === 400, 'monto contado negativo → 400')
r = await req('POST', '/cierre-caja', { token: admin, body: { fecha: iso(manana) } })
check(r.status === 400, 'no se cierra un día futuro')
r = await req('POST', '/cierre-caja', { token: admin, body: { fecha: dia, montoContado: 1000, dejaEnCaja: 300, observaciones: 'prueba' } })
check(r.status === 200 && r.data.cerrada && r.data.creadoPor === 'admin', 'cierra y guarda quién cerró', JSON.stringify(r.data))
check(Number(r.data?.retiro) === 700 && Number(r.data?.dejaEnCaja) === 300, 'retiro = contado − lo que queda', JSON.stringify(r.data))
check(Math.abs(Number(r.data?.diferencia) - (1000 - Number(res.balanceCalculado))) < 0.01, 'diferencia = contado − lo que debería haber')
r = await req('POST', '/cierre-caja', { token: admin, body: { fecha: dia } })
check(r.status === 400, 'no se cierra dos veces')
r = await req('POST', '/egresos', { token: admin, body: { fecha: dia, descripcion: 'Tarde', monto: 10 } })
check(r.status === 400, 'no se agregan gastos a una caja cerrada')
r = await req('DELETE', `/egresos/${gasto}`, { token: admin })
check(r.status === 400, 'ni se borran')
r = await req('GET', `/cierre-caja/resumen?fecha=${dia2}`, { token: admin })
check(Number(r.data?.fondoInicial) === 300, 'el día siguiente arranca con lo que quedó de cambio', JSON.stringify(r.data))

console.log('\nCajas sin cerrar')
const hace3 = new Date(hoy); hace3.setDate(hoy.getDate() - 3)
r = await req('POST', '/egresos', { token: admin, body: { fecha: iso(hace3), descripcion: 'Agua ' + suf, monto: 100 } })
const gasto3 = r.data?.id
r = await req('GET', '/cierre-caja/pendientes', { token: admin })
check(r.status === 200 && r.data.includes(iso(hace3)), 'avisa que quedó una caja sin cerrar', JSON.stringify(r.data))
await req('DELETE', `/egresos/${gasto3}`, { token: admin })
r = await req('GET', '/cierre-caja/pendientes', { token: profe })
check(r.status === 403, 'un profesor no ve la caja')

terminar()
