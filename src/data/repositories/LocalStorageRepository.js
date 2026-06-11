/**
 * Repositorio genérico sobre LocalStorage.
 *
 * Implementa el contrato común que también implementará un futuro
 * SupabaseRepository, de modo que los stores no dependan del origen de datos.
 *
 * Contrato (async para que migrar a una API remota no rompa nada):
 *   list(): Promise<Array<T>>
 *   get(id): Promise<T | null>
 *   create(payload): Promise<T>
 *   update(id, patch): Promise<T>
 *   remove(id): Promise<void>          // borrado físico
 *   softDelete(id): Promise<T>         // marca activo = false
 *   restore(id): Promise<T>            // marca activo = true
 */
export class LocalStorageRepository {
  constructor(collection, { prefix = 'kpi-tracker' } = {}) {
    this.key = `${prefix}:${collection}`
  }

  _read() {
    try {
      const raw = localStorage.getItem(this.key)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  _write(items) {
    localStorage.setItem(this.key, JSON.stringify(items))
  }

  _genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  async list() {
    return this._read()
  }

  async get(id) {
    return this._read().find((x) => x.id === id) ?? null
  }

  async create(payload) {
    const items = this._read()
    const now = new Date().toISOString()
    const record = {
      id: this._genId(),
      activo: true,
      createdAt: now,
      updatedAt: now,
      ...payload,
    }
    items.push(record)
    this._write(items)
    return record
  }

  async update(id, patch) {
    const items = this._read()
    const idx = items.findIndex((x) => x.id === id)
    if (idx === -1) throw new Error(`Registro ${id} no encontrado en ${this.key}`)
    items[idx] = { ...items[idx], ...patch, updatedAt: new Date().toISOString() }
    this._write(items)
    return items[idx]
  }

  async remove(id) {
    this._write(this._read().filter((x) => x.id !== id))
  }

  async softDelete(id) {
    return this.update(id, { activo: false })
  }

  async restore(id) {
    return this.update(id, { activo: true })
  }

  /** Inserta varios registros de una sola vez (usado por el seed / import). */
  async bulkInsert(records = []) {
    const items = this._read()
    const now = new Date().toISOString()
    const created = records.map((payload) => ({
      id: this._genId(),
      activo: true,
      createdAt: now,
      updatedAt: now,
      ...payload,
    }))
    this._write([...items, ...created])
    return created
  }

  /** Reemplaza por completo la colección (usado por import de respaldo). */
  async replaceAll(records = []) {
    this._write(records)
    return records
  }
}
