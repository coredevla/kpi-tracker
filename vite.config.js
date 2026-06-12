import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// Despliegue:
// - GitHub Pages: el workflow inyecta GH_PAGES_BASE=/<repo>/ para que carguen los assets.
// - Vercel / dominio raíz / usuario.github.io: no se setea la variable y queda en '/'.
const base = process.env.GH_PAGES_BASE || '/'

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
