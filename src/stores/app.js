import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePersonalStore } from './personal'
import { useServiciosStore } from './servicios'
import { useAsignacionesStore } from './asignaciones'
import { useVentasStore } from './ventas'
import { useUsuariosStore } from './usuarios'
import { usePriStore } from './pri'
import { useAuthStore } from './auth'
import { repositories, COLLECTIONS } from '@/data/repositories'

export const useAppStore = defineStore('app', () => {
  const ready = ref(false)
  const dark = ref(true)
  let bootPromise = null

  /** Idempotente: ejecuta la carga inicial una sola vez (lo usan App.vue y el guard del router). */
  function bootstrap() {
    if (!bootPromise) bootPromise = doBootstrap()
    return bootPromise
  }

  /** Carga (o recarga) los datos de negocio. Requiere sesión: la RLS no permite anónimos. */
  async function loadData() {
    const stores = [
      useServiciosStore(),
      usePersonalStore(),
      useAsignacionesStore(),
      useVentasStore(),
      usePriStore(),
      useUsuariosStore(),
    ]
    await Promise.all(stores.map((s) => s.load()))
  }

  async function doBootstrap() {
    // Restaura la sesión de Supabase Auth (si la hay) antes de cargar datos.
    const auth = useAuthStore()
    await auth.restore()

    // Con RLS activa, los datos solo se leen autenticado.
    if (auth.isAuthenticated) await loadData()

    const saved = localStorage.getItem('kpi-tracker:theme')
    dark.value = saved ? saved === 'dark' : true
    applyTheme()
    ready.value = true
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', dark.value)
  }

  function toggleTheme() {
    dark.value = !dark.value
    localStorage.setItem('kpi-tracker:theme', dark.value ? 'dark' : 'light')
    applyTheme()
  }

  /** Exporta todas las colecciones a un objeto serializable (respaldo). */
  async function exportData() {
    const data = {}
    for (const c of COLLECTIONS) {
      data[c] = await repositories[c].list()
    }
    return { exportedAt: new Date().toISOString(), version: 2, data }
  }

  /** Restaura un respaldo previamente exportado y recarga los stores. */
  async function importData(payload) {
    const data = payload?.data ?? payload
    for (const c of COLLECTIONS) {
      if (Array.isArray(data[c])) {
        await repositories[c].replaceAll(data[c])
      }
    }
    bootPromise = null
    ready.value = false
    await bootstrap()
  }

  return { ready, dark, bootstrap, loadData, toggleTheme, exportData, importData }
})
