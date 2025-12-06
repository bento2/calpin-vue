import { defineStore } from 'pinia'
import { type Training, TrainingSchema } from '@/types/TrainingSchema.ts'
import { useBaseStore } from '@/composables/useBaseStore.ts'
import { computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const storageName = 'trainings'

export const useTrainingStore = defineStore(storageName, () => {
  const baseStore = useBaseStore<Training>(storageName, TrainingSchema, 'localStorage')

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

    return baseStore.saveItem(training)
  }

  async function saveTraining(training: Training) {
    training.mtime = new Date()
    return baseStore.saveItem(training)
  }

  return {
    ...baseStore,
    trainings: baseStore.items, // Alias for compatibility
    trainingsSortedByDate,
    trainingsCount,
    createTraining,
    saveTraining,
    getTrainingById: baseStore.getItemById,
    deleteTrainingById: baseStore.deleteItem,
    getTrainings: async () => {
      await baseStore.ensureLoaded()
      return trainingsSortedByDate.value
    },
    loadTrainings: baseStore.loadItems,
    persistTrainings: baseStore.persistItems,
    clearAllSessions: baseStore.clearAll, // The original name was clearAllSessions in TrainingStore? Yes.
  }
})
