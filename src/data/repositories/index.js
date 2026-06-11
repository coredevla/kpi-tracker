import { LocalStorageRepository } from './LocalStorageRepository'
import { SupabaseRepository } from './SupabaseRepository'

/**
 * Punto único de acceso a los repositorios.
 *
 * El origen de datos se elige con la variable de entorno `VITE_DATA_DRIVER`:
 *   - 'local'    → LocalStorage (por defecto, sin backend)
 *   - 'supabase' → Supabase (Postgres). Ver src/data/supabaseClient.js
 *
 * Ambos repositorios implementan el mismo contrato, así que ningún store ni
 * componente necesita cambiar al alternar el driver.
 */
const DRIVER = import.meta.env.VITE_DATA_DRIVER || 'local'

function makeRepo(collection) {
  switch (DRIVER) {
    case 'supabase':
      return new SupabaseRepository(collection)
    case 'local':
    default:
      return new LocalStorageRepository(collection)
  }
}

export const repositories = {
  personal: makeRepo('personal'),
  servicios: makeRepo('servicios'),
  asignaciones: makeRepo('asignaciones'),
  ventas: makeRepo('ventas'),
  usuarios: makeRepo('usuarios'),
  metasPri: makeRepo('metasPri'),
}

export const COLLECTIONS = Object.keys(repositories)
