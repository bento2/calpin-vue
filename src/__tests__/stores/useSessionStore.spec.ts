import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSessionStore } from '@/stores/useSessionStore'
import type { Training } from '@/types/TrainingSchema'
import { addExerciceGetters } from '@/types/ExerciceSchema'

// Mock StorageService
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
        // Mock adapter internal access if needed, but methods above should suffice for most calls
      }
    }),
  }
})

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockSave.mockClear()
    mockLoad.mockClear()
    mockLoad.mockResolvedValue([]) // Default empty storage
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

  it('createSession should save to LocalStorage immediately', async () => {
    const store = useSessionStore()
    const session = await store.createSession(mockTraining)

    expect(session.id).toBeDefined()
    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0].id).toBe(session.id)
  })

  describe('syncFromFirebase', () => {
    it('should add remote session if not present locally', async () => {
      const store = useSessionStore()

      // Setup: 1 local session
      const _localSession = await store.createSession(mockTraining)

      // Mock remote: local + 1 new. Use createMockSession or manual object with trainingId
      const remoteSession = {
        ...mockTraining,
        id: 's-remote-1',
        trainingId: mockTraining.id, // FIX: specificy trainingId
        status: 'terminee' as const,
        dateDebut: new Date(),
        updatedAt: new Date(),
        exercices: [],
        ended: true,
        nbChecked: 0,
        total: 0,
      }

      mockLoad.mockResolvedValue([
        { ...store.sessions[0] }, // Existing local
        remoteSession, // New remote
      ])

      await store.syncFromFirebase()

      expect(store.sessions).toHaveLength(2)
      expect(store.sessions.find((s) => s.id === 's-remote-1')).toBeDefined()
    })

    it('should update local session if remote is newer', async () => {
      const store = useSessionStore()
      const session = await store.createSession(mockTraining)

      const oldDate = new Date('2023-01-01')
      const newDate = new Date('2023-12-31')

      // Force local to be old
      session.updatedAt = oldDate

      const remoteVersion = {
        ...session,
        updatedAt: newDate,
        status: 'terminee', // Changed status
      }

      mockLoad.mockResolvedValue([remoteVersion])

      await store.syncFromFirebase()

      const updated = store.sessions.find((s) => s.id === session.id)
      expect(updated?.updatedAt).toEqual(newDate)
      expect(updated?.status).toBe('terminee')
    })

    it('should keep local session if local is newer', async () => {
      const store = useSessionStore()
      const session = await store.createSession(mockTraining)

      const oldDate = new Date('2023-01-01')
      const newDate = new Date('2023-12-31')

      // Force local to be new
      session.updatedAt = newDate
      const originalStatus = session.status

      const remoteVersion = {
        ...session,
        updatedAt: oldDate,
        status: 'terminee', // Changed status in old version
      }

      mockLoad.mockResolvedValue([remoteVersion])

      await store.syncFromFirebase()

      const current = store.sessions.find((s) => s.id === session.id)
      expect(current?.updatedAt).toEqual(newDate)
      expect(current?.status).toBe(originalStatus)
    })
  })

  it('finishSession should update local status and sync to Firebase', async () => {
    const store = useSessionStore()
    const session = await store.createSession(mockTraining)

    // Reset mock to distinguish calls
    mockSave.mockClear()

    const finishedSession = await store.finishSession(session.id)

    expect(finishedSession.status).toBe('terminee')
    expect(finishedSession.dateFin).toBeDefined()

    // Should verify it called save twice?
    // 1. updateSession (local) -> calls save on baseStore
    // 2. finishSession (firebase) -> calls save on firebaseStorage
    // Since our mock is the same class for both, checking if called is checking both.
    // Ideally we'd want to verify which one was called.

    expect(mockSave).toHaveBeenCalledTimes(2)
  })

  it('getSessionActive should return en_cours session', async () => {
    const store = useSessionStore()
    await store.createSession(mockTraining)

    const active = await store.getSessionActive()
    expect(active).toBeDefined()
    expect(active?.status).toBe('en_cours')
  })
})
