import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repositories } from '@/data/repositories'

/**
 * Meta de PRI (ingresos) por persona y periodo.
 * { id, personalId, periodo (YYYY-MM), objetivoMonto, activo }
 *
 * El objetivo PRI global de un periodo es la SUMA de las metas individuales
 * de las personas en alcance (no se guarda aparte): así el excedente de unas
 * personas compensa el déficit de otras ("milla extra").
 */
export const usePriStore = defineStore('pri', () => {
  const repo = repositories.metasPri
  const items = ref([])
  const loaded = ref(false)

  async function load() {
    items.value = await repo.list()
    loaded.value = true
  }

  function byId(id) {
    return items.value.find((m) => m.id === id) ?? null
  }

  function forPeriodo(periodo) {
    return items.value.filter((m) => m.activo && m.periodo === periodo)
  }

  /** Meta de una persona concreta en el periodo (0 si no tiene). */
  function objetivoDe(personalId, periodo) {
    const m = items.value.find(
      (x) => x.activo && x.personalId === personalId && x.periodo === periodo,
    )
    return m ? Number(m.objetivoMonto) || 0 : 0
  }

  /**
   * Objetivo PRI total del periodo. Si se pasa `personalId`, devuelve solo el suyo;
   * si no, suma las metas de todas las personas del periodo.
   */
  function objetivoPeriodo(periodo, personalId = null) {
    if (personalId) return objetivoDe(personalId, periodo)
    return forPeriodo(periodo).reduce((acc, m) => acc + (Number(m.objetivoMonto) || 0), 0)
  }

  function exists(personalId, periodo) {
    return items.value.some((m) => m.personalId === personalId && m.periodo === periodo)
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

  async function remove(id) {
    await repo.remove(id)
    items.value = items.value.filter((x) => x.id !== id)
  }

  return {
    items, loaded, load, byId, forPeriodo, objetivoDe, objetivoPeriodo, exists,
    create, update, remove,
  }
})
