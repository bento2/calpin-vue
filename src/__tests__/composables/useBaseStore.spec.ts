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

  it('should save item (add new)', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    // Mock load to return empty initially
    vi.spyOn(storageMock, 'load').mockResolvedValue([])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    const newItem: TestItem = { id: '1', name: 'New Item' }
    await store.saveItem(newItem)

    expect(store.items.value).toHaveLength(1)
    expect(store.items.value[0]).toEqual(newItem)
    expect(storageMock.save).toHaveBeenCalledWith([newItem])
  })

  it('should save item (update existing)', async () => {
    const store = useBaseStore('test-storage', TestItemSchema)
    storageMock = store.storage as unknown as Record<string, Mock>

    const initialItem = { id: '1', name: 'Old Name' }
    vi.spyOn(storageMock, 'load').mockResolvedValue([initialItem])
    vi.spyOn(storageMock, 'save').mockResolvedValue(undefined)

    // Load first
    await store.loadItems()

    const updatedItem = { id: '1', name: 'New Name' }
    await store.saveItem(updatedItem)

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
})
