import { createClient } from '@supabase/supabase-js'

// El frontend usa la PUBLISHABLE key (sb_publishable_...), segura para el
// navegador siempre que las tablas tengan Row Level Security activado.
// NUNCA uses aquí la secret key (sb_secret_...).
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // Aviso temprano si faltan variables (solo aplica con VITE_DATA_DRIVER=supabase).
  console.warn('[supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
}

export const supabase = createClient(url, key)
