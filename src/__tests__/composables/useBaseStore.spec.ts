import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { useBaseStore } from '@/composables/useBaseStore'
import { z } from 'zod'

// Mock StorageService
// Mock de StorageService
vi.mock('@/services/StorageService', () => {
  const StorageService = vi.fn()
  StorageService.prototype.load = vi.fn()
  StorageService.prototype.save = vi.fn()
  StorageService.prototype.delete = vi.fn()
  StorageService.prototype.exists = vi.fn()
  StorageService.prototype.clear = vi.fn()
  StorageService.prototype.enableRealtimeSync = vi.fn()
  StorageService.prototype.switchAdapter = vi.fn()

  return { StorageService }
})

describe('useBaseStore', () => {
  const TestItemSchema = z.object({
    id: z.string(),
    name: z.string(),
  })
  type TestItem = z.infer<typeof TestItemSchema>

  let storageMock: Record<string, Mock>

  beforeEach(() => {
    vi.clearAllMocks()
    // Récupérer l'instance mockée depuis l'appel du constructeur
    // Puisque nous appelons useBaseStore dans le test, nous devons capturer l'instance créée
  })

  it('devrait initialiser avec un état vide', () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    expect(store.items.value).toEqual([])
    expect(store.loaded.value).toBe(false)
    expect(store.loading.value).toBe(false)
    expect(store.error.value).toBe(null)
  })

  it('devrait charger les éléments avec succès', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock> // Accéder à l'instance mockée exposée par le composable

    const mockData = [{ id: '1', name: 'Item 1' }]
    vi.spyOn(storageMock, 'load').mockResolvedValue(mockData)

    await store.loadItems()

    expect(store.loading.value).toBe(false)
    expect(store.loaded.value).toBe(true)
    expect(store.items.value).toEqual(mockData)
    expect(store.error.value).toBe(null)
    expect(storageMock.load).toHaveBeenCalled()
  })

  it('devrait gérer les erreurs de chargement', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    const error = new Error('Load failed')
    vi.spyOn(storageMock, 'load').mockRejectedValue(error)

    await store.loadItems()

    expect(store.loading.value).toBe(false)
    expect(store.loaded.value).toBe(true) // Il met loaded à true même en cas d'erreur
    expect(store.items.value).toEqual([])
    expect(store.error.value).toContain('Load failed')
  })

  it('devrait créer un élément (ajouter nouveau)', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    // Mocker load pour retourner vide initialement
    vi.spyOn(storageMock, 'load').mockResolvedValue([])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    const newItem: TestItem = { id: '1', name: 'New Item' }
    await store.createItem(newItem)

    expect(store.items.value).toHaveLength(1)
    expect(store.items.value[0]).toEqual(newItem)
    expect(storageMock.save).toHaveBeenCalledWith([newItem])
  })

  it('devrait mettre à jour un élément (mise à jour existante)', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    const initialItem = { id: '1', name: 'Old Name' }
    vi.spyOn(storageMock, 'load').mockResolvedValue([initialItem])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    // Charger d'abord
    await store.loadItems()

    const updatedItem = { id: '1', name: 'New Name' }
    await store.updateItem(updatedItem)

    expect(store.items.value).toHaveLength(1)
    expect(store.items.value[0]).toEqual(updatedItem)
    expect(storageMock.save).toHaveBeenCalledWith([updatedItem])
  })

  it('devrait supprimer un élément', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    const initialItem = { id: '1', name: 'To Delete' }
    vi.spyOn(storageMock, 'load').mockResolvedValue([initialItem])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    await store.loadItems()
    await store.deleteItem('1')

    expect(store.items.value).toHaveLength(0)
    expect(storageMock.save).toHaveBeenCalledWith([])
  })

  it("devrait lancer une erreur lors de la suppression d'un élément inexistant", async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    await expect(store.deleteItem('999')).rejects.toThrow('Item 999 non trouvé')
  })

  it('devrait effacer tous les éléments', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    store.items.value = [{ id: '1', name: 'Item' }]
    vi.spyOn(storageMock, 'delete').mockResolvedValue(undefined)

    await store.clearAll()

    expect(store.items.value).toEqual([])
    expect(storageMock.delete).toHaveBeenCalled()
  })

  it("devrait s'assurer que c'est chargé", async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    // Le premier appel devrait charger
    await store.ensureLoaded()
    expect(storageMock.load).toHaveBeenCalledTimes(1)

    // Le second appel ne devrait pas charger si déjà chargé
    await store.ensureLoaded()
    expect(storageMock.load).toHaveBeenCalledTimes(1)
  })

  it("devrait effacer l'erreur", () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    store.error.value = 'Some error'
    store.clearError()
    expect(store.error.value).toBeNull()
  })

  it('devrait gérer le callback de synchro temps réel', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    await store.loadItems()

    // Vérifier si enableRealtimeSync a été appelé
    expect(storageMock.enableRealtimeSync).toHaveBeenCalled()

    // Récupérer le callback
    const callback = storageMock.enableRealtimeSync.mock.calls[0][0]
    expect(callback).toBeDefined()

    // Invoquer le callback
    const newData = [{ id: '99', name: 'Synced' }]
    callback(newData)

    expect(store.items.value).toEqual(newData)
    expect(store.lastSync.value).toBeDefined()

    // Test null data (coverage check)
    const originalItems = store.items.value
    callback(null)
    expect(store.items.value).toEqual(originalItems) // Should not change
  })

  it('ne devrait pas recharger si déjà en cours de chargement', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockReturnValue(new Promise(() => {})) // Pending promise

    store.loading.value = true
    await store.loadItems()

    expect(storageMock.load).not.toHaveBeenCalled()
  })

  it('devrait gérer les erreurs dans create/update/save', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockResolvedValue([])
    vi.spyOn(storageMock, 'save').mockRejectedValue(new Error('Save failed'))

    // Créer
    await expect(store.createItem({ name: 'New' })).rejects.toThrow('Save failed')
    expect(store.error.value).toContain('Erreur lors de la création')

    // Mettre à jour
    await expect(store.updateItem({ id: '1', name: 'Update' })).rejects.toThrow('Save failed')
    expect(store.error.value).toContain('Erreur lors de la mise à jour')
  })

  it('devrait changer le mode de stockage', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    await store.switchStorageMode({ adapter: 'firebase' })

    expect(storageMock.switchAdapter).toHaveBeenCalledWith({ adapter: 'firebase' })
    // Devrait recharger
    expect(storageMock.load).toHaveBeenCalled()
  })

  it('devrait utiliser la configuration timestamp', async () => {
    const TimestampValidSchema = TestItemSchema.extend({
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
    })

    const store = useBaseStore('test-storage-ts', TimestampValidSchema, 'firebase', {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    })
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockResolvedValue([])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    // La création devrait ajouter des timestamps
    const item = await store.createItem({ name: 'Time' })
    expect(item.createdAt).toBeDefined()
    expect(item.updatedAt).toBeDefined()

    // La mise à jour devrait mettre à jour updatedAt
    const oldUpdate = item.updatedAt
    await new Promise((r) => setTimeout(r, 10)) // Attendre un petit moment

    const updated = await store.updateItem(item)
    expect(updated.updatedAt!.getTime()).toBeGreaterThan(oldUpdate!.getTime())
  })
})
