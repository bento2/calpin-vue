import { LocalStorageAdapter } from '@/Storages/LocalStorageAdapter.ts'
import type { StorageAdapter, StorageConfig } from '@/Storages/StorageAdapter.ts'

export class StorageService<T> {
  private adapter: StorageAdapter<T>;
  private key: string;

  constructor(key: string, config: StorageConfig = { adapter: 'localStorage' }) {
    this.key = key;
    this.adapter = this.createAdapter(config);
  }

  private createAdapter(config: StorageConfig): StorageAdapter<T> {
    switch (config.adapter) {
      case 'localStorage':
        return new LocalStorageAdapter<T>();

      /**case 'indexedDB':
        return new IndexedDBAdapter<T>(
          config.dbName || 'AppStorage',
          config.version || 1
        );

      case 'memory':
        return new MemoryStorageAdapter<T>();**/

      default:
        throw new Error(`Adapter non supporté: ${config.adapter}`);
    }
  }

  // Méthodes publiques simplifiées
  async load(): Promise<T | null> {
    return await this.adapter.get(this.key);
  }

  async save(data: T): Promise<void> {
    return await this.adapter.set(this.key, data);
  }

  async delete(): Promise<void> {
    return await this.adapter.remove(this.key);
  }

  async exists(): Promise<boolean> {
    return await this.adapter.exists(this.key);
  }

  async clear(): Promise<void> {
    return await this.adapter.clear();
  }

  // Changer d'adapter à la volée
  switchAdapter(config: StorageConfig): void {
    this.adapter = this.createAdapter(config);
  }
}
