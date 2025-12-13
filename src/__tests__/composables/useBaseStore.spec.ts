import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { useBaseStore } from '@/composables/useBaseStore'
import { z } from 'zod'

// Mock StorageService
// Mock StorageService
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
    // Get the mock instance from the constructor call
    // Since we call useBaseStore inside the test, we need to capture the instance created
  })

  it('should initialize with empty state', () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    expect(store.items.value).toEqual([])
    expect(store.loaded.value).toBe(false)
    expect(store.loading.value).toBe(false)
    expect(store.error.value).toBe(null)
  })

  it('should load items successfully', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock> // Access the mocked instance exposed by the composable

    const mockData = [{ id: '1', name: 'Item 1' }]
    vi.spyOn(storageMock, 'load').mockResolvedValue(mockData)

    await store.loadItems()

    expect(store.loading.value).toBe(false)
    expect(store.loaded.value).toBe(true)
    expect(store.items.value).toEqual(mockData)
    expect(store.error.value).toBe(null)
    expect(storageMock.load).toHaveBeenCalled()
  })

  it('should handle load error', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    const error = new Error('Load failed')
    vi.spyOn(storageMock, 'load').mockRejectedValue(error)

    await store.loadItems()

    expect(store.loading.value).toBe(false)
    expect(store.loaded.value).toBe(true) // It sets loaded to true even on error
    expect(store.items.value).toEqual([])
    expect(store.error.value).toContain('Load failed')
  })

  it('should create item (add new)', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    // Mock load to return empty initially
    vi.spyOn(storageMock, 'load').mockResolvedValue([])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    const newItem: TestItem = { id: '1', name: 'New Item' }
    await store.createItem(newItem)

    expect(store.items.value).toHaveLength(1)
    expect(store.items.value[0]).toEqual(newItem)
    expect(storageMock.save).toHaveBeenCalledWith([newItem])
  })

  it('should update item (update existing)', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    const initialItem = { id: '1', name: 'Old Name' }
    vi.spyOn(storageMock, 'load').mockResolvedValue([initialItem])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    // Load first
    await store.loadItems()

    const updatedItem = { id: '1', name: 'New Name' }
    await store.updateItem(updatedItem)

    expect(store.items.value).toHaveLength(1)
    expect(store.items.value[0]).toEqual(updatedItem)
    expect(storageMock.save).toHaveBeenCalledWith([updatedItem])
  })

  it('should delete item', async () => {
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

  it('should throw error when deleting non-existent item', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    await expect(store.deleteItem('999')).rejects.toThrow('Item 999 non trouvé')
  })

  it('should clear all items', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    store.items.value = [{ id: '1', name: 'Item' }]
    vi.spyOn(storageMock, 'delete').mockResolvedValue(undefined)

    await store.clearAll()

    expect(store.items.value).toEqual([])
    expect(storageMock.delete).toHaveBeenCalled()
  })

  it('should ensure loaded', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    // First call should load
    await store.ensureLoaded()
    expect(storageMock.load).toHaveBeenCalledTimes(1)

    // Second call should not load if already loaded
    await store.ensureLoaded()
    expect(storageMock.load).toHaveBeenCalledTimes(1)
  })

  it('should clear error', () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    store.error.value = 'Some error'
    store.clearError()
    expect(store.error.value).toBeNull()
  })

  it('should handle realtime sync callback', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    await store.loadItems()

    // Check if enableRealtimeSync was called
    expect(storageMock.enableRealtimeSync).toHaveBeenCalled()

    // Get the callback
    const callback = storageMock.enableRealtimeSync.mock.calls[0][0]
    expect(callback).toBeDefined()

    // Invoke callback
    const newData = [{ id: '99', name: 'Synced' }]
    callback(newData)

    expect(store.items.value).toEqual(newData)
    expect(store.lastSync.value).toBeDefined()
  })

  it('should handle errors in create/update/save', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockResolvedValue([])
    vi.spyOn(storageMock, 'save').mockRejectedValue(new Error('Save failed'))

    // Create
    await expect(store.createItem({ name: 'New' })).rejects.toThrow('Save failed')
    expect(store.error.value).toContain('Erreur lors de la création')

    // Update
    await expect(store.updateItem({ id: '1', name: 'Update' })).rejects.toThrow('Save failed')
    expect(store.error.value).toContain('Erreur lors de la mise à jour')
  })

  it('should switch storage mode', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>
    vi.spyOn(storageMock, 'load').mockResolvedValue([])

    await store.switchStorageMode({ adapter: 'firebase' })

    expect(storageMock.switchAdapter).toHaveBeenCalledWith({ adapter: 'firebase' })
    // Should reload
    expect(storageMock.load).toHaveBeenCalled()
  })

  it('should use timestamp config', async () => {
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

    // Create should add timestamps
    const item = await store.createItem({ name: 'Time' })
    expect(item.createdAt).toBeDefined()
    expect(item.updatedAt).toBeDefined()

    // Update should update updatedAt
    const oldUpdate = item.updatedAt
    await new Promise((r) => setTimeout(r, 10)) // Wait small time

    const updated = await store.updateItem(item)
    expect(updated.updatedAt!.getTime()).toBeGreaterThan(oldUpdate!.getTime())
  })
})
