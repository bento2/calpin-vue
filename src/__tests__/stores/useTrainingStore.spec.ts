import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore } from '@/stores/useTrainingStore'
import type { Training } from '@/types/TrainingSchema'

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
    setActivePinia(createPinia())
    mockSave.mockClear()
    mockLoad.mockClear()
    mockLoad.mockResolvedValue([]) // Stockage vide par défaut
    vi.clearAllMocks()
    localStorage.clear()
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
    // Vérifie que save est appelé pour le local et firebase
    expect(mockSave).toHaveBeenCalledTimes(2)
  })

  it('saveTraining devrait mettre à jour la date de modification', async () => {
    const store = useTrainingStore()
    const training = await store.createTraining()
    const oldDate = new Date('2020-01-01')
    training.mtime = oldDate

    mockSave.mockClear()

    await store.saveTraining(training)

    expect(training.mtime.getTime()).toBeGreaterThan(oldDate.getTime())
    expect(mockSave).toHaveBeenCalledTimes(2)
  })

  describe('syncFromFirebase', () => {
    it("devrait ajouter un entrainement distant s'il n'existe pas localement", async () => {
      const store = useTrainingStore()

      // Configuration: 1 entrainement local
      await store.createTraining()

      const remoteTraining = createMockTraining('t-remote-1')

      mockLoad.mockResolvedValue([
        { ...store.trainings[0] }, // Existant localement
        remoteTraining, // Nouveau distant
      ])

      await store.syncFromFirebase()

      expect(store.trainings).toHaveLength(2)
      expect(store.trainings.find((t) => t.id === 't-remote-1')).toBeDefined()
    })

    it("devrait mettre à jour l'entrainement local si le distant est plus récent", async () => {
      const store = useTrainingStore()
      const training = await store.createTraining()

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

      await store.syncFromFirebase()

      const updated = store.trainings.find((t) => t.id === training.id)
      expect(updated?.mtime).toEqual(newDate)
      expect(updated?.name).toBe('Nom mis à jour')
    })

    it("devrait garder l'entrainement local si le local est plus récent", async () => {
      const store = useTrainingStore()
      const training = await store.createTraining()

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

      await store.syncFromFirebase()

      const current = store.trainings.find((t) => t.id === training.id)
      expect(current?.mtime).toEqual(newDate)
      expect(current?.name).toBe(originalName)
    })
  })
})
