// PB-17 recordatorio automático de vencimiento de cuota y PB-20 copias de seguridad de la base.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar, API } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
await req('POST', '/profesores', { token: admin, body: { username: 'rb' + suf, password: 'Profe2026' } })
const profe = (await req('POST', '/auth/login', { body: { username: 'rb' + suf, password: 'Profe2026' } })).data?.token

console.log('\nRecordatorio de vencimiento de cuota (PB-17)')
let r = await req('GET', '/recordatorios-cuota', { token: admin })
check(r.status === 200 && typeof r.data.config.dias === 'number' && Array.isArray(r.data.ultimos), 'el admin ve la configuración y lo enviado', JSON.stringify(r.data?.config))
const original = r.data.config
check((await req('GET', '/recordatorios-cuota', { token: profe })).status === 403, 'un profesor no lo ve')
check((await req('PUT', '/recordatorios-cuota', { token: admin, body: { ...original, dias: 0 } })).status === 400, '0 días de anticipación → 400')
check((await req('PUT', '/recordatorios-cuota', { token: admin, body: { ...original, dias: 30 } })).status === 400, 'más de 15 días → 400')
r = await req('PUT', '/recordatorios-cuota', { token: admin, body: { activo: true, dias: 3, porMail: true, avisarVencida: true } })
check(r.status === 200 && r.data.dias === 3 && r.data.activo, 'el admin lo configura')

// Un plan de 2 días: el socio queda con la cuota por vencer
const tipo = 'R' + suf
await req('POST', '/tarifas', { token: admin, body: { tipo, nombre: 'Plan corto ' + suf, precio: 9900, duracionDias: 2 } })
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Rita', apellido: 'Recordada', dni: '93' + suf, tipoMembresia: tipo, formaDePago: 'EFECTIVO', email: `rita${suf}@prueba.test` } })
const socio = r.data?.socioId
const pin = r.data?.pin
r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Lejos', apellido: 'DeVencer', dni: '94' + suf, tipoMembresia: 'MENSUAL', formaDePago: 'EFECTIVO' } })
const socioLejos = r.data?.socioId

r = await req('POST', '/recordatorios-cuota/ejecutar', { token: admin })
check(r.status === 200 && r.data.activo && r.data.avisosApp >= 1, 'manda los recordatorios que corresponden', JSON.stringify(r.data))
r = await req('GET', '/recordatorios-cuota', { token: admin })
const mio = r.data.ultimos.filter(x => x.socioId === socio)
check(mio.length === 1 && mio[0].tipo === 'ANTES', 'al socio con la cuota por vencer le llegó uno', JSON.stringify(mio))
check(!r.data.ultimos.some(x => x.socioId === socioLejos), 'al que le falta un mes no le llega nada')

r = await req('POST', '/recordatorios-cuota/ejecutar', { token: admin })
const otra = await req('GET', '/recordatorios-cuota', { token: admin })
check(otra.data.ultimos.filter(x => x.socioId === socio).length === 1, 'si vuelve a correr, no se repite', JSON.stringify(r.data))

const tSocio = (await req('POST', '/auth/login-socio', { body: { dni: '93' + suf, pin } })).data?.token
r = await req('GET', '/notificaciones/mias', { token: tSocio })
const aviso = (r.data ?? []).find(n => n.tipo === 'CUOTA')
check(!!aviso && /vence/.test(aviso.titulo) && aviso.mensaje.includes('Plan corto ' + suf), 'el socio lo ve en su app, con el plan', JSON.stringify(aviso))
check(/9\.900/.test(aviso?.mensaje ?? ''), 'y con el precio para renovar', aviso?.mensaje)
r = await req('GET', '/notificaciones', { token: admin })
check(!(r.data ?? []).some(n => n.tipo === 'CUOTA'), 'los automáticos no llenan el historial de avisos del staff')

await req('PUT', '/recordatorios-cuota', { token: admin, body: { ...original, activo: false } })
r = await req('POST', '/recordatorios-cuota/ejecutar', { token: admin })
check(r.data?.activo === false && r.data.avisosApp === 0, 'apagado no manda nada')
await req('PUT', '/recordatorios-cuota', { token: admin, body: original })

console.log('\nCopias de seguridad (PB-20)')
check((await req('GET', '/backups', { token: profe })).status === 403, 'un profesor no ve las copias')
check((await req('POST', '/backups', { token: profe })).status === 403, 'ni puede hacer una')
r = await req('POST', '/backups', { token: admin })
const copia = r.data
check(r.status === 200 && copia.estado === 'OK' && copia.disponible, 'el admin hace una copia', JSON.stringify(copia))
check(copia.tablas >= 30 && copia.filas > 0 && copia.tamano > 0, 'incluye todas las tablas', `${copia.tablas} tablas, ${copia.filas} filas`)
r = await req('GET', '/backups', { token: admin })
check(r.status === 200 && r.data.copias[0].id === copia.id && r.data.cadaHoras > 0 && r.data.destino, 'aparece en el historial con el destino', JSON.stringify({ destino: r.data.destino, cada: r.data.cadaHoras }))

const resp = await fetch(`${API}/backups/${copia.id}/archivo`, { headers: { Authorization: `Bearer ${admin}` } })
const zip = Buffer.from(await resp.arrayBuffer())
check(resp.status === 200 && zip.subarray(0, 2).toString() === 'PK', 'se descarga el .zip', String(resp.status))
const nombres = zip.toString('latin1')
check(['restaurar.sql', 'manifest.json', 'LEEME.txt', 'datos/socios.csv', 'datos/pagos.csv'].every(n => nombres.includes(n)), 'trae los datos, el manifest y el script para restaurar')
check(!nombres.includes('datos/tokens_revocados.csv') && !nombres.includes('datos/flyway_schema_history.csv'), 'no copia sesiones cerradas ni el historial de Flyway')
check((await fetch(`${API}/backups/${copia.id}/archivo`)).status === 401, 'sin sesión no se descarga')
check((await req('GET', '/backups/999999999/archivo', { token: admin })).status === 404, 'copia inexistente → 404')

terminar()
