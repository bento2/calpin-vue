import { defineStore } from 'pinia'
import { type Training, TrainingSchema } from '@/types/TrainingSchema.ts'
import { StorageService } from '@/services/StorageService.ts'
import { z } from 'zod'

import { getErrorMessage } from '@/services/Functions.ts'
import { v4 as uuidv4 } from 'uuid'

const storageName = 'trainings'
export const useTrainingStore = defineStore(storageName, {
  state: () => ({
    trainings: [] as Training[],
    loaded: false,
    loading: false,
    error: null as string | null,
    // Service de stockage configurable
    storage: new StorageService<Training[]>(storageName, {
      adapter: 'firebase',
    }),
    lastSync: null as Date | null,
  }),

  getters: {
    trainingsSortedByDate: (state) =>
      [...state.trainings].sort((a, b) => b.ctime.getTime() - a.ctime.getTime()),
    trainingsCount: (state) => state.trainings.length,
  },

  actions: {
    async ensureLoaded() {
      if (!this.loaded && !this.loading) {
        await this.loadTrainings()
      }
    },

    async createTraining() {
      await this.ensureLoaded()
      const training = TrainingSchema.parse({
        id: uuidv4().toLowerCase(),
        name: 'Entrainement ' + (this.trainings.length + 1).toString(),
        exercices: [],
        ctime: new Date(),
        mtime: new Date(),
      })

      return this.saveTraining(training)
    },
    async saveTraining(training: Training) {
      try {
        await this.ensureLoaded()
        training.mtime = new Date()
        const index = this.trainings.findIndex((e) => training.id === e.id)
        if (index > -1) {
          this.trainings[index] = training
        } else {
          this.trainings.push(training)
        }
        await this.persistTrainings()
        return training
      } catch (error) {
        this.error = `Erreur lors de la sauvegarde: ${getErrorMessage(error)}`
        throw error
      }
    },
    async getTrainingById(id: string) {
      await this.ensureLoaded()
      return this.trainings.find((training: Training) => training.id === id)
    },

    async deleteTrainingById(id: string) {
      try {
        await this.ensureLoaded()
        const index = this.trainings.findIndex((training: Training) => training.id === id)
        this.trainings.splice(index, 1)
        await this.persistTrainings()
      } catch (error) {
        this.error = `Erreur lors de la suppression: ${getErrorMessage(error)}`
        throw error
      }
    },
    async getTrainings() {
      await this.ensureLoaded()
      return (this.trainings ?? []).sort((a, b) => b.ctime.getTime() - a.ctime.getTime())
    },
    async loadTrainings() {
      if (this.loading) return

      this.loading = true
      this.error = null
      this.trainings = []
      try {
        const data = await this.storage.load()
        if (data) {
          this.trainings = z.array(TrainingSchema).parse(data)
        }
        this.loaded = true


        this.storage.enableRealtimeSync((data) => {
          if (data) {
            console.log('🔄 Préférences synchronisées depuis un autre appareil')
            this.trainings = data
            this.lastSync = new Date()
            // Émettre un événement pour notifier l'UI
            window.dispatchEvent(
              new CustomEvent('preferences:synced', {
                detail: data,
              }),
            )
          }
        })
      } catch (error) {
        this.error = `Erreur lors du chargement: ${getErrorMessage(error)}`
        console.error('Erreur lors du chargement des trainings:', error)

        this.loaded = true
      } finally {
        this.loading = false
      }
    },

    async persistTrainings() {
      try {
        await this.storage.save(this.trainings)
      } catch (error) {
        this.error = `Erreur lors de la sauvegarde: ${getErrorMessage(error)}`
        throw error
      }
    },

    async clearAllSessions() {
      this.trainings = []
      await this.storage.delete()
      this.error = null
    },

    clearError() {
      this.error = null
    },
  },
})
