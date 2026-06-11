import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repositories } from '@/data/repositories'

/**
 * Asignación = relación Personal ⇄ Servicio con su objetivo para un periodo.
 * { id, personalId, servicioId, periodo (YYYY-MM), objetivoMensual, activo }
 */
export const useAsignacionesStore = defineStore('asignaciones', () => {
  const repo = repositories.asignaciones
  const items = ref([])
  const loaded = ref(false)

  async function load() {
    items.value = await repo.list()
    loaded.value = true
  }

  function byId(id) {
    return items.value.find((a) => a.id === id) ?? null
  }

  function forPersona(personalId, periodo) {
    return items.value.filter(
      (a) => a.activo && a.personalId === personalId && (!periodo || a.periodo === periodo),
    )
  }

  function forPeriodo(periodo) {
    return items.value.filter((a) => a.activo && a.periodo === periodo)
  }

  function exists(personalId, servicioId, periodo) {
    return items.value.some(
      (a) => a.personalId === personalId && a.servicioId === servicioId && a.periodo === periodo,
    )
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

  return {
    items, loaded, load, byId, forPersona, forPeriodo, exists,
    create, update, softDelete, restore, remove,
  }
})
