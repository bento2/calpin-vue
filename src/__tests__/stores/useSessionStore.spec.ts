import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '@/stores/useSessionStore'
import type { Training } from '@/types/TrainingSchema'
import { addExerciceGetters } from '@/types/ExerciceSchema'

// Mock du StorageService
const mockSave = vi.fn()
const mockLoad = vi.fn()

vi.mock('@/services/StorageService', () => {
  return {
    StorageService: vi.fn(function () {
      return {
        save: mockSave,
        load: mockLoad,
        exists: vi.fn().mockResolvedValue(false),
        delete: vi.fn().mockResolvedValue(undefined),
        enableRealtimeSync: vi.fn(),
        switchAdapter: vi.fn(),
        // Mock accès interne adaptateur si nécessaire, mais les méthodes ci-dessus suffisent
      }
    }),
  }
})

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockSave.mockClear()
    mockLoad.mockClear()
    mockLoad.mockResolvedValue([]) // Stockage vide par défaut
    vi.clearAllMocks()
    localStorage.clear()
  })

  const mockTraining: Training = {
    id: 't1',
    name: 'Training 1',
    exercices: [
      addExerciceGetters({
        id: 'e1',
        name: 'Ex 1',
      }),
    ],
    ctime: new Date(),
    mtime: new Date(),
  }

  it('createSession devrait sauvegarder en local immédiatement', async () => {
    const store = useSessionStore()
    const session = await store.createSession(mockTraining)

    expect(session.id).toBeDefined()
    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0].id).toBe(session.id)
  })

  describe('syncFromFirebase', () => {
    it('devrait ajouter une session distante si non présente localement', async () => {
      const store = useSessionStore()
      const remoteSession = {
        ...mockTraining,
        id: 's_remote',
        trainingId: 't1',
        dateDebut: new Date().toISOString(),
        status: 'en_cours',
      }
      mockLoad.mockResolvedValue([remoteSession])

      await store.syncFromFirebase()

      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0].id).toBe('s_remote')
    })

    it('devrait mettre à jour la session locale si distante plus récente', async () => {
      const store = useSessionStore()
      const localSession = await store.createSession(mockTraining)
      // Remote session updated later
      const remoteSession = {
        ...localSession,
        updatedAt: new Date(Date.now() + 10000).toISOString(),
        status: 'terminee',
      }
      mockLoad.mockResolvedValue([remoteSession])

      await store.syncFromFirebase()

      expect(store.sessions[0].status).toBe('terminee')
    })

    it('devrait garder la session locale si locale plus récente', async () => {
      const store = useSessionStore()

      // Create and setup local session
      const s = await store.createSession(mockTraining)
      s.updatedAt = new Date(Date.now() + 10000) // Future (newer)
      s.status = 'en_cours'
      await store.updateSession(s)

      // Remote is older and has different status
      const remoteSession = {
        ...s,
        updatedAt: new Date(Date.now() - 5000).toISOString(),
        status: 'terminee',
      }
      mockLoad.mockResolvedValue([remoteSession])

      await store.syncFromFirebase()

      const current = await store.getSessionById(s.id)
      expect(current?.status).toBe('en_cours')
    })
  })

  it('finishSession devrait mettre à jour le statut local et sync sur Firebase', async () => {
    const store = useSessionStore()
    const session = await store.createSession(mockTraining)

    await store.finishSession(session.id)

    const updated = await store.getSessionById(session.id)
    expect(updated?.status).toBe('terminee')
    expect(updated?.dateFin).toBeDefined()
    expect(mockSave).toHaveBeenCalled()
  })

  it('getSessionActive devrait retourner la session en cours', async () => {
    const store = useSessionStore()
    await store.createSession(mockTraining)

    const active = await store.getSessionActive()
    expect(active).toBeDefined()
    expect(active?.status).toBe('en_cours')
  })
  describe('Helpers & Stats', () => {
    it('findStatsExercices devrait calculer les max par exercice', async () => {
      const store = useSessionStore()
      const s1 = await store.createSession(mockTraining)
      // Add exercise data
      s1.exercices[0].series = [{ poids: 10, repetitions: 10, checked: true, total: 100 }]
      // max is computed getter, no need to set
      await store.updateSession(s1)

      const stats = await store.findStatsExercices()
      expect(stats.get('e1')).toEqual(expect.objectContaining({ total: 100 }))
    })

    it('getSessions devrait charger, synchroniser et trier', async () => {
      const store = useSessionStore()
      // Mock existing data with VALID Session structure
      const mockSessionBase = {
        id: 'base',
        trainingId: 't1',
        dateDebut: new Date().toISOString(),
        status: 'en_cours' as const,
        exercices: [],
        updatedAt: new Date().toISOString(),
        nbChecked: 0,
        total: 0,
        ended: false,
      }
      const older = {
        ...mockSessionBase,
        id: 'old',
        dateDebut: new Date('2023-01-01').toISOString(),
      }
      const newer = {
        ...mockSessionBase,
        id: 'new',
        dateDebut: new Date('2024-01-01').toISOString(),
      }

      // Mock storage return
      mockLoad.mockResolvedValue([older, newer])

      const sessions = await store.getSessions()

      expect(sessions).toHaveLength(2)
      expect(sessions[0].id).toBe('new')
      expect(mockLoad).toHaveBeenCalled()
    })

    it('saveSession devrait sauvegarder sans terminer', async () => {
      const store = useSessionStore()
      const s = await store.createSession(mockTraining)
      await store.saveSession(s)
      // Should trigger update (local) and save (remote)
      expect(mockSave).toHaveBeenCalled()
    })

    it('deleteSession devrait supprimer localement et distancement', async () => {
      const store = useSessionStore()
      const s = await store.createSession(mockTraining)
      await store.deleteSession(s.id)

      expect(mockSave).toHaveBeenCalled()
    })

    it('loadSessions devrait charger les sessions', async () => {
      const store = useSessionStore()
      await store.loadSessions()
      expect(mockLoad).toHaveBeenCalled()
    })
  })
})
