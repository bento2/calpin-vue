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
})
