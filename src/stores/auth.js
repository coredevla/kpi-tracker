import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/data/supabaseClient'
import { ROLES } from '@/data/roles'

/**
 * Autenticación con Supabase Auth (email + contraseña).
 * El rol y la persona enlazada viven en la tabla `perfiles` (1:1 con auth.users).
 */
export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const profile = ref(null) // { id, username, rol, personalId }
  let listenerReady = false

  const currentUser = computed(() => profile.value)
  const isAuthenticated = computed(() => !!session.value && !!profile.value)
  const rol = computed(() => profile.value?.rol ?? null)
  const isAdmin = computed(() => rol.value === ROLES.ADMIN)
  const isRepresentante = computed(() => rol.value === ROLES.REPRESENTANTE)

  // null para admin (ve todo); el id de su persona para representante.
  const scopePersonalId = computed(() =>
    isRepresentante.value ? profile.value?.personalId ?? null : null,
  )

  async function loadProfile() {
    if (!session.value) {
      profile.value = null
      return
    }
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', session.value.user.id)
      .maybeSingle()
    if (error) {
      profile.value = null
      return
    }
    profile.value = data ?? null
  }

  /** Restaura la sesión persistida y escucha cambios de autenticación. */
  async function restore() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    await loadProfile()

    if (!listenerReady) {
      listenerReady = true
      supabase.auth.onAuthStateChange((_event, s) => {
        session.value = s
        loadProfile()
      })
    }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: (email || '').trim(),
      password,
    })
    if (error) throw new Error('Correo o contraseña incorrectos.')
    session.value = data.session
    await loadProfile()
    if (!profile.value) {
      await supabase.auth.signOut()
      session.value = null
      throw new Error('Tu cuenta no tiene un perfil asignado. Contacta al administrador.')
    }
    if (profile.value.activo === false) {
      await supabase.auth.signOut()
      session.value = null
      profile.value = null
      throw new Error('Tu cuenta está desactivada. Contacta al administrador.')
    }
    return profile.value
  }

  async function logout() {
    await supabase.auth.signOut()
    session.value = null
    profile.value = null
  }

  /** Cambia la contraseña del usuario autenticado. */
  async function cambiarPassword(_actual, nueva) {
    const { error } = await supabase.auth.updateUser({ password: nueva })
    if (error) throw new Error('No se pudo cambiar la contraseña.')
  }

  return {
    session, profile,
    currentUser, isAuthenticated, rol, isAdmin, isRepresentante, scopePersonalId,
    restore, login, logout, cambiarPassword,
  }
})
