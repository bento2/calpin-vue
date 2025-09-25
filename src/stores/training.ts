import { defineStore } from 'pinia'
import type { Training } from '@/types/TrainingSchema.ts'

export const useTrainingStore = defineStore('training', {
  state: () => ({
    trainings: [] as Training[],
  }),
  actions: {
    saveTraining(training: Training) {
      const index = this.trainings.findIndex((e) => training.id === e.id)

      if (index > -1) {
        this.trainings[index] = training
      } else {
        this.trainings.push(training)
      }

      localStorage.setItem('trainings', JSON.stringify(this.trainings))
    },
    getTrainingById(id: string) {
      return this.trainings.find((training: Training) => training.id === id)
    },
    getTrainings(){
      return this.trainings ?? []
    },
    loadTrainings() {
      const data = localStorage.getItem('trainings')
      console.log(data)
      if (data) {
        this.trainings = JSON.parse(data)
      }
    },
  },
})
