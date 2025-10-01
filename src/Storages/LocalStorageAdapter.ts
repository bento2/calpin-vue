import type { StorageAdapter } from '@/Storages/StorageAdapter.ts'

export class LocalStorageAdapter<T> implements StorageAdapter<T> {
  async get(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`Erreur localStorage.get(${key}):`, error)
      return null
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      throw new Error(`Erreur localStorage.set(${key}): ${error || 'error'}`)
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    localStorage.clear()
  }

  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null
  }
}
