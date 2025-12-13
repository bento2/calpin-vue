import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia } from 'pinia'
import { useTrainingStore } from '@/stores/useTrainingStore'
import { syncPlugin } from '@/plugins/syncPlugin'
import type { Training } from '@/types/TrainingSchema'
import { createTestingPinia } from '@pinia/testing'
import { flushPromises } from '@vue/test-utils'

// Mock du StorageService
const mockSave = vi.fn()
const mockLoad = vi.fn()

vi.mock('@/services/StorageService', () => {
  return {
    StorageService: vi.fn(function () {
      return {
        save: mockSave,
        load: mockLoad,
        exists: vi.fn().mockResolvedValue(false),
        delete: vi.fn().mockResolvedValue(undefined),
        enableRealtimeSync: vi.fn(),
        switchAdapter: vi.fn(),
      }
    }),
  }
})

describe('useTrainingStore', () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({
        stubActions: false,
        plugins: [syncPlugin],
        createSpy: vi.fn,
      }),
    )

    mockSave.mockClear()
    mockSave.mockResolvedValue(undefined) // Reset implementation
    mockLoad.mockClear()
    mockLoad.mockResolvedValue([]) // Stockage vide par défaut
    vi.clearAllMocks()
    localStorage.clear()

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Helper pour créer un entrainement valide
  const createMockTraining = (id: string): Training => ({
    id,
    name: 'Entrainement Test',
    exercices: [],
    ctime: new Date(),
    mtime: new Date(),
  })

  it('createTraining devrait sauvegarder en local et sur firebase', async () => {
    const store = useTrainingStore()
    const training = await store.createTraining()

    expect(training.id).toBeDefined()
    expect(store.trainings).toHaveLength(1)

    // Premier appel (local) immédiat
    expect(mockSave).toHaveBeenCalledTimes(1)

    // Avance le temps pour le debounce du plugin (2000ms)
    vi.advanceTimersByTime(2500)

    // Deuxième appel (firebase) via le plugin
    expect(mockSave).toHaveBeenCalledTimes(2)
  })

  it('saveTraining devrait mettre à jour la date de modification', async () => {
    const store = useTrainingStore()
    const training = await store.createTraining()
    vi.advanceTimersByTime(2500) // Clear initial sync
    mockSave.mockClear()

    const oldDate = new Date('2020-01-01')
    training.mtime = oldDate

    await store.saveTraining(training)

    expect(training.mtime.getTime()).toBeGreaterThan(oldDate.getTime())

    // Local save
    expect(mockSave).toHaveBeenCalledTimes(1)

    // Plugin sync
    vi.advanceTimersByTime(2500)
    expect(mockSave).toHaveBeenCalledTimes(2)
  })

  describe('syncFromCloud', () => {
    it("devrait ajouter un entrainement distant s'il n'existe pas localement", async () => {
      const store = useTrainingStore()

      // Configuration: 1 entrainement local
      await store.createTraining()
      vi.advanceTimersByTime(2500)

      const remoteTraining = createMockTraining('t-remote-1')

      mockLoad.mockResolvedValue([
        { ...store.trainings[0] }, // Existant localement
        remoteTraining, // Nouveau distant
      ])

      // @ts-expect-error - Added by plugin
      await store.syncFromCloud()

      expect(store.trainings).toHaveLength(2)
      expect(store.trainings.find((t) => t.id === 't-remote-1')).toBeDefined()
    })

    it("devrait mettre à jour l'entrainement local si le distant est plus récent", async () => {
      const store = useTrainingStore()
      const training = await store.createTraining()
      vi.advanceTimersByTime(2500)

      const oldDate = new Date('2023-01-01')
      const newDate = new Date('2023-12-31')

      // Force local à être vieux
      training.mtime = oldDate

      const remoteVersion = {
        ...training,
        mtime: newDate,
        name: 'Nom mis à jour', // Changement de nom
      }

      mockLoad.mockResolvedValue([remoteVersion])

      // @ts-expect-error - Added by plugin
      await store.syncFromCloud()

      const updated = store.trainings.find((t) => t.id === training.id)
      expect(updated?.mtime).toEqual(newDate)
      expect(updated?.name).toBe('Nom mis à jour')
    })

    it("devrait garder l'entrainement local si le local est plus récent", async () => {
      const store = useTrainingStore()
      const training = await store.createTraining()
      vi.advanceTimersByTime(2500)

      const oldDate = new Date('2023-01-01')
      const newDate = new Date('2023-12-31')

      // Force local à être récent
      training.mtime = newDate
      const originalName = training.name

      const remoteVersion = {
        ...training,
        mtime: oldDate,
        name: 'Vieux nom',
      }

      mockLoad.mockResolvedValue([remoteVersion])

      // @ts-expect-error - Added by plugin
      await store.syncFromCloud()

      const current = store.trainings.find((t) => t.id === training.id)
      expect(current?.mtime).toEqual(newDate)
      expect(current?.name).toBe(originalName)
    })
  })
  describe('Helpers', () => {
    it('deleteTrainingById devrait supprimer localement et sur firebase', async () => {
      const store = useTrainingStore()
      const training = await store.createTraining()
      vi.advanceTimersByTime(2500)

      mockSave.mockClear()
      await store.deleteTrainingById(training.id)

      // Local save (delete modifies list -> baseStore saves)
      expect(mockSave).toHaveBeenCalledTimes(1)

      // Plugin sync (action intercepted)
      vi.advanceTimersByTime(2500)
      expect(mockSave).toHaveBeenCalledTimes(2) // Local save + Cloud save (uploading with item removed)

      expect(store.trainings.find((t) => t.id === training.id)).toBeUndefined()
    })

    it('getTrainings devrait charger et lancer la synchro', async () => {
      const store = useTrainingStore()
      await store.getTrainings()
      expect(mockLoad).toHaveBeenCalled()

      // The plugin intercepts 'getTrainings' and calls 'syncFromCloud'
      expect(store).toHaveProperty('syncFromCloud')
    })
  })

  describe('Error Handling', () => {
    it('createTraining devrait gérer les erreurs de synchro', async () => {
      const store = useTrainingStore()
      // mockSave used for both local (1st) and firebase (2nd)
      let callCount = 0
      mockSave.mockImplementation(async () => {
        callCount++
        if (callCount === 2) throw new Error('Firebase error')
        return undefined
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await store.createTraining()

      // Advance to trigger plugin sync which should fail
      vi.advanceTimersByTime(2500)
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('syncFromCloud devrait gérer les erreurs', async () => {
      const store = useTrainingStore()
      mockLoad.mockRejectedValue(new Error('Sync error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // @ts-expect-error - Added by plugin
      await store.syncFromCloud()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('deleteTrainingById devrait gérer les erreurs de synchro', async () => {
      const store = useTrainingStore()
      mockSave.mockResolvedValue(undefined)
      const training = await store.createTraining()
      vi.advanceTimersByTime(2500) // sync create

      let callCount = 0
      mockSave.mockImplementation(async () => {
        callCount++
        // 1st call: local save (delete) -> pass
        // 2nd call: plugin sync (save) -> fail
        if (callCount > 1) throw new Error('Sync error')
        return undefined
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await store.deleteTrainingById(training.id)
      vi.advanceTimersByTime(2500)
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Getters', () => {
    it('trainingsSortedByDate should return trainings sorted by creation date descending', async () => {
      const store = useTrainingStore()
      const t1 = await store.createTraining()
      vi.advanceTimersByTime(100)
      const t2 = await store.createTraining()
      vi.advanceTimersByTime(100)
      const t3 = await store.createTraining()

      // Default createTraining sets mtime/ctime to now.
      // We rely on execution order or we can manually force dates if needed,
      // but let's assume performant enough to have different timestamps or define them manually.

      // Manually adjusting to be sure
      t1.ctime = new Date(2020, 0, 1)
      t2.ctime = new Date(2022, 0, 1)
      t3.ctime = new Date(2021, 0, 1)

      expect(store.trainingsSortedByDate).toEqual([t2, t3, t1])
    })

    it('trainingsCount should return the correct number of trainings', async () => {
      const store = useTrainingStore()
      expect(store.trainingsCount).toBe(0)
      await store.createTraining()
      expect(store.trainingsCount).toBe(1)
      await store.createTraining()
      expect(store.trainingsCount).toBe(2)
    })
  })

  describe('Aliased Methods', () => {
    it('getTrainingById should return the correct training', async () => {
      const store = useTrainingStore()
      const training = await store.createTraining()
      const found = await store.getTrainingById(training.id)
      expect(found).toEqual(training)
    })

    it('loadTrainings should call baseStore.loadItems', async () => {
      const store = useTrainingStore()
      await store.loadTrainings()
      expect(mockLoad).toHaveBeenCalled()
    })

    it('persistTrainings should call baseStore.persistItems', async () => {
      const store = useTrainingStore()
      await store.persistTrainings()
      // persistItems calls save on adapter
      // LocalStorage adapter saves the whole list, so it saves []
      expect(mockSave).toHaveBeenCalled()

      await store.createTraining()
      mockSave.mockClear()
      await store.persistTrainings()
      expect(mockSave).toHaveBeenCalled()
    })
  })
})
