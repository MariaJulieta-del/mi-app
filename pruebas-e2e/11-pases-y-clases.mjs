// Pases del plan y clases: anotarse o reservar no gasta pases; sin pases no se puede reservar;
// al inscribirse como fijo se avisa si las clases superan los pases del plan.
// Crea datos de prueba: correr SOLO contra una base de prueba (ver LEEME.md).
import { check, req, loginAdmin, terminar } from './comun.mjs'

const suf = String(Date.now()).slice(-6)
const admin = await loginAdmin()
check(!!admin, 'admin entra')

const tipo = 'UNPASE' + suf
await req('POST', '/tarifas', { token: admin, body: { tipo, nombre: 'Un pase ' + suf, precio: 100, duracionDias: 30, pasesMensuales: 1 } })
let r = await req('POST', '/socios/alta', { token: admin, body: { nombre: 'Pase', apellido: 'Unico', dni: '55' + suf, tipoMembresia: tipo, formaDePago: 'EFECTIVO' } })
const socio = r.data?.socioId
const t = (await req('POST', '/auth/login-socio', { body: { dni: '55' + suf, pin: r.data?.pin } })).data?.token
check(!!t, 'socio con plan de 1 pase por mes')

const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const enDias = n => { const d = new Date(Date.now() + n * 86400000); return { fecha: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, dia: DIAS[(d.getDay() + 6) % 7] } }
const d1 = enDias(1), d2 = enDias(2), d3 = enDias(3)
r = await req('POST', '/disciplinas', { token: admin, body: { nombre: 'Spinning ' + suf, horarios: [d1, d2, d3].map(x => ({ dia: x.dia, horaInicio: '19:00', horaFin: '20:00' })) } })
const disc = r.data?.id
check(r.status < 300, 'clase tres días por semana')

console.log('\nReservar')
r = await req('POST', '/reservas', { token: t, body: { disciplinaId: String(disc), fecha: d1.fecha, hora: '19:00' } })
check(r.status === 200 && r.data.estado === 'CONFIRMADA', 'reserva su primera clase', JSON.stringify(r.data))
r = await req('GET', `/membresias/socio/${socio}`, { token: t })
check(r.data?.pasesUsados === 0 && r.data?.pasesRestantes === 1, 'reservar no gasta el pase (se gasta al entrar)', JSON.stringify(r.data))
r = await req('POST', '/reservas', { token: t, body: { disciplinaId: String(disc), fecha: d2.fecha, hora: '19:00' } })
check(r.status === 400 && /reservados/.test(r.data?.error ?? ''), 'con el único pase ya comprometido no reserva otro día', JSON.stringify(r.data))
await req('POST', '/reservas/cancelar', { token: t, body: { disciplinaId: String(disc), fecha: d1.fecha, hora: '19:00' } })
r = await req('POST', '/reservas', { token: t, body: { disciplinaId: String(disc), fecha: d2.fecha, hora: '19:00' } })
check(r.status === 200, 'si cancela la primera, puede reservar otro día', JSON.stringify(r.data))

console.log('\nAlumno fijo')
r = await req('POST', `/reservas/disciplinas/${disc}/fijo`, { token: t })
check(r.status === 200 && /pases/.test(r.data?.aviso ?? ''), 'se anota, con aviso de que las clases superan sus pases', JSON.stringify(r.data?.aviso))
r = await req('GET', `/membresias/socio/${socio}`, { token: t })
check(r.data?.pasesUsados === 0, 'anotarse como fijo tampoco gasta pases')

terminar()
