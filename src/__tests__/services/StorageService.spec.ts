import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StorageService } from '@/services/StorageService'
import { LocalStorageAdapter } from '@/Storages/LocalStorageAdapter'
import { FirebaseStorageAdapter } from '@/Storages/FirebaseStorageAdapter'

// Mock des Adapters
vi.mock('@/Storages/LocalStorageAdapter')
vi.mock('@/Storages/FirebaseStorageAdapter')

describe('StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("devrait créer avec l'adapter par défaut (localStorage)", () => {
    const service = new StorageService('test-key')
    // @ts-expect-error - accès propriété privée pour le test
    expect(service.adapter).toBeInstanceOf(LocalStorageAdapter)
  })

  it("devrait créer avec l'adapter firebase", () => {
    const service = new StorageService('test-key', { adapter: 'firebase' })
    // @ts-expect-error - accès propriété privée pour le test
    expect(service.adapter).toBeInstanceOf(FirebaseStorageAdapter)
  })

  it("devrait déléguer l'appel load à l'adapter", async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    mockAdapter.get = vi.fn().mockResolvedValue('data')

    const result = await service.load()
    expect(result).toBe('data')

    expect(mockAdapter.get).toHaveBeenCalledWith('test-key')
  })

  it("devrait déléguer l'appel save à l'adapter", async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    await service.save('data')

    expect(mockAdapter.set).toHaveBeenCalledWith('test-key', 'data')
  })

  it("devrait déléguer l'appel delete à l'adapter", async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    await service.delete()

    expect(mockAdapter.remove).toHaveBeenCalledWith('test-key')
  })

  it("devrait déléguer l'appel exists à l'adapter", async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    // Simuler que l'item existe
    mockAdapter.exists = vi.fn().mockResolvedValue(true)

    const exists = await service.exists()
    expect(exists).toBe(true)

    // Simuler que l'item n'existe pas
    mockAdapter.exists = vi.fn().mockResolvedValue(false)
    const notExists = await service.exists()
    expect(notExists).toBe(false)
  })

  it('devrait gérer les erreurs de chargement proprement', async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    mockAdapter.get = vi.fn().mockRejectedValue(new Error('Echec chargement'))

    await expect(service.load()).rejects.toThrow('Echec chargement')
  })

  it('devrait gérer les erreurs de sauvegarde proprement', async () => {
    const service = new StorageService('test-key')
    const mockAdapter = vi.mocked(LocalStorageAdapter).mock.instances[0]

    mockAdapter.set = vi.fn().mockRejectedValue(new Error('Echec sauvegarde'))

    await expect(service.save('data')).rejects.toThrow('Echec sauvegarde')
  })

  it("devrait changer d'adapter", async () => {
    const service = new StorageService('test-key')
    // @ts-expect-error - accès propriété privée pour le test
    expect(service.adapter).toBeInstanceOf(LocalStorageAdapter)

    service.switchAdapter({ adapter: 'firebase' })
    // @ts-expect-error - accès propriété privée pour le test
    expect(service.adapter).toBeInstanceOf(FirebaseStorageAdapter)
  })

  it('devrait activer la synch temps réel uniquement pour firebase', async () => {
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

  it('devrait désactiver la synch temps réel', async () => {
    const service = new StorageService('test-key', { adapter: 'firebase' })
    const mockFirebaseAdapter = vi.mocked(FirebaseStorageAdapter).mock.instances[0]

    // Simuler un unsubscribe
    const mockUnsubscribe = vi.fn()
    mockFirebaseAdapter.setupRealtimeSync = vi.fn().mockResolvedValue(mockUnsubscribe)

    await service.enableRealtimeSync()
    service.disableRealtimeSync()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it("devrait vérifier si l'adapter est firebase", () => {
    const serviceLocal = new StorageService('test-key', { adapter: 'localStorage' })
    expect(serviceLocal.isFirebaseAdapter()).toBe(false)

    const serviceFirebase = new StorageService('test-key', { adapter: 'firebase' })
    expect(serviceFirebase.isFirebaseAdapter()).toBe(true)
  })

  it('devrait nettoyer les ressources', () => {
    const service = new StorageService('test-key', { adapter: 'firebase' })
    const mockFirebaseAdapter = vi.mocked(FirebaseStorageAdapter).mock.instances[0]
    mockFirebaseAdapter.destroy = vi.fn()

    service.cleanup()

    expect(mockFirebaseAdapter.destroy).toHaveBeenCalled()
  })

  it('devrait écouter les événements de mise à jour', () => {
    const service = new StorageService('test-key')
    const callback = vi.fn()
    const cleanup = service.onUpdate(callback)

    // Simuler l'événement
    const event = new CustomEvent(`storage:test-key:updated`, { detail: 'test-data' })
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalledWith('test-data')

    cleanup()
  })

  it('devrait écouter les événements de suppression', () => {
    const service = new StorageService('test-key')
    const callback = vi.fn()
    const cleanup = service.onDelete(callback)

    // Simuler l'événement
    const event = new Event(`storage:test-key:deleted`)
    window.dispatchEvent(event)

    expect(callback).toHaveBeenCalled()

    cleanup()
  })
})
