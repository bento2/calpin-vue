import { defineStore } from 'pinia'
import { type Training, TrainingSchema } from '@/types/TrainingSchema.ts'
import { useBaseStore } from '@/composables/useBaseStore.ts'
import { computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const storageName = 'trainings'

export const useTrainingStore = defineStore(storageName, () => {
  const baseStore = useBaseStore<Training>(
    storageName,
    TrainingSchema,
    'localStorage',
    'firebase_cache_trainings',
  )

  // Getters
  const trainingsSortedByDate = computed(() =>
    [...baseStore.items.value].sort((a, b) => b.ctime.getTime() - a.ctime.getTime()),
  )
  const trainingsCount = computed(() => baseStore.items.value.length)

  // Actions
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
    return training
  }

  async function saveTraining(training: Training) {
    training.mtime = new Date()
    await baseStore.saveItem(training)
    return training
  }

  return {
    ...baseStore,
    trainings: baseStore.items, // Alias for compatibility
    trainingsSortedByDate,
    trainingsCount,
    createTraining,
    saveTraining,
    getTrainingById: baseStore.getItemById,
    deleteTrainingById: async (id: string) => {
      await baseStore.deleteItem(id)
    },
    getTrainings: async () => {
      await baseStore.ensureLoaded()
      return trainingsSortedByDate.value
    },
    loadTrainings: baseStore.loadItems,
    persistTrainings: baseStore.persistItems,
  }
})
