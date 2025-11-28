import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StorageService } from '@/services/StorageService'
import { LocalStorageAdapter } from '@/Storages/LocalStorageAdapter'
import { FirebaseStorageAdapter } from '@/Storages/FirebaseStorageAdapter'

// Mock Adapters
vi.mock('@/Storages/LocalStorageAdapter')
vi.mock('@/Storages/FirebaseStorageAdapter')

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create with default adapter (localStorage)', () => {
    const service = new StorageService('test-key')
    // @ts-expect-error - accessing private property for test
    expect(service.adapter).toBeInstanceOf(LocalStorageAdapter)
  })

  it('should create with firebase adapter', () => {
    const service = new StorageService('test-key', { adapter: 'firebase' })
    // @ts-expect-error - accessing private property for test
    expect(service.adapter).toBeInstanceOf(FirebaseStorageAdapter)
  })

  it('should delegate load call to adapter', async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    mockAdapter.get = vi.fn().mockResolvedValue('data')

    const result = await service.load()
    expect(result).toBe('data')

    expect(mockAdapter.get).toHaveBeenCalledWith('test-key')
  })

  it('should delegate save call to adapter', async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    await service.save('data')

    expect(mockAdapter.set).toHaveBeenCalledWith('test-key', 'data')
  })

  it('should switch adapter', async () => {
    const service = new StorageService('test-key')
    // @ts-expect-error - accessing private property for test
    expect(service.adapter).toBeInstanceOf(LocalStorageAdapter)

    service.switchAdapter({ adapter: 'firebase' })
    // @ts-expect-error - accessing private property for test
    expect(service.adapter).toBeInstanceOf(FirebaseStorageAdapter)
  })

  it('should enable realtime sync only for firebase', async () => {
    const service = new StorageService('test-key', { adapter: 'localStorage' })
    const result = await service.enableRealtimeSync()
    expect(result).toBeNull()

    service.switchAdapter({ adapter: 'firebase' })
    const mockFirebaseAdapter = vi.mocked(FirebaseStorageAdapter).mock.instances[0]

    mockFirebaseAdapter.setupRealtimeSync = vi.fn().mockResolvedValue(() => {})

    const unsubscribe = await service.enableRealtimeSync()
    expect(unsubscribe).toBeDefined()

    expect(mockFirebaseAdapter.setupRealtimeSync).toHaveBeenCalled()
  })
})
