// Corre todas las pruebas en orden. Uso: node pruebas-e2e/todas.mjs
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
let fallas = 0
for (const f of readdirSync(dir).filter(f => /^\d\d-.*\.mjs$/.test(f)).sort()) {
  console.log(`\n══════ ${f}`)
  const r = spawnSync(process.execPath, [join(dir, f)], { stdio: 'inherit', env: process.env })
  if (r.status !== 0) fallas++
}
console.log(fallas ? `\n✘ ${fallas} archivo(s) con fallas` : '\n✔ Todas las pruebas pasaron')
process.exit(fallas ? 1 : 0)
