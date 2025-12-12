import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia } from 'pinia'
import { useSessionStore } from '@/stores/useSessionStore'
import type { Training } from '@/types/TrainingSchema'
import { addExerciceGetters } from '@/types/ExerciceSchema'
import { createTestingPinia } from '@pinia/testing'
import { syncPlugin } from '@/plugins/syncPlugin'

// Mock du StorageService
const mockSave = vi.fn()
const mockLoad = vi.fn()
const mockExists = vi.fn()
const mockDelete = vi.fn()
const mockEnableRealtimeSync = vi.fn()
const mockSwitchAdapter = vi.fn()

vi.mock('@/services/StorageService', () => {
  return {
    StorageService: vi.fn(function () {
      return {
        save: mockSave,
        load: mockLoad,
        exists: mockExists,
        delete: mockDelete,
        enableRealtimeSync: mockEnableRealtimeSync,
        switchAdapter: mockSwitchAdapter,
      }
    }),
  }
})

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(
      createTestingPinia({
        stubActions: false,
        plugins: [syncPlugin],
        createSpy: vi.fn,
      }),
    )
    mockSave.mockClear()
    mockLoad.mockClear()
    mockLoad.mockResolvedValue([])
    vi.clearAllMocks()
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('createSession devrait sauvegarder en local immédiatement et avoir une date de mise à jour', async () => {
    const store = useSessionStore()
    const session = await store.createSession(mockTraining)

    expect(session.id).toBeDefined()
    expect(session.updatedAt).toBeDefined()
    expect(store.sessions).toHaveLength(1)

    // Check sync (debounced)
    vi.advanceTimersByTime(2500)
    expect(mockSave).toHaveBeenCalledTimes(2) // 1 local + 1 sync
  })

  it('updateSession devrait mettre à jour updatedAt', async () => {
    const store = useSessionStore()
    const session = await store.createSession(mockTraining)
    const oldDate = session.updatedAt

    vi.advanceTimersByTime(100) // Ensure time passes

    await store.updateSession(session)

    expect(session.updatedAt).not.toBe(oldDate)
    expect(session.updatedAt?.getTime()).toBeGreaterThan(oldDate!.getTime())
  })

  it('finishSession devrait mettre à jour le statut local et sync sur Firebase', async () => {
    const store = useSessionStore()
    const session = await store.createSession(mockTraining)

    await store.finishSession(session.id)

    const updated = await store.getSessionById(session.id)
    expect(updated?.status).toBe('terminee')
    expect(updated?.dateFin).toBeDefined()
    expect(updated?.updatedAt).toBeDefined()

    vi.advanceTimersByTime(2500) // Trigger sync
    expect(mockSave).toHaveBeenCalled()
  })

  describe('Sync Conflict Resolution', () => {
    it('devrait mettre à jour la session locale si la distante est plus récente (updatedAt)', async () => {
      const store = useSessionStore()
      const session = await store.createSession(mockTraining)
      vi.advanceTimersByTime(2500) // initial sync

      const oldDate = new Date('2023-01-01')
      const newDate = new Date('2050-01-01')

      session.updatedAt = oldDate // Local is old

      const remoteSession = {
        ...session,
        updatedAt: newDate,
        name: 'Updated Remotely',
      }

      // Need partial logic for deserialization simulation? No, load returns objects.

      mockLoad.mockResolvedValue([remoteSession])

      // @ts-expect-error - Added by plugin
      await store.syncFromCloud()

      const updated = await store.getSessionById(session.id)
      expect(updated?.updatedAt).toEqual(newDate)
      expect(updated?.name).toBe('Updated Remotely')
    })

    it('devrait garder la session locale si elle est plus récente', async () => {
      const store = useSessionStore()
      const session = await store.createSession(mockTraining)
      vi.advanceTimersByTime(2500)

      const localDate = new Date('2050-01-01')
      const remoteDate = new Date('2023-01-01')

      session.updatedAt = localDate
      const originalName = session.name

      const remoteSession = {
        ...session,
        updatedAt: remoteDate,
        name: 'Old Remote',
      }

      mockLoad.mockResolvedValue([remoteSession])

      // @ts-expect-error - Added by plugin
      await store.syncFromCloud()

      const current = await store.getSessionById(session.id)
      expect(current?.updatedAt).toEqual(localDate)
      expect(current?.name).toBe(originalName)
    })
  })

  it('getSessionActive devrait retourner la session en cours', async () => {
    const store = useSessionStore()
    await store.createSession(mockTraining)

    const active = await store.getSessionActive()
    expect(active).toBeDefined()
    expect(active?.status).toBe('en_cours')
  })

  it('findStatsExercices should correctly aggregate stats using different criteria', async () => {
    const store = useSessionStore()

    // Create a past session with stats
    const pastTraining: Training = {
      ...mockTraining,
      id: 't_past',
      exercices: [
        addExerciceGetters({
          id: 'e1',
          name: 'Ex 1',
          max: { poids: 100, repetitions: 1, checked: true },
          series: [{ poids: 100, repetitions: 1, checked: true }],
        }),
      ],
    }

    // We need to bypass createSession because it sets date to now.
    // Or just manually insert into store items for test speed/simplicity
    // Since we mock load, we can set load return value

    const s1 = {
      id: 's1',
      trainingId: 't_past',
      name: 'S1',
      status: 'terminee',
      dateDebut: new Date('2023-01-01'),
      exercices: pastTraining.exercices,
      updatedAt: new Date(),
    }

    // Mock load to return our session
    mockLoad.mockResolvedValue([s1])

    // Trigger load
    await store.loadSessions()
    expect(store.sessions).toHaveLength(1)

    // 1. Defaut (MAX_TOTAL)
    const statsTotal = await store.findStatsExercices()
    expect(statsTotal.get('e1')).toBeDefined()
    expect(statsTotal.get('e1')?.poids).toBe(100)

    // 2. MAX_WEIGHT check (same result here but verify call works)
    const statsWeight = await store.findStatsExercices('MAX_WEIGHT')
    expect(statsWeight.get('e1')).toBeDefined()
  })
})
