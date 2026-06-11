import { createClient } from '@supabase/supabase-js'

// Cliente AISLADO usado solo para registrar nuevas cuentas (signUp) desde la
// vista de Usuarios. Al no persistir ni refrescar sesión, el alta de un usuario
// NO desloguea al administrador que la está creando.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseSignup = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storageKey: 'kpi-tracker:signup',
  },
})
