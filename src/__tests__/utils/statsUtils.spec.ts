import { describe, it, expect } from 'vitest'
import { calculateExerciseStats } from '@/utils/statsUtils'
import type { Session } from '@/types/SessionSchema'
import type { Serie } from '@/types/SerieSchema'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema'

// --- Factories ---

/**
 * Creates a mock series with a total getter.
 */
function createSerie({ poids = 0, repetitions = 0, checked = true }: Partial<Serie> = {}): Serie {
  return {
    poids,
    repetitions,
    checked,
    get total() {
      return (this.poids || 0) * (this.repetitions || 0)
    },
  }
}

/**
 * Creates a mock session enclosing specific exercises.
 */
function createSession(id: string, exercicesValues: Partial<ExerciceSeries>[] = []): Session {
  // Map partial inputs to the structure expected by the util
  const exercises = exercicesValues.map((ex) => ({
    id: ex.id || 'ex-default',
    series: ex.series || [],
    max: ex.max, // Explicitly pass max if provided
  }))

  return {
    id,
    name: 'Test Session',
    dateDebut: new Date(),
    status: 'terminee',
    exercices: exercises,
  } as unknown as Session
}

describe('statsUtils', () => {
  describe('calculateExerciseStats', () => {
    // --- Basic Empty Cases ---

    it('returns empty stats for empty sessions list', () => {
      const stats = calculateExerciseStats([])
      expect(stats.size).toBe(0)
    })

    it('returns empty stats if no exercise has a defined max', () => {
      // Case where max is undefined/null
      const session = createSession('s1', [{ id: 'ex1', series: [], max: undefined }])
      const stats = calculateExerciseStats([session])
      expect(stats.size).toBe(0)
    })

    // --- Single Session ---

    it('finds stats for a single session', () => {
      const best = createSerie({ poids: 10, repetitions: 10 })
      const session = createSession('s1', [
        { id: 'ex1', max: best }, // max is set
      ])
      const stats = calculateExerciseStats([session])
      expect(stats.get('ex1')).toEqual(best)
    })

    // --- Criteria: MAX_TOTAL (Default) ---

    describe('Criteria: MAX_TOTAL', () => {
      it('keeps the series with higher total', () => {
        const sLower = createSerie({ poids: 10, repetitions: 10 }) // 100
        const sHigher = createSerie({ poids: 12, repetitions: 10 }) // 120

        const sessions = [
          createSession('s1', [{ id: 'ex1', max: sLower }]),
          createSession('s2', [{ id: 'ex1', max: sHigher }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_TOTAL')
        expect(stats.get('ex1')).toEqual(sHigher)
      })

      it('keeps existing max if new one is lower', () => {
        const sHigher = createSerie({ poids: 12, repetitions: 10 })
        const sLower = createSerie({ poids: 10, repetitions: 10 })

        const sessions = [
          createSession('s1', [{ id: 'ex1', max: sHigher }]),
          createSession('s2', [{ id: 'ex1', max: sLower }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_TOTAL')
        expect(stats.get('ex1')).toEqual(sHigher)
      })

      it('handles missing total getter gracefully (fallback calculation)', () => {
        // Objects without getters (plain JSON style)
        const s1 = { poids: 10, repetitions: 10, checked: true } as Serie
        const s2 = { poids: 20, repetitions: 10, checked: true } as Serie

        const sessions = [
          createSession('s1', [{ id: 'ex1', max: s1 }]),
          createSession('s2', [{ id: 'ex1', max: s2 }]),
        ]

        const stats = calculateExerciseStats(sessions)
        expect(stats.get('ex1')).toEqual(s2)
      })

      it('handles undefined weight/reps in fallback', () => {
        // Fallback coverage: currentMax.total undefined
        // And ensure it handles nulls in math -> (undefined || 0)
        const s1 = { poids: undefined, repetitions: undefined, checked: true } as unknown as Serie // 0
        const s2 = { poids: 10, repetitions: 1, checked: true } as Serie // 10

        const sessions = [
          createSession('s1', [{ id: 'ex1', max: s1 }]),
          createSession('s2', [{ id: 'ex1', max: s2 }]),
        ]

        const stats = calculateExerciseStats(sessions)
        // Should pick s2 because 10 > 0
        expect(stats.get('ex1')).toEqual(s2)
      })
    })

    // --- Criteria: MAX_WEIGHT ---

    describe('Criteria: MAX_WEIGHT', () => {
      it('prioritizes weight over total volume', () => {
        const highVolLowWeight = createSerie({ poids: 10, repetitions: 20 }) // 200 total
        const lowVolHighWeight = createSerie({ poids: 50, repetitions: 1 }) // 50 total

        const sessions = [
          createSession('s1', [{ id: 'bench', max: highVolLowWeight }]),
          createSession('s2', [{ id: 'bench', max: lowVolHighWeight }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_WEIGHT')
        expect(stats.get('bench')).toEqual(lowVolHighWeight)
      })

      it('updates if heavier weight found', () => {
        const s1 = createSerie({ poids: 100 })
        const s2 = createSerie({ poids: 105 })

        const sessions = [
          createSession('s1', [{ id: 'bench', max: s1 }]),
          createSession('s2', [{ id: 'bench', max: s2 }]),
        ]
        expect(calculateExerciseStats(sessions, 'MAX_WEIGHT').get('bench')).toEqual(s2)
      })

      it('handles undefined weight gracefully', () => {
        const s1 = { poids: undefined } as unknown as Serie // 0
        const s2 = { poids: 10 } as Serie

        const sessions = [
          createSession('s1', [{ id: 'bench', max: s1 }]),
          createSession('s2', [{ id: 'bench', max: s2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_WEIGHT')
        expect(stats.get('bench')).toEqual(s2)
      })
    })
  })
})
