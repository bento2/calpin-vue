import { ref, type Ref } from 'vue'
import { StorageService } from '@/services/StorageService.ts'
import { getErrorMessage } from '@/composables/getErrorMessage.ts'
import type { StorageConfig } from '@/Storages/StorageAdapter.ts'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

interface Identifiable {
  id: string
}

type TimestampConfig<T> = {
  createdAt?: keyof T
  updatedAt?: keyof T
}

export function useBaseStore<T extends Identifiable>(
  storageName: string,
  itemSchema: z.ZodType<T>,
  defaultAdapter: StorageConfig['adapter'] = 'firebase',
  timestampConfig?: TimestampConfig<T>,
) {
  // State
  const items: Ref<T[]> = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const error: Ref<string | null> = ref(null)
  const lastSync: Ref<Date | null> = ref(null)

  const storage = new StorageService<T[]>(storageName, {
    adapter: defaultAdapter,
  })

  // Actions
  function clearError() {
    error.value = null
  }

  async function loadItems() {
    if (loading.value) return

    loading.value = true
    error.value = null
    items.value = []

    try {
      const data = await storage.load()
      if (data) {
        items.value = z.array(itemSchema).parse(data)
      }
      loaded.value = true

      storage.enableRealtimeSync((data) => {
        if (data) {
          console.log('🔄 Préférences synchronisées depuis un autre appareil')
          items.value = data
          lastSync.value = new Date()
          window.dispatchEvent(
            new CustomEvent('preferences:synced', {
              detail: data,
            }),
          )
        }
      })
    } catch (err) {
      error.value = `Erreur lors du chargement: ${getErrorMessage(err)}`
      console.error(`Erreur lors du chargement des ${storageName}:`, err)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded() {
    if (!loaded.value && !loading.value) {
      await loadItems()
    }
  }

  async function persistItems() {
    try {
      await storage.save(items.value)
    } catch (err) {
      error.value = `Erreur lors de la sauvegarde: ${getErrorMessage(err)}`
      throw err
    }
  }

  async function saveItem(item: T) {
    try {
      await ensureLoaded()
      const index = items.value.findIndex((e) => e.id === item.id)
      if (index > -1) {
        items.value[index] = item
      } else {
        items.value.push(item)
      }
      await persistItems()
      return item
    } catch (err) {
      error.value = `Erreur lors de la sauvegarde: ${getErrorMessage(err)}`
      throw err
    }
  }

  async function createItem(partialItem: Partial<T>): Promise<T> {
    try {
      await ensureLoaded()

      const id = partialItem.id || uuidv4()
      const now = new Date()

      // Construction de l'objet avec timestamps
      const itemData = { ...partialItem, id } as Record<string, unknown>

      if (timestampConfig?.createdAt) {
        itemData[timestampConfig.createdAt as string] = now
      }
      if (timestampConfig?.updatedAt) {
        itemData[timestampConfig.updatedAt as string] = now
      }

      // Validation via Zod
      // On utilise parse pour garantir que partialItem + timestamps correspondent au schema complet T
      const validatedItem = itemSchema.parse(itemData)

      // Sauvegarde
      return await saveItem(validatedItem)
    } catch (err) {
      error.value = `Erreur lors de la création: ${getErrorMessage(err)}`
      throw err
    }
  }

  async function updateItem(item: T): Promise<T> {
    try {
      await ensureLoaded()

      if (timestampConfig?.updatedAt) {
        // Mise à jour du timestamp
        ;(item as unknown as Record<string, unknown>)[timestampConfig.updatedAt as string] =
          new Date()
      }

      // Re-validation pour sûreté
      const validatedItem = itemSchema.parse(item)

      return await saveItem(validatedItem)
    } catch (err) {
      error.value = `Erreur lors de la mise à jour: ${getErrorMessage(err)}`
      throw err
    }
  }

  async function deleteItem(id: string) {
    try {
      await ensureLoaded()
      const index = items.value.findIndex((e) => e.id === id)
      if (index > -1) {
        items.value.splice(index, 1)
        await persistItems()
      } else {
        throw new Error(`Item ${id} non trouvé`)
      }
    } catch (err) {
      error.value = `Erreur lors de la suppression: ${getErrorMessage(err)}`
      throw err
    }
  }

  async function clearAll() {
    items.value = []
    await storage.delete()
    error.value = null
  }

  function switchStorageMode(config: StorageConfig) {
    storage.switchAdapter(config)
    loaded.value = false
    return ensureLoaded()
  }

  async function getItemById(id: string) {
    await ensureLoaded()
    return items.value.find((i) => i.id === id)
  }

  return {
    items,
    loaded,
    loading,
    error,
    lastSync,
    storage,
    clearError,
    loadItems,
    ensureLoaded,
    persistItems,
    // saveItem, // Removed as internal
    createItem,
    updateItem,
    deleteItem,
    clearAll,
    switchStorageMode,
    getItemById,
  }
}
