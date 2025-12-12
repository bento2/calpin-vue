import { defineStore } from 'pinia'
import { type Session, SessionSchema, SessionStatusSchema } from '@/types/SessionSchema.ts'
import type { Training } from '@/types/TrainingSchema.ts'
import SessionService from '@/services/SessionService.ts'

import { useBaseStore } from '@/composables/useBaseStore.ts'
import type { Serie } from '@/types/SerieSchema.ts'
import { computed, ref } from 'vue'
import { getErrorMessage } from '@/composables/getErrorMessage.ts'

const storageName = 'sessions'

export const useSessionStore = defineStore(storageName, () => {
  // Changement ici: on utilise 'localStorage' comme source de vérité par défaut pour la rapidité
  const baseStore = useBaseStore<Session>(storageName, SessionSchema, 'localStorage')

  const statsExercices = ref<Map<string, Serie>>(new Map<string, Serie>())
  const statsLoaded = ref(false)

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
      if (!statsLoaded.value) {
        await baseStore.ensureLoaded()

        baseStore.items.value.forEach((session) => {
          session.exercices.forEach((exercice) => {
            if (exercice.series && exercice.max) {
              if (statsExercices.value.has(exercice.id)) {
                const last = statsExercices.value.get(exercice.id)
                if (last && last.total < exercice.max.total) {
                  statsExercices.value.set(exercice.id, exercice.max)
                }
              } else {
                statsExercices.value.set(exercice.id, exercice.max)
              }
            }
          })
        })
        statsLoaded.value = true
      }

      return statsExercices.value
    } catch (error) {
      baseStore.error.value = `Erreur lors de la recherche de stats: ${getErrorMessage(error)}`
      throw error
    }
  }

  async function createSession(training: Training, options?: { name?: string }) {
    try {
      await baseStore.ensureLoaded()

      const session = SessionService.createFromTraining(training, options)
      session.updatedAt = new Date() // Add timestamp
      const validatedSession = SessionSchema.parse(session)

      // Sauvegarde uniquement en LocalStorage pour l'instant (rapide)
      return baseStore.saveItem(validatedSession)
    } catch (error) {
      baseStore.error.value = `Erreur lors de la création: ${getErrorMessage(error)}`
      throw error
    }
  }

  async function updateSession(updatedSession: Session) {
    try {
      await baseStore.ensureLoaded()
      const index = baseStore.items.value.findIndex((s) => s.id === updatedSession.id)
      if (index === -1) {
        // Si pas trouvé, on l'ajoute
      }

      updatedSession.updatedAt = new Date() // Update timestamp

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
      session.updatedAt = new Date() // Sync date
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
      updatedAt: new Date(),
      status: SessionStatusSchema.enum.terminee,
    }

    // 1. Mettre à jour localement (termine la session pour l'UI)
    await updateSession(updatedSession)

    return updatedSession
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
      // On retourne la première session en cours trouvée
      return baseStore.items.value.find((session: Session) => session.status === 'en_cours')
    },
    getSessionById: baseStore.getItemById,
    saveSession: async (session: Session) => {
      // Sauvegarder l'état actuel sans terminer
      await updateSession(session)
    },
    getSessions: async () => {
      await baseStore.ensureLoaded()
      // Return sorted: recent first (descending)
      return [...baseStore.items.value].sort(
        (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
      )
    },
    deleteSession: async (id: string) => {
      await baseStore.deleteItem(id)
    },
    loadSessions: async () => {
      await baseStore.loadItems()
      baseStore.items.value.sort(
        (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
      )
    },
    persistSessions: baseStore.persistItems,
    clearAllSessions: baseStore.clearAll,
  }
})
