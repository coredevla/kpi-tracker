import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Despliegue:
// - GitHub Pages: el workflow inyecta GH_PAGES_BASE=/<repo>/ para que carguen los assets.
// - Vercel / dominio raíz / usuario.github.io: no se setea la variable y queda en '/'.
const base = process.env.GH_PAGES_BASE || '/'

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
