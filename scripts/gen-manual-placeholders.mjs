/**
 * Genera placeholders SVG para capturas del manual.
 * Ejecutar: node scripts/gen-manual-placeholders.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const sets = {
  admin: [
    '01-login',
    '02-navbar-admin',
    '03-personal-nuevo',
    '04-asignaciones',
    '05-metas-pri',
    '06-usuario-nuevo',
    '07-usuarios-lista',
    '08-servicios',
    '09-bitacora',
    '10-bitacora-modal',
    '11-dashboard',
    '12-reportes',
    '13-backup',
    '14-logout',
  ],
  representante: [
    '01-login',
    '02-navbar-rep',
    '03-bitacora',
    '04-bitacora-modal',
    '05-dashboard',
    '06-reportes',
    '07-logout',
  ],
}

function svg(label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fef3c7"/>
      <stop offset="50%" style="stop-color:#e0f2fe"/>
      <stop offset="100%" style="stop-color:#bfdbfe"/>
    </linearGradient>
  </defs>
  <rect width="960" height="540" fill="url(#bg)"/>
  <rect x="24" y="24" width="912" height="492" rx="16" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8 6"/>
  <text x="480" y="248" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="600" fill="#475569">${label}</text>
  <text x="480" y="284" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#64748b">Placeholder — reemplazar por captura real</text>
  <text x="480" y="310" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#94a3b8">Mismo nombre de archivo (.png recomendado)</text>
</svg>`
}

for (const [slug, names] of Object.entries(sets)) {
  const dir = join(root, 'public', 'manual', slug, 'imagenes')
  await mkdir(dir, { recursive: true })
  for (const name of names) {
    await writeFile(join(dir, `${name}.svg`), svg(name), 'utf8')
  }
  await writeFile(
    join(dir, 'LEEME.txt'),
    'Sustituye cada .svg por tu captura real manteniendo el nombre base (ej. 01-login.png).\n' +
      'Luego en index.md busca ".svg" y reemplaza por ".png".\n',
    'utf8',
  )
}

console.log('Placeholders generados en public/manual/*/imagenes/')
