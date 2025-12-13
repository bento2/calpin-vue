import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { setupSync } from '@/plugins/syncPlugin'
import { StorageService } from '@/services/StorageService'

// Mock de StorageService
vi.mock('@/services/StorageService', () => {
  return {
    StorageService: vi.fn().mockImplementation(function () {
      return {
        save: vi.fn(),
        load: vi.fn().mockResolvedValue([]),
      }
    }),
  }
})

describe('setupSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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

    const MockStorageService = StorageService as unknown as {
      mock: {
        results: { value: { save: { mock: { calls: unknown[][] } } } }[]
      }
    }
    // Itérer en arrière ou trouver celui qui a save appelé ?
    // Puisque nous venons de lancer un test dans ce bloc (espérons-le), vérifions la bonne instance
    // Mais les appels s'accumulent s'ils ne sont pas effacés correctement ? beforeEach efface l'historique des mocks.

    // Nous devons trouver l'instance créée dans CE test
    // accès aux appels du constructeur
    // Mais plus simple : vérifier si UNE instance a eu save appelé
    const instances = MockStorageService.mock.results.map((r) => r.value)
    const calledInstance = instances.find((i) => i.save.mock.calls.length > 0)

    expect(calledInstance).toBeDefined()
  })
})
