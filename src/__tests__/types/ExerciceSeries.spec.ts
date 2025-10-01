import { describe, it, expect } from 'vitest'
import { ExerciceSeriesSchema } from '@/types/ExerciceSeriesSchema.ts'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema.ts'

describe('ExerciceSeries', () => {
  it('doit être valide', () => {
    const exercice: ExerciceSeries = {
      id: '1',
      name: 'Pompes',
      category: 'Force',
      difficulty: 'débutant',
      series: [
        { poids: 0, repetitions: 15 },
        { poids: 0, repetitions: 12, checked: true },
      ],
    }

    expect(() => ExerciceSeriesSchema.parse(exercice)).not.toThrow()
  })
})
