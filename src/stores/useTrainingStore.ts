import { defineStore } from 'pinia'
import { type Training, TrainingSchema } from '@/types/TrainingSchema.ts'
import { useBaseStore } from '@/composables/useBaseStore.ts'
import { computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { StorageService } from '@/services/StorageService.ts'

const storageName = 'trainings'

export const useTrainingStore = defineStore(storageName, () => {
  const baseStore = useBaseStore<Training>(
    storageName,
    TrainingSchema,
    'localStorage',
    'firebase_cache_trainings',
  )

  const firebaseStorage = new StorageService<Training[]>('trainings', {
    adapter: 'firebase',
  })

  // Getters
  const trainingsSortedByDate = computed(() =>
    [...baseStore.items.value].sort((a, b) => b.ctime.getTime() - a.ctime.getTime()),
  )
  const trainingsCount = computed(() => baseStore.items.value.length)

  // Actions
  async function syncFromFirebase() {
    try {
      console.log('Début synchronisation Firebase (Trainings)...')
      const remoteTrainings = await firebaseStorage.load()

      if (remoteTrainings) {
        await baseStore.ensureLoaded()
        const localTrainings = baseStore.items.value
        const localMap = new Map(localTrainings.map((t) => [t.id, t]))
        let hasChanges = false

        remoteTrainings.forEach((remoteT: Training) => {
          const localT = localMap.get(remoteT.id)
          if (!localT) {
            // Cas 1: Existe sur Firebase, pas en Local -> On ajoute
            console.log(`[Sync Training] Ajout distant: ${remoteT.id}`)
            localTrainings.push(remoteT)
            hasChanges = true
          } else {
            // Cas 2: Conflit -> On regarde qui est le plus récent
            const remoteDate = new Date(remoteT.mtime).getTime()
            const localDate = new Date(localT.mtime).getTime()

            if (remoteDate > localDate) {
              console.log(
                `[Sync Training] Mise à jour locale (Remote: ${remoteDate} > Local: ${localDate}) pour ${remoteT.id}`,
              )
              const index = localTrainings.findIndex((t) => t.id === remoteT.id)
              if (index !== -1) {
                localTrainings[index] = remoteT
                hasChanges = true
              }
            }
          }
        })

        if (hasChanges) {
          await baseStore.persistItems()
          console.log('[Sync Training] Mises à jour appliquées.')
        }
      }
    } catch (e) {
      console.error('Erreur syncFromFirebase (Trainings)', e)
    }
  }

  async function createTraining() {
    await baseStore.ensureLoaded()
    const training = TrainingSchema.parse({
      id: uuidv4().toLowerCase(),
      name: 'Entrainement ' + (baseStore.items.value.length + 1).toString(),
      exercices: [],
      ctime: new Date(),
      mtime: new Date(),
    })

    await baseStore.saveItem(training)
    try {
      await firebaseStorage.save(baseStore.items.value)
    } catch (e) {
      console.error('Erreur sync Firebase après createTraining:', e)
    }
    return training
  }

  async function saveTraining(training: Training) {
    training.mtime = new Date()
    await baseStore.saveItem(training)
    try {
      await firebaseStorage.save(baseStore.items.value)
    } catch (e) {
      console.error('Erreur sync Firebase après saveTraining:', e)
    }
    return training
  }

  return {
    ...baseStore,
    trainings: baseStore.items, // Alias for compatibility
    trainingsSortedByDate,
    trainingsCount,
    createTraining,
    saveTraining,
    syncFromFirebase,
    getTrainingById: baseStore.getItemById,
    deleteTrainingById: async (id: string) => {
      await baseStore.deleteItem(id)
      try {
        await firebaseStorage.save(baseStore.items.value)
      } catch (e) {
        console.error('Erreur sync Firebase après deleteTraining:', e)
      }
    },
    getTrainings: async () => {
      await baseStore.ensureLoaded()
      syncFromFirebase()
      return trainingsSortedByDate.value
    },
    loadTrainings: baseStore.loadItems,
    persistTrainings: baseStore.persistItems,
    clearAllSessions: baseStore.clearAll,
  }
})
