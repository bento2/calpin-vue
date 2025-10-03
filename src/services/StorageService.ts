import { LocalStorageAdapter } from '@/Storages/LocalStorageAdapter.ts'
import type { StorageAdapter, StorageConfig } from '@/Storages/StorageAdapter.ts'
import { FirebaseStorageAdapter } from '@/Storages/FirebaseStorageAdapter.ts'
import type { Unsubscribe } from 'firebase/firestore'

export class StorageService<T> {
  private adapter: StorageAdapter<T>;
  private key: string;
  private realtimeUnsubscribe?: Unsubscribe;

  constructor(key: string, config: StorageConfig = { adapter: 'localStorage' }) {
    this.key = key;
    this.adapter = this.createAdapter(config);
  }

  private createAdapter(config: StorageConfig): StorageAdapter<T> {
    switch (config.adapter) {
      case 'localStorage':
        return new LocalStorageAdapter<T>();

      case 'firebase':
        return new FirebaseStorageAdapter<T>();

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

  // NOUVELLES MÉTHODES POUR FIREBASE

  /**
   * Active la synchronisation temps réel (uniquement pour Firebase)
   * @param callback - Fonction appelée lors d'une mise à jour
   * @returns Fonction pour désactiver la synchro
   */
  enableRealtimeSync(callback?: (data: T | null) => void): Unsubscribe | null {
    if (this.adapter instanceof FirebaseStorageAdapter) {
      this.realtimeUnsubscribe = this.adapter.setupRealtimeSync(this.key, callback);
      return this.realtimeUnsubscribe;
    }
    console.warn('La synchronisation temps réel nécessite FirebaseStorageAdapter');
    return null;
  }

  /**
   * Désactive la synchronisation temps réel
   */
  disableRealtimeSync(): void {
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = undefined;
    }
  }

  /**
   * Écoute les événements de mise à jour (alternatif aux callbacks)
   * Utilise les événements du navigateur
   */
  onUpdate(callback: (data: T) => void): () => void {
    const eventName = `storage:${this.key}:updated`;
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<T>;
      callback(customEvent.detail);
    };

    window.addEventListener(eventName, handler);

    // Retourner la fonction de nettoyage
    return () => window.removeEventListener(eventName, handler);
  }

  /**
   * Écoute les événements de suppression
   */
  onDelete(callback: () => void): () => void {
    const eventName = `storage:${this.key}:deleted`;
    window.addEventListener(eventName, callback);

    return () => window.removeEventListener(eventName, callback);
  }

  /**
   * Vérifie si l'adapter actuel est Firebase
   */
  isFirebaseAdapter(): boolean {
    return this.adapter instanceof FirebaseStorageAdapter;
  }

  /**
   * Nettoie les ressources
   */
  cleanup(): void {
    this.disableRealtimeSync();

    if (this.adapter instanceof FirebaseStorageAdapter) {
      this.adapter.destroy();
    }
  }
}
