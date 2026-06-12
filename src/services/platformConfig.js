import { supabase } from '@/data/supabaseClient'

const EMBEDDED_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.0'
const VERSION_URL = `${import.meta.env.BASE_URL}version.json`

export function getEmbeddedVersion() {
  return EMBEDDED_VERSION
}

/** Configuración global de plataforma (mantenimiento, versión desplegada). */
export async function fetchAppConfig() {
  const { data, error } = await supabase
    .from('app_config')
    .select('maintenance, maintenanceMessage, clientVersion')
    .eq('id', 'default')
    .maybeSingle()

  if (error) throw error

  return (
    data ?? {
      maintenance: false,
      maintenanceMessage: null,
      clientVersion: null,
    }
  )
}

/** Versión publicada en el hosting (version.json generado en build). */
export async function fetchDeployedVersion() {
  const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('No se pudo leer version.json')
  const body = await res.json()
  return body.version
}
