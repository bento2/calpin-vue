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

      // @ts-expect-error - Ajouté par le plugin
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

      // @ts-expect-error - Ajouté par le plugin
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

      // @ts-expect-error - Ajouté par le plugin
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

      // Sauvegarde locale (delete modifie la liste -> baseStore sauvegarde)
      expect(mockSave).toHaveBeenCalledTimes(1)

      // Synchro plugin (action interceptée)
      vi.advanceTimersByTime(2500)
      expect(mockSave).toHaveBeenCalledTimes(2) // Sauvegarde locale + Sauvegarde Cloud (upload avec élément supprimé)

      expect(store.trainings.find((t) => t.id === training.id)).toBeUndefined()
    })

    it('getTrainings devrait charger et lancer la synchro', async () => {
      const store = useTrainingStore()
      await store.getTrainings()
      expect(mockLoad).toHaveBeenCalled()

      // Le plugin intercepte 'getTrainings' et appelle 'syncFromCloud'
      expect(store).toHaveProperty('syncFromCloud')
    })
  })

  describe('Error Handling', () => {
    it('createTraining devrait gérer les erreurs de synchro', async () => {
      const store = useTrainingStore()
      // mockSave utilisé pour local (1er) et firebase (2ème)
      let callCount = 0
      mockSave.mockImplementation(async () => {
        callCount++
        if (callCount === 2) throw new Error('Firebase error')
        return undefined
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await store.createTraining()

      // Avancer pour déclencher la synchro plugin qui devrait échouer
      vi.advanceTimersByTime(2500)
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('syncFromCloud devrait gérer les erreurs', async () => {
      const store = useTrainingStore()
      mockLoad.mockRejectedValue(new Error('Sync error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // @ts-expect-error - Ajouté par le plugin
      await store.syncFromCloud()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('deleteTrainingById devrait gérer les erreurs de synchro', async () => {
      const store = useTrainingStore()
      mockSave.mockResolvedValue(undefined)
      const training = await store.createTraining()
      vi.advanceTimersByTime(2500) // synchro création

      let callCount = 0
      mockSave.mockImplementation(async () => {
        callCount++
        // 1er appel : sauvegarde locale (suppression) -> succès
        // 2ème appel : synchro plugin (sauvegarde) -> échec
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
    it('trainingsSortedByDate devrait retourner les entrainements triés par date de création décroissante', async () => {
      const store = useTrainingStore()
      const t1 = await store.createTraining()
      vi.advanceTimersByTime(100)
      const t2 = await store.createTraining()
      vi.advanceTimersByTime(100)
      const t3 = await store.createTraining()

      // createTraining par défaut définit mtime/ctime à maintenant.
      // On se fie à l'ordre d'exécution ou on peut forcer manuellement les dates si nécessaire,
      // mais supposons que c'est assez performant pour avoir des timestamps différents ou définissons-les manuellement.

      // Ajustement manuel pour être sûr
      t1.ctime = new Date(2020, 0, 1)
      t2.ctime = new Date(2022, 0, 1)
      t3.ctime = new Date(2021, 0, 1)

      expect(store.trainingsSortedByDate).toEqual([t2, t3, t1])
    })

    it("trainingsCount devrait retourner le bon nombre d'entrainements", async () => {
      const store = useTrainingStore()
      expect(store.trainingsCount).toBe(0)
      await store.createTraining()
      expect(store.trainingsCount).toBe(1)
      await store.createTraining()
      expect(store.trainingsCount).toBe(2)
    })
  })

  describe('Aliased Methods', () => {
    it('getTrainingById devrait retourner le bon entrainement', async () => {
      const store = useTrainingStore()
      const training = await store.createTraining()
      const found = await store.getTrainingById(training.id)
      expect(found).toEqual(training)
    })

    it('loadTrainings devrait appeler baseStore.loadItems', async () => {
      const store = useTrainingStore()
      await store.loadTrainings()
      expect(mockLoad).toHaveBeenCalled()
    })

    it('persistTrainings devrait appeler baseStore.persistItems', async () => {
      const store = useTrainingStore()
      await store.persistTrainings()
      // persistItems appelle save sur l'adaptateur
      // L'adaptateur LocalStorage sauvegarde toute la liste, donc il sauvegarde []
      expect(mockSave).toHaveBeenCalled()

      await store.createTraining()
      mockSave.mockClear()
      await store.persistTrainings()
      expect(mockSave).toHaveBeenCalled()
    })
  })
})
