import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repositories } from '@/data/repositories'
import { TIPO_GESTION } from '@/data/gestion'

/**
 * Venta / registro de bitácora.
 * {
 *   id, personalId, servicioId, fecha (YYYY-MM-DD),
 *   cantidad, monto, tipoGestion, cliente, numeracion, detalle
 * }
 * `monto` (RD$, >= 0) alimenta el KPI transversal PRI; `tipoGestion` distingue
 * venta/reclamación (ambas suman al PRI).
 */
export const useVentasStore = defineStore('ventas', () => {
  const repo = repositories.ventas
  const items = ref([])
  const loaded = ref(false)

  async function load() {
    items.value = await repo.list()
    loaded.value = true
  }

  function periodoDe(venta) {
    return (venta.fecha || '').slice(0, 7)
  }

  function filter({ personalId, servicioId, periodo, fecha, tipoGestion } = {}) {
    return items.value.filter((v) => {
      if (personalId && v.personalId !== personalId) return false
      if (servicioId && v.servicioId !== servicioId) return false
      if (periodo && periodoDe(v) !== periodo) return false
      if (fecha && v.fecha !== fecha) return false
      if (tipoGestion && (v.tipoGestion || 'venta') !== tipoGestion) return false
      return true
    })
  }

  function totalCantidad(criteria) {
    return filter(criteria).reduce((acc, v) => acc + (Number(v.cantidad) || 0), 0)
  }

  // Suma de dinero (base del KPI transversal PRI).
  function totalMonto(criteria) {
    return filter(criteria).reduce((acc, v) => acc + (Number(v.monto) || 0), 0)
  }

  async function create(payload) {
    const rec = await repo.create({
      cantidad: 1,
      monto: 0,
      tipoGestion: TIPO_GESTION.VENTA,
      ...payload,
    })
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

  return { items, loaded, load, periodoDe, filter, totalCantidad, totalMonto, create, update, remove }
})
