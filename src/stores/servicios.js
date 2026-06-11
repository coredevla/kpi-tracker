import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { repositories } from '@/data/repositories'
import { seedServicios } from '@/data/seedServicios'

export const useServiciosStore = defineStore('servicios', () => {
  const repo = repositories.servicios
  const items = ref([])
  const loaded = ref(false)

  async function load() {
    let data = await repo.list()
    // Seed inicial la primera vez que se usa la app.
    if (!data.length) {
      await repo.bulkInsert(seedServicios)
      data = await repo.list()
    }
    items.value = data
    loaded.value = true
  }

  const activos = computed(() => items.value.filter((s) => s.activo))

  function byId(id) {
    return items.value.find((s) => s.id === id) ?? null
  }

  async function create(payload) {
    const rec = await repo.create(payload)
    items.value.push(rec)
    return rec
  }

  async function update(id, patch) {
    const rec = await repo.update(id, patch)
    const idx = items.value.findIndex((x) => x.id === id)
    if (idx !== -1) items.value[idx] = rec
    return rec
  }

  async function softDelete(id) {
    return update(id, { activo: false })
  }
  async function restore(id) {
    return update(id, { activo: true })
  }

  async function remove(id) {
    await repo.remove(id)
    items.value = items.value.filter((x) => x.id !== id)
  }

  return { items, loaded, activos, load, byId, create, update, softDelete, restore, remove }
})
