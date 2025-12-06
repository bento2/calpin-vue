import { defineStore } from 'pinia'
import { type Session, SessionSchema, SessionStatusSchema } from '@/types/SessionSchema.ts'
import type { Training } from '@/types/TrainingSchema.ts'
import SessionService from '@/services/SessionService.ts'
import { StorageService } from '@/services/StorageService.ts'
import { useBaseStore } from '@/composables/useBaseStore.ts'
import type { Serie } from '@/types/SerieSchema.ts'
import { computed } from 'vue'
import { getErrorMessage } from '@/composables/Functions.ts'

const storageName = 'sessions'

export const useSessionStore = defineStore(storageName, () => {
  // Changement ici: on utilise 'localStorage' comme source de vérité par défaut pour la rapidité
  const baseStore = useBaseStore<Session>(storageName, SessionSchema, 'localStorage')

  // Service séparé pour la synchro Firebase (archive)
  const firebaseStorage = new StorageService<Session[]>(storageName, {
    adapter: 'firebase',
  })

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

    // 2. Synchroniser vers Firebase (sauvegarde durable)
    try {
      await firebaseStorage.save(baseStore.items.value)
    } catch (err) {
      console.error('Erreur sync Firebase après finish:', err)
    }

    return updatedSession
  }

  // Fonction pour charger depuis Firebase si besoin
  async function syncFromFirebase() {
    try {
      baseStore.loading.value = true
      const remoteSessions = await firebaseStorage.load()
      if (remoteSessions) {
        await baseStore.ensureLoaded()
        const localSessions = baseStore.items.value
        const localMap = new Map(localSessions.map((s) => [s.id, s]))
        let hasChanges = false

        remoteSessions.forEach((remoteS) => {
          const localS = localMap.get(remoteS.id)
          if (!localS) {
            // Cas 1: Existe sur Firebase, pas en Local -> On ajoute
            localSessions.push(remoteS)
            hasChanges = true
          } else {
            // Cas 2: Conflit -> On regarde qui est le plus récent
            // Si pas de updatedAt, on assume que Firebase (Cloud) "peut" être plus vieux si offline
            // Mais le user veut "merge".
            // Stratégie:
            // Si remote.updatedAt > local.updatedAt -> Remote wins
            // Sinon -> Local wins (donc on ne fait rien)

            const remoteDate = remoteS.updatedAt ? new Date(remoteS.updatedAt).getTime() : 0
            const localDate = localS.updatedAt ? new Date(localS.updatedAt).getTime() : 0

            if (remoteDate > localDate) {
              // Remote est plus récent
              const index = localSessions.findIndex((s) => s.id === remoteS.id)
              if (index !== -1) {
                localSessions[index] = remoteS
                hasChanges = true
              }
            }
          }
        })

        if (hasChanges) {
          // Tri après merge
          localSessions.sort(
            (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
          )
          await baseStore.persistItems() // Sauvegarder le résultat fusionné en local
        }
      }
    } catch (e) {
      console.error('Erreur syncFromFirebase', e)
    } finally {
      baseStore.loading.value = false
    }
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
    syncFromFirebase,
    getSessionActive: async () => {
      await baseStore.ensureLoaded()
      // On retourne la première session en cours trouvée
      return baseStore.items.value.find((session: Session) => session.status === 'en_cours')
    },
    getSessionById: baseStore.getItemById,
    saveSession: async (session: Session) => {
      // Sauvegarder l'état actuel sans terminer
      await updateSession(session)
      try {
        await firebaseStorage.save(baseStore.items.value)
      } catch (e) {
        console.error(e)
      }
    },
    getSessions: async () => {
      await baseStore.ensureLoaded()
      // If empty, try to sync from firebase (auto-restore)
      if (baseStore.items.value.length === 0) {
        await syncFromFirebase()
      }
      // Return sorted: recent first (descending)
      // We use the computed property value or sort manually to ensure consistency
      return [...baseStore.items.value].sort(
        (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
      )
    },
    deleteSession: async (id: string) => {
      await baseStore.deleteItem(id)
      // Optionnel: supprimer de firebase aussi ?
      // Pour l'instant on resync tout
      try {
        await firebaseStorage.save(baseStore.items.value)
      } catch (e) {
        console.error(e)
      }
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
