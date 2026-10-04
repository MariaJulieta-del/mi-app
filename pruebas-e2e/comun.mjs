// Utilidades comunes de las pruebas de punta a punta.
// Configuración por variables de entorno:
//   E2E_API         URL de la API (por defecto http://localhost:8080/api/v1)
//   E2E_ADMIN_USER  usuario admin (por defecto admin)
//   E2E_ADMIN_PASS  contraseña del admin (por defecto Admin1234)
export const API = process.env.E2E_API ?? 'http://localhost:8080/api/v1'
export const ADMIN_USER = process.env.E2E_ADMIN_USER ?? 'admin'
export const ADMIN_PASS = process.env.E2E_ADMIN_PASS ?? 'Admin1234'

let ok = 0, fail = 0
export const check = (c, m, x = '') => { if (c) { ok++; console.log('  ✔', m) } else { fail++; console.log('  ✘', m, x) } }

// Cada archivo de pruebas usa su propia IP de origen (X-Forwarded-For) para no chocar
// con el límite de intentos por IP de las otras pruebas.
const IP = `10.99.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`

export async function req(method, path, { token, body, headers = {} } = {}) {
  const r = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': IP, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await r.json() } catch { /* sin cuerpo */ }
  return { status: r.status, data }
}

export async function loginAdmin() {
  const r = await req('POST', '/auth/login', { body: { username: ADMIN_USER, password: ADMIN_PASS } })
  if (r.status !== 200) throw new Error(`No se pudo entrar como admin (${r.status}). Revisá E2E_ADMIN_USER / E2E_ADMIN_PASS.`)
  return r.data.token
}

export const esperar = ms => new Promise(res => setTimeout(res, ms))

export function terminar() {
  console.log(`\nResultado: ${ok} OK, ${fail} fallas`)
  process.exit(fail ? 1 : 0)
}
