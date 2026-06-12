import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const payload = {
  version: pkg.version,
  builtAt: new Date().toISOString(),
}

writeFileSync(join(root, 'public', 'version.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(`version.json → ${pkg.version}`)
