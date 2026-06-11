import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { repositories } from '@/data/repositories'

export const usePersonalStore = defineStore('personal', () => {
  const repo = repositories.personal
  const items = ref([])
  const loaded = ref(false)

  async function load() {
    items.value = await repo.list()
    loaded.value = true
  }

  const activos = computed(() => items.value.filter((p) => p.activo))

  function byId(id) {
    return items.value.find((p) => p.id === id) ?? null
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
