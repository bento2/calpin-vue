import { defineStore } from 'pinia'
import { type Session, SessionSchema } from '@/types/SessionSchema.ts'
import type { Training } from '@/types/TrainingSchema.ts'
import SessionService from '@/services/SessionService.ts'
import { useBaseStore } from '@/composables/useBaseStore.ts'
import type { Serie } from '@/types/SerieSchema.ts'
import { computed } from 'vue'
import { getErrorMessage } from '@/composables/Functions.ts'

const storageName = 'sessions'

export const useSessionStore = defineStore(storageName, () => {
  const baseStore = useBaseStore<Session>(storageName, SessionSchema)

  // Getters
  const sessionsSortedByDate = computed(() =>
    [...baseStore.items.value].sort(
      (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
    ),
  )
  const activeSessions = computed(() =>
    baseStore.items.value.filter((session) => session.status === 'en_cours'),
  )
  const sessionsCount = computed(() => baseStore.items.value.length)

  // Actions
  async function findStatsExercices() {
    try {
      await baseStore.ensureLoaded()
      const stats = new Map<string, Serie>()
      baseStore.items.value.forEach((session) => {
        session.exercices.forEach((exercice) => {
          if (exercice.series && exercice.max) {
            if (stats.has(exercice.id)) {
              const last = stats.get(exercice.id)
              if (last && last.total < exercice.max.total) {
                stats.set(exercice.id, exercice.max)
              }
            } else {
              stats.set(exercice.id, exercice.max)
            }
          }
        })
      })
      return stats
    } catch (error) {
      baseStore.error.value = `Erreur lors de la recherche de stats: ${getErrorMessage(error)}`
      throw error
    }
  }

  async function createSession(training: Training, options?: { name?: string }) {
    try {
      await baseStore.ensureLoaded()

      const session = SessionService.createFromTraining(training, options)
      const validatedSession = SessionSchema.parse(session)

      // We use baseStore.items.push directly in the original, but here we should use saveItem or similar?
      // Original: this.sessions.push(validatedSession); await this.persistSessions()
      // baseStore.saveItem handles push or update.
      return baseStore.saveItem(validatedSession)
    } catch (error) {
      baseStore.error.value = `Erreur lors de la création: ${getErrorMessage(error)}`
      throw error
    }
  }

  async function updateSession(updatedSession: Session) {
      // Original checked if index exists. baseStore.saveItem checks if it exists (update) or not (push).
      // But original threw error if not found.
      // "Session ${updatedSession.id} non trouvée"
      // baseStore.saveItem will just push it if not found.
      // We should enforce existence if that's the desired behavior.
      try {
          await baseStore.ensureLoaded()
          const index = baseStore.items.value.findIndex((s) => s.id === updatedSession.id)
          if (index === -1) {
              throw new Error(`Session ${updatedSession.id} non trouvée`)
          }
          // Validate
          const validatedSession = SessionSchema.parse(updatedSession)
          return baseStore.saveItem(validatedSession)
      } catch (error) {
          baseStore.error.value = `Erreur lors de la mise à jour: ${getErrorMessage(error)}`
          throw error
      }
  }

  async function restartSession(session: Session) {
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
        return updateSession(session)
      } catch (error) {
        baseStore.error.value = `Erreur lors du restart: ${getErrorMessage(error)}`
        throw error
      }
  }

  async function finishSession(id: string) {
      const session = await baseStore.getItemById(id)
      if (!session) {
        throw new Error(`Session ${id} non trouvée`)
      }

      const updatedSession = {
        ...session,
        dateFin: new Date(),
        status: 'terminee' as const,
      }

      return await updateSession(updatedSession)
  }

  return {
    ...baseStore,
    sessions: baseStore.items, // Alias
    sessionsSortedByDate,
    activeSessions,
    sessionsCount,
    findStatsExercices,
    createSession,
    updateSession,
    restartSession,
    finishSession,
    getSessionActive: async () => {
        await baseStore.ensureLoaded()
        return activeSessions.value[0] // Original logic: find first 'en_cours'. activeSessions is filtered.
        // Original: return this.sessions.find((session: Session) => session.status === 'en_cours')
        // activeSessions returns all active sessions.
        // So activeSessions.value[0] is correct if we assume one active session, or we can use find on items.
        // Let's stick to original logic to be safe.
        // return baseStore.items.value.find((session: Session) => session.status === 'en_cours')
    },
    getSessionById: baseStore.getItemById,
    getSessions: async () => {
        await baseStore.ensureLoaded()
        return baseStore.items.value
    },
    deleteSession: baseStore.deleteItem,
    loadSessions: async () => {
        await baseStore.loadItems()
        // Original sort:
        // this.sessions.sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
        // baseStore.loadItems does not sort.
        // We can sort after loading.
        baseStore.items.value.sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime())
    },
    persistSessions: baseStore.persistItems,
    clearAllSessions: baseStore.clearAll,
  }
})

