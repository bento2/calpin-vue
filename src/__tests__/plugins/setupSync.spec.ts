import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { setupSync } from '@/plugins/syncPlugin'
import { StorageService } from '@/services/StorageService'

// Mock de StorageService
const mockSave = vi.fn()
const mockLoad = vi.fn().mockResolvedValue([])

vi.mock('@/services/StorageService', () => {
  return {
    StorageService: vi.fn().mockImplementation(function () {
      return {
        save: mockSave,
        load: mockLoad,
      }
    }),
  }
})

describe('setupSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockSave.mockResolvedValue(undefined)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initialise le service de stockage', () => {
    const useStore = defineStore('test', { state: () => ({ items: [] }) })
    const store = useStore()

    setupSync(store, {
      storageName: 'tests',
      actionsToPush: [],
      actionsToPull: [],
      getTimestamp: () => 0,
      sort: () => 0,
    })

    expect(StorageService).toHaveBeenCalledWith('tests', { adapter: 'firebase' })
  })

  it("s'abonne aux actions", () => {
    const useStore = defineStore('test-actions', {
      state: () => ({ items: [] as { id: string }[] }),
      actions: {
        createItem() {
          this.items.push({ id: '1' })
        },
      },
    })
    const store = useStore()
    const spyOnAction = vi.spyOn(store, '$onAction')

    setupSync(store, {
      storageName: 'tests',
      actionsToPush: ['createItem'],
      actionsToPull: [],
      getTimestamp: () => 0,
      sort: () => 0,
    })

    expect(spyOnAction).toHaveBeenCalled()
  })

  it("déclenche la sauvegarde sur l'action push", async () => {
    const useStore = defineStore('test-save', {
      state: () => ({ items: [] as { id: string }[] }),
      actions: {
        createItem() {
          this.items.push({ id: '1' })
        },
      },
    })
    const store = useStore()

    setupSync(store, {
      storageName: 'tests',
      actionsToPush: ['createItem'],
      actionsToPull: [],
      getTimestamp: () => 0,
      sort: () => 0,
    })

    store.createItem()
    vi.advanceTimersByTime(2000)

    expect(mockSave).toHaveBeenCalled()
  })

  it('gère les erreurs de sauvegarde silencieusement (L140-143)', async () => {
    const useStore = defineStore('test-error-save', {
      state: () => ({ items: [] as { id: string }[], error: '' }),
      actions: {
        createItem() {
          this.items.push({ id: '1' })
        },
      },
    })
    const store = useStore()

    setupSync(store, {
      storageName: 'tests',
      actionsToPush: ['createItem'],
      actionsToPull: [],
      getTimestamp: () => 0,
      sort: () => 0,
    })

    mockSave.mockRejectedValueOnce(new Error('Sync Error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    store.createItem()
    vi.advanceTimersByTime(2000)

    // Waiting for the promise in after callback which is not awaited by store action
    // We rely on fake timers to trigger the debounced function, but the async save inside it
    // spins in the event loop.
    await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalled())

    expect(consoleSpy).toHaveBeenCalledWith(
      '[Sync tests] Erreur sauvegarde cloud:',
      expect.any(Error),
    )
    consoleSpy.mockRestore()
  })
})
