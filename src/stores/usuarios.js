import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/data/supabaseClient'
import { supabaseSignup } from '@/data/supabaseSignupClient'
import { ROLES } from '@/data/roles'

/**
 * Gestión de usuarios sobre Supabase Auth + tabla `perfiles`.
 * - Crear: alta en Auth con cliente aislado, luego el admin completa el perfil.
 * - Editar: cambia rol / persona enlazada (no la contraseña ajena).
 * - Activar/desactivar: marca el perfil; el login rechaza inactivos.
 * El borrado duro de la cuenta de Auth requiere service_role (no disponible en el navegador).
 */
export const useUsuariosStore = defineStore('usuarios', () => {
  const items = ref([])
  const loaded = ref(false)

  async function load() {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('createdAt', { ascending: true })
    if (error) throw error
    items.value = data ?? []
    loaded.value = true
  }

  const activos = computed(() => items.value.filter((u) => u.activo))

  function byId(id) {
    return items.value.find((u) => u.id === id) ?? null
  }

  function usadoPorPersona(personalId) {
    return items.value.find((u) => u.personalId === personalId) ?? null
  }

  /** Da de alta una cuenta en Auth y completa su perfil (rol + persona). */
  async function create({ email, password, rol = ROLES.REPRESENTANTE, personalId = null }) {
    const correo = (email || '').trim().toLowerCase()

    // 1) Alta en Auth con cliente aislado (no toca la sesión del admin).
    const { data, error } = await supabaseSignup.auth.signUp({ email: correo, password })
    if (error) throw error
    const id = data.user?.id
    if (!id) throw new Error('No se pudo crear la cuenta. ¿Está activada la confirmación por email?')
    await supabaseSignup.auth.signOut()

    // 2) El admin completa el perfil creado por el trigger.
    const patch = {
      rol,
      personalId: rol === ROLES.ADMIN ? null : personalId,
      username: correo.split('@')[0],
      email: correo,
      activo: true,
    }
    const { data: perfil, error: e2 } = await supabase
      .from('perfiles')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (e2) throw e2

    const rec = perfil ?? { id, ...patch }
    items.value.push(rec)
    return rec
  }

  async function update(id, patch) {
    const { data, error } = await supabase
      .from('perfiles')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw error
    const idx = items.value.findIndex((x) => x.id === id)
    if (idx !== -1 && data) items.value[idx] = data
    return data
  }

  async function softDelete(id) {
    return update(id, { activo: false })
  }
  async function restore(id) {
    return update(id, { activo: true })
  }

  return {
    items, loaded, activos, load, byId, usadoPorPersona,
    create, update, softDelete, restore,
  }
})
