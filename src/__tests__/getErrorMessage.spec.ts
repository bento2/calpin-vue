import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getErrorMessage } from '../composables/getErrorMessage'
import { ref } from 'vue'
import { SessionSchema, type Session } from '@/types/SessionSchema'

// Mock onMounted to run immediately since we are not in a component
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onMounted: (fn: () => void) => fn(),
    onUnmounted: vi.fn(),
  }
})

// Mock forHumans to have predictable output
vi.mock('@/composables/forHumans', () => ({
  forHumans: (seconds: number) => `Formatted: ${seconds}`,
}))

describe('getErrorMessage (composable)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with empty string', () => {
    const session = ref<Session | null>(null)
    const { diff } = getErrorMessage(session)
    expect(diff.value).toBe('')
  })

  it('should update diff when session has dateDebut', async () => {
    const now = new Date('2023-01-01T12:00:00Z')
    vi.setSystemTime(now)

    const dateDebut = new Date('2023-01-01T11:00:00Z') // 1 hour ago (3600 seconds)
    const session = ref<Session | null>(
      SessionSchema.parse({
        id: '1',
        trainingId: 't1',
        status: 'en_cours',
        dateDebut,
        exercices: [],
      }),
    )

    const { diff } = getErrorMessage(session)

    // Initial update
    expect(diff.value).toBe('Formatted: 3600')
  })

  it('should update diff periodically', async () => {
    const now = new Date('2023-01-01T12:00:00Z')
    vi.setSystemTime(now)

    const dateDebut = new Date('2023-01-01T11:59:50Z') // 10 seconds ago
    const session = ref<Session | null>(
      SessionSchema.parse({
        id: '1',
        trainingId: 't1',
        status: 'en_cours',
        dateDebut,
        exercices: [],
      }),
    )

    const { diff } = getErrorMessage(session)
    expect(diff.value).toBe('Formatted: 10')

    // Advance time by 5 seconds
    vi.advanceTimersByTime(5000)

    // Trigger interval callback (since we mocked timers, we need to ensure the interval fires)
    // Note: vi.advanceTimersByTime triggers the interval callbacks

    // However, the calculation inside updateDiff uses Date.now(), which we also need to mock/advance
    // We updated system time above.

    expect(diff.value).toBe('Formatted: 15')
  })
})
