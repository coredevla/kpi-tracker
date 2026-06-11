import { useToastStore } from '@/stores/toast'
import { friendlyError } from '@/utils/errors'

/**
 * Envuelve una operación asíncrona (normalmente contra el repositorio/Supabase)
 * y muestra un toast claro en caso de error, devolviendo { ok }.
 *
 * Uso:
 *   const run = useAsyncAction()
 *   const { ok } = await run(() => store.create(payload), { success: 'Creado' })
 *   if (ok) modalOpen.value = false
 */
export function useAsyncAction() {
  const toast = useToastStore()
  return async function run(fn, { success, error } = {}) {
    try {
      const result = await fn()
      if (success) toast.success(success)
      return { ok: true, result }
    } catch (e) {
      console.error(e)
      toast.error(error || friendlyError(e))
      return { ok: false, error: e }
    }
  }
}
