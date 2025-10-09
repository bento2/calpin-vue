import { defineStore } from 'pinia'
import { type Session, SessionSchema } from '@/types/SessionSchema.ts'
import type { Training } from '@/types/TrainingSchema.ts'
import SessionService from '@/services/SessionService.ts'
import { StorageService } from '@/services/StorageService.ts'
import type { StorageConfig } from '@/Storages/StorageAdapter.ts'
import { z } from 'zod'
import { getErrorMessage } from '@/composables/Functions.ts'

const storageName = 'sessions'
export const useSessionStore = defineStore(storageName, {
  state: () => ({
    sessions: [] as Session[],
    loaded: false,
    loading: false,
    error: null as string | null,
    // Service de stockage configurable
    storage: new StorageService<Session[]>(storageName, {
      adapter: 'firebase', // Facile à changer ici
    }),
    lastSync: null as Date | null,
  }),

  getters: {
    sessionsSortedByDate: (state) =>
      [...state.sessions].sort(
        (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
      ),

    activeSessions: (state) => state.sessions.filter((session) => session.status === 'en_cours'),

    sessionsCount: (state) => state.sessions.length,
  },

  actions: {
    // Changer le mode de stockage
    switchStorageMode(config: StorageConfig) {
      this.storage.switchAdapter(config)
      // Recharger avec le nouveau stockage
      this.loaded = false
      return this.ensureLoaded()
    },

    async ensureLoaded() {
      if (!this.loaded && !this.loading) {
        await this.loadSessions()
      }
    },

    async createSession(training: Training, options?: { name?: string }) {
      try {
        await this.ensureLoaded()

        const session = SessionService.createFromTraining(training, options)
        const validatedSession = SessionSchema.parse(session)

        this.sessions.push(validatedSession)
        await this.persistSessions()

        return validatedSession
      } catch (error) {
        this.error = `Erreur lors de la création: ${getErrorMessage(error)}`
        throw error
      }
    },

    async getSessionActive(): Promise<Session | undefined> {
      await this.ensureLoaded()
      return this.sessions.find((session: Session) => session.status === 'en_cours')
    },

    async getSessionById(id: string): Promise<Session | undefined> {
      await this.ensureLoaded()
      return this.sessions.find((session: Session) => session.id === id)
    },

    async getSessions(): Promise<Session[]> {
      await this.ensureLoaded()
      return this.sessions
    },

    async updateSession(updatedSession: Session) {
      try {
        await this.ensureLoaded()

        const index = this.sessions.findIndex((s) => s.id === updatedSession.id)
        if (index === -1) {
          throw new Error(`Session ${updatedSession.id} non trouvée`)
        }

        const validatedSession = SessionSchema.parse(updatedSession)
        this.sessions[index] = validatedSession
        await this.persistSessions()

        return validatedSession
      } catch (error) {
        this.error = `Erreur lors de la mise à jour: ${getErrorMessage(error)}`
        throw error
      }
    },

    async restartSession(session: Session) {
      try {
        //remise à zéro des informations
        session.dateDebut = new Date()
        session.exercices.map((exercice) => {
          exercice.series?.map((serie) => {
            serie.poids = 0
            serie.checked = false
            serie.repetitions = 0
          })
        })
        this.updateSession(session)
      } catch (error) {
        this.error = `Erreur lors du restart: ${getErrorMessage(error)}`
        throw error
      }
    },

    async deleteSession(id: string) {
      try {
        await this.ensureLoaded()

        const index = this.sessions.findIndex((s) => s.id === id)
        if (index === -1) {
          throw new Error(`Session ${id} non trouvée`)
        }

        this.sessions.splice(index, 1)
        await this.persistSessions()
      } catch (error) {
        this.error = `Erreur lors de la suppression: ${getErrorMessage(error)}`
        throw error
      }
    },

    async finishSession(id: string) {
      const session = await this.getSessionById(id)
      if (!session) {
        throw new Error(`Session ${id} non trouvée`)
      }

      const updatedSession = {
        ...session,
        dateFin: new Date(),
        status: 'terminee' as const,
      }

      return await this.updateSession(updatedSession)
    },

    async loadSessions() {
      if (this.loading) return

      this.loading = true
      this.error = null

      try {
        const data = await this.storage.load()

        if (data) {
          this.sessions = z.array(SessionSchema).parse(data)
        } else {
          this.sessions = []
        }

        this.loaded = true
        this.storage.enableRealtimeSync((data) => {
          if (data) {
            console.log('🔄 Préférences synchronisées depuis un autre appareil')
            this.sessions = data
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
        console.error('Erreur lors du chargement des sessions:', error)
        this.sessions = []
        this.loaded = true
      } finally {
        this.loading = false
      }
    },

    async persistSessions() {
      try {
        await this.storage.save(this.sessions)
      } catch (error) {
        this.error = `Erreur lors de la sauvegarde: ${getErrorMessage(error)}`
        throw error
      }
    },

    async clearAllSessions() {
      this.sessions = []
      await this.storage.delete()
      this.error = null
    },

    clearError() {
      this.error = null
    },
  },
})
