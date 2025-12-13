import { defineStore } from 'pinia'
import { type Session, SessionSchema, SessionStatusSchema } from '@/types/SessionSchema.ts'
import type { Training } from '@/types/TrainingSchema.ts'
import SessionService from '@/services/SessionService.ts'

import { useBaseStore } from '@/composables/useBaseStore.ts'
import type { Serie } from '@/types/SerieSchema.ts'
import { computed, ref } from 'vue'
import { getErrorMessage } from '@/composables/getErrorMessage.ts'
import { calculateExerciseStats, type StatsCriteria } from '@/utils/statsUtils'

const storageName = 'sessions'

export const useSessionStore = defineStore(storageName, () => {
  // Changement ici: on utilise 'localStorage' comme source de vérité par défaut pour la rapidité
  const baseStore = useBaseStore<Session>(storageName, SessionSchema, 'localStorage', {
    updatedAt: 'updatedAt',
  })

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
  async function findStatsExercices(criteria: StatsCriteria = 'MAX_TOTAL') {
    try {
      if (!statsLoaded.value) {
        await baseStore.ensureLoaded()
        const stats = calculateExerciseStats(baseStore.items.value, criteria)
        // Update the ref map with the result
        statsExercices.value = stats
        statsLoaded.value = true
      } else {
        // If loaded, we might want to refresh if criteria changed?
        // For now, let's assume if called with different criteria we should re-calc?
        // But statsLoaded is simple boolean.
        // Let's FORCE re-calc if criteria implies we need to check everything again?
        // Actually, the user might call this multiple times properly.
        // Given the simplistic caching 'statsLoaded', if we change criteria, we probably need to re-compute.
        // But the previous implementation only computed ONCE.
        // To support dynamic criteria, we should probably remove the strict `statsLoaded` check OR
        // make `statsExercices` a computed or just re-run calculation.
        // Since it returns `statsExercices.value`, let's clear cache if we want to force update?
        // Or better: just recalculate every time if we want flexibility, or cache by criteria.
        // Let's stay safe: simple refactor.
        // BUT, if criteria changes, we MUST recalculate.
        // So I'll remove the `if (!statsLoaded.value)` check around the CALCULATION part,
        // or check if it's already calculated.
        // Actually, for performance, recalculating on every call might be fine if N is small.
        // Let's improve: always calculate and return?
        // The original code cached it.
        // "findStatsExercices" sounds like an action.

        // I will re-implement to: ensure loaded, then calculate.
        // I will remove `statsLoaded` check for the CALCULATION itself to support criteria changes,
        // BUT keep `baseStore.ensureLoaded` check.

        statsExercices.value = calculateExerciseStats(baseStore.items.value, criteria)
      }

      return statsExercices.value
    } catch (error) {
      baseStore.error.value = `Erreur lors de la recherche de stats: ${getErrorMessage(error)}`
      throw error
    }
  }

  async function createSession(training: Training, options?: { name?: string }) {
    // We utilize SessionService for logic, but BaseStore for persistence & validation
    const sessionTemplate = SessionService.createFromTraining(training, options)
    return baseStore.createItem(sessionTemplate)
  }

  async function updateSession(updatedSession: Session) {
    return baseStore.updateItem(updatedSession)
  }

  async function restartSession(session: Session) {
    try {
      //remise à zéro des informations
      session.dateDebut = new Date()
      // updatedAt handled by updateSession -> baseStore.updateItem
      session.exercices.map((exercice) => {
        exercice.series?.map((serie) => {
          serie.poids = 0
          serie.checked = false
          serie.repetitions = 0
        })
      })
      return await updateSession(session)
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
