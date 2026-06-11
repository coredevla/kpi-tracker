import { supabase } from '../supabaseClient'

/**
 * Repositorio sobre Supabase (Postgres + PostgREST).
 *
 * Implementa el MISMO contrato que LocalStorageRepository, de modo que los
 * stores no dependan del origen de datos. Las tablas usan columnas en camelCase
 * (entre comillas en SQL) para mapear 1:1 con los objetos de la app, así que no
 * hace falta transformar nombres de campos.
 */
export class SupabaseRepository {
  constructor(table) {
    this.table = table
  }

  async list() {
    const { data, error } = await supabase.from(this.table).select('*')
    if (error) throw error
    return data ?? []
  }

  async get(id) {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ?? null
  }

  async create(payload) {
    const { data, error } = await supabase.from(this.table).insert(payload).select().single()
    if (error) throw error
    return data
  }

  async update(id, patch) {
    const { data, error } = await supabase.from(this.table).update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  }

  async remove(id) {
    const { error } = await supabase.from(this.table).delete().eq('id', id)
    if (error) throw error
  }

  async softDelete(id) {
    return this.update(id, { activo: false })
  }

  async restore(id) {
    return this.update(id, { activo: true })
  }

  /** Inserta varios registros de una sola vez (seed / import). */
  async bulkInsert(records = []) {
    if (!records.length) return []
    const { data, error } = await supabase.from(this.table).insert(records).select()
    if (error) throw error
    return data ?? []
  }

  /** Reemplaza por completo la colección (import de respaldo). Destructivo. */
  async replaceAll(records = []) {
    const { error: delErr } = await supabase
      .from(this.table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (delErr) throw delErr
    return this.bulkInsert(records)
  }
}
