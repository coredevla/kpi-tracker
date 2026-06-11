import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Notificaciones (toasts) globales para feedback al usuario.
 * Tipos: 'success' | 'error' | 'info'
 */
export const useToastStore = defineStore('toast', () => {
  const items = ref([])
  let seq = 0

  function push(message, type = 'info', timeout = 4500) {
    const id = ++seq
    items.value.push({ id, message, type })
    if (timeout) setTimeout(() => dismiss(id), timeout)
    return id
  }

  function dismiss(id) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  const success = (m, t) => push(m, 'success', t)
  // Los errores se quedan un poco más para que el usuario alcance a leerlos.
  const error = (m, t) => push(m, 'error', t ?? 7000)
  const info = (m, t) => push(m, 'info', t)

  return { items, push, dismiss, success, error, info }
})
