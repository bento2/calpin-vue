import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { setupSync } from '@/plugins/syncPlugin'
import { StorageService } from '@/services/StorageService'

// Mock StorageService
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

  it('initializes storage service', () => {
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

  it('subscribes to actions', () => {
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

  it('triggers save on push action', async () => {
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
    // Iterate backwards or find the one that has save called?
    // Since we just ran one test in this block (hopefully), let's check correct instance
    // But calls accumulate if not cleared properly? beforeEach clears mocks history.

    // We need to find the instance that was created in THIS test
    // access to calls of constructor
    // But simpler: just check if ANY instance had save called
    const instances = MockStorageService.mock.results.map((r) => r.value)
    const calledInstance = instances.find((i) => i.save.mock.calls.length > 0)

    expect(calledInstance).toBeDefined()
  })
})
