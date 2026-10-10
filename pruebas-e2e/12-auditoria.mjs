// Correcciones de la auditoría: cobro idempotente, validación del socio, errores sin detalles técnicos,
// cierre de sesión real, 401/403/404, listado paginado de socios, pagos por período y caja solo admin.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

const alta = (dni, extra = {}) => req('POST', '/socios/alta', { token: admin, body: { nombre: 'Audi', apellido: 'Toria', dni, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO', ...extra } })
const sinTecnicismos = r => !/sql|insert|constraint|could not|llave|varying/i.test(JSON.stringify(r.data ?? ''))

console.log('\nValidación del socio en el servidor')
let r = await alta('abc')
check(r.status === 400 && /DNI/.test(r.data?.error ?? ''), 'DNI con letras → 400 con mensaje claro', JSON.stringify(r.data))
r = await alta('81' + suf, { email: 'no-es-mail' })
check(r.status === 400 && /email/i.test(r.data?.error ?? ''), 'email inválido → 400', JSON.stringify(r.data))
r = await alta('82' + suf, { nombre: 'A'.repeat(300) })
check(r.status === 400 && sinTecnicismos(r), 'nombre larguísimo → 400 sin detalles de la base', JSON.stringify(r.data))
r = await alta('83' + suf, { telefono: 'llamame' })
check(r.status === 400, 'teléfono con letras → 400')
r = await alta('84' + suf, { email: '  ', telefono: '' })
check(r.status === 200, 'email y teléfono vacíos se aceptan', JSON.stringify(r.data))
const socio = r.data?.socioId
const pin = r.data?.pin
const [d1, d2] = await Promise.all([alta('85' + suf), alta('85' + suf)])
const dup = d1.status === 200 ? d2 : d1
check([d1.status, d2.status].includes(200) && (dup.status === 400 || dup.status === 409) && sinTecnicismos(dup), 'dos altas simultáneas con el mismo DNI: una entra, la otra con mensaje limpio', JSON.stringify([d1.status, d2.status, dup.data]))
const datos = (await req('GET', `/socios/${socio}`, { token: admin })).data
r = await req('PUT', `/socios/${socio}`, { token: admin, body: { ...datos, email: 'malo@' } })
check(r.status === 400 && /email/i.test(r.data?.error ?? ''), 'al editar también valida (y el mensaje dice qué está mal)', JSON.stringify(r.data))

console.log('\nCobro sin duplicados')
const cobro = { socioId: socio, planTipo: 'MENSUAL', metodoPago: 'TARJETA' }
const clave = 'prueba-' + suf
const pagosAntes = (await req('GET', `/pagos?desde=2000-01-01`, { token: admin })).data.filter(p => p.socioId === socio).length
const [c1, c2] = await Promise.all([1, 2].map(() => req('POST', '/pagos/con-membresia', { token: admin, body: cobro, headers: { 'Idempotency-Key': clave } })))
check(c1.status === 200 && c2.status === 200 && c1.data.id === c2.data.id, 'misma clave dos veces a la vez → un solo pago', JSON.stringify([c1.data?.id, c2.data?.id]))
r = await req('POST', '/pagos/con-membresia', { token: admin, body: cobro, headers: { 'Idempotency-Key': clave } })
check(r.data?.id === c1.data?.id, 'reintentar más tarde con la misma clave devuelve el mismo pago')
const [s1, s2] = await Promise.all([1, 2].map(() => req('POST', '/pagos/con-membresia', { token: admin, body: { ...cobro, metodoPago: 'TRANSFERENCIA' } })))
check(s1.data?.id === s2.data?.id, 'sin clave: doble clic (mismo plan y medio en segundos) → un solo pago', JSON.stringify([s1.data?.id, s2.data?.id]))
const pagosDespues = (await req('GET', `/pagos?desde=2000-01-01`, { token: admin })).data.filter(p => p.socioId === socio).length
check(pagosDespues - pagosAntes === 2, `quedaron exactamente 2 pagos nuevos (uno por cobro real)`, String(pagosDespues - pagosAntes))

console.log('\nErrores y códigos')
r = await req('GET', '/socios')
check(r.status === 401, 'sin sesión → 401', String(r.status))
r = await req('GET', '/socios/999999999', { token: admin })
check(r.status === 404, 'socio inexistente → 404', String(r.status))
r = await req('DELETE', `/socios/${socio}/permanente`, { token: admin })
check(r.status >= 400 && r.status !== 500 && r.status !== 204, 'ya no existe el borrado permanente (solo la baja lógica)', String(r.status))
await req('POST', '/profesores', { token: admin, body: { username: 'au' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'au' + suf, password: 'Profe2026' } })).data?.token
for (const [m, p] of [['GET', '/cierre-caja/resumen'], ['POST', '/cierre-caja'], ['GET', '/cierre-caja'], ['GET', '/egresos'], ['POST', '/egresos'], ['GET', '/pagos']]) {
  r = await req(m, p, { token: profe, body: m === 'POST' ? { fecha: '2020-01-01', descripcion: 'x', monto: 1 } : undefined })
  check(r.status === 403, `un profesor no accede a la caja: ${m} ${p}`, String(r.status))
}

console.log('\nCerrar sesión')
const tSocio = (await req('POST', '/auth/login-socio', { body: { dni: '84' + suf, pin } })).data?.token
check((await req('GET', `/membresias/socio/${socio}`, { token: tSocio })).status === 200, 'el socio entra')
r = await req('POST', '/auth/logout', { token: tSocio })
check(r.status === 204, 'cierra sesión')
r = await req('GET', `/membresias/socio/${socio}`, { token: tSocio })
check(r.status === 401, 'el token ya no sirve aunque no haya vencido', String(r.status))

console.log('\nListado paginado de socios')
r = await req('GET', '/socios/buscar?tam=5&pagina=1', { token: admin })
check(r.status === 200 && r.data.items.length <= 5 && r.data.total >= r.data.items.length && r.data.conteos?.activos >= 1, 'devuelve una página y los totales', JSON.stringify({ n: r.data?.items?.length, total: r.data?.total }))
r = await req('GET', `/socios/buscar?q=${'84' + suf}`, { token: admin })
check(r.data?.items?.length === 1 && r.data.items[0].id === socio && r.data.items[0].estadoMembresia === 'ACTIVA', 'busca por DNI y trae el estado de la membresía', JSON.stringify(r.data?.items?.[0]))
r = await req('GET', '/socios/buscar?orden=apellido&tam=50', { token: admin })
const apellidos = (r.data?.items ?? []).map(s => (s.apellido ?? '').toLowerCase())
check(apellidos.every((a, i) => i === 0 || apellidos[i - 1].localeCompare(a) <= 0), 'ordena por apellido')
r = await req('GET', '/socios/buscar?orden=cualquiera', { token: admin })
check(r.status === 400, 'orden inválido → 400')
r = await req('GET', '/socios/buscar', { token: tSocio })
check(r.status === 401 || r.status === 403, 'un socio no ve el listado')

console.log('\nPagos por período')
// Fecha local (no UTC: después de las 21 en Argentina, en UTC ya es mañana)
const ahora = new Date()
const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
r = await req('GET', `/pagos?desde=${hoy}&hasta=${hoy}`, { token: admin })
check(r.status === 200 && r.data.every(p => p.fechaPago.slice(0, 10) === hoy) && r.data.some(p => p.socioId === socio), 'solo los pagos del día pedido', String(r.data?.length))
r = await req('GET', '/pagos?desde=2030-01-01&hasta=2020-01-01', { token: admin })
check(r.status === 400, 'rango al revés → 400')

terminar()
