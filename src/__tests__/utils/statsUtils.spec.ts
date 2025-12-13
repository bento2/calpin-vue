import { describe, it, expect } from 'vitest'
import { calculateExerciseStats } from '@/utils/statsUtils'
import type { Session } from '@/types/SessionSchema'
import type { Serie } from '@/types/SerieSchema'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema'

// Helper to create a minimal session
function createSession(id: string, exercices: Partial<ExerciceSeries>[]): Session {
  return {
    id,
    name: 'Test Session',
    dateDebut: new Date(),
    status: 'terminee',
    exercices: exercices.map((ex) => ({
      ...ex,
      series: ex.series && ex.series.length > 0 ? ex.series : ex.max ? [ex.max] : [],
      set: 0,
      max: ex.max || undefined,
    })),
  } as unknown as Session
}

// Helper to create a serie
function createSerie(poids: number, repetitions: number): Serie {
  // We mimic the getter behavior for total
  return {
    poids,
    repetitions,
    checked: true,
    get total() {
      return (this.poids || 0) * (this.repetitions || 0)
    },
  }
}

describe('statsUtils', () => {
  describe('calculateExerciseStats', () => {
    it('should return empty stats for empty sessions', () => {
      const stats = calculateExerciseStats([])
      expect(stats.size).toBe(0)
    })

    it('should return empty stats if no exercises have max defined', () => {
      const session = createSession('s1', [{ id: 'ex1', series: [], max: null }])
      const stats = calculateExerciseStats([session])
      expect(stats.size).toBe(0)
    })

    it('should find stats for a single session', () => {
      const maxSerie = createSerie(10, 10) // total 100
      const session = createSession('s1', [{ id: 'ex1', series: [maxSerie], max: maxSerie }])

      const stats = calculateExerciseStats([session])
      expect(stats.get('ex1')).toEqual(maxSerie)
    })

    describe('MAX_TOTAL criteria (default)', () => {
      it('should keep the serie with higher total', () => {
        const serie1 = createSerie(10, 10) // total 100
        const serie2 = createSerie(12, 10) // total 120 (better)

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serie1 }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serie2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_TOTAL')
        expect(stats.get('ex1')).toEqual(serie2)
      })

      it('should keep existing max if new one is lower total', () => {
        const serie1 = createSerie(12, 10) // total 120 (better)
        const serie2 = createSerie(10, 10) // total 100

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serie1 }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serie2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_TOTAL')
        expect(stats.get('ex1')).toEqual(serie1)
      })

      it('should handle missing total getter safely', () => {
        // Object literal without getter
        const serie1 = { poids: 10, repetitions: 10, checked: true } as Serie
        const serie2 = { poids: 20, repetitions: 10, checked: true } as Serie // Higher total implied

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serie1 }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serie2 }]),
        ]

        const stats = calculateExerciseStats(sessions) // default is MAX_TOTAL
        expect(stats.get('ex1')).toEqual(serie2)
      })
    })

    describe('MAX_WEIGHT criteria', () => {
      it('should keep the serie with higher weight regardless of total', () => {
        // High volume, low weight
        const serieVolume = createSerie(10, 20) // weight 10, total 200
        // Low volume, high weight
        const serieWeight = createSerie(50, 1) // weight 50, total 50

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serieVolume }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serieWeight }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_WEIGHT')
        // Should pick serieWeight because 50 > 10
        expect(stats.get('ex1')).toEqual(serieWeight)
      })

      it('should update if a heavier lift is found later', () => {
        const s1 = createSerie(100, 1)
        const s2 = createSerie(105, 1) // New PR

        const sessions = [
          createSession('s1', [{ id: 'bench', max: s1 }]),
          createSession('s2', [{ id: 'bench', max: s2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_WEIGHT')
        expect(stats.get('bench')).toEqual(s2)
      })

      it('should not update if a lighter lift is found later', () => {
        const s1 = createSerie(100, 1)
        const s2 = createSerie(90, 5)

        const sessions = [
          createSession('s1', [{ id: 'bench', max: s1 }]),
          createSession('s2', [{ id: 'bench', max: s2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_WEIGHT')
        expect(stats.get('bench')).toEqual(s1)
      })
    })
  })
})
