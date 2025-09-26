export interface StorageAdapter<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}



export type StorageConfig = {
  adapter: 'localStorage' | 'indexedDB' | 'memory';
  dbName?: string;
  version?: number;
};
