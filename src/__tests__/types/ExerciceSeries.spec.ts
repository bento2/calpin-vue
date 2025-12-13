import { describe, it, expect } from 'vitest'
import { ExerciceSeriesSchema } from '@/types/ExerciceSeriesSchema'

describe('ExerciceSeriesSchema', () => {
  const baseExercice = {
    id: '1',
    name: 'Ex 1',
    series: [],
  }

  it('devrait calculer completed correctement', () => {
    // Séries vides
    let result = ExerciceSeriesSchema.parse(baseExercice)
    expect(result.completed).toBe(false)

    // Séries non cochées
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [{ checked: false, repetitions: 10, poids: 10 }],
    })
    expect(result.completed).toBe(false)

    // Séries mixtes
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 },
        { checked: false, repetitions: 10, poids: 10 },
      ],
    })
    expect(result.completed).toBe(false)

    // Séries indéfinies
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(result.completed).toBe(false)

    // Toutes cochées
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 },
        { checked: true, repetitions: 10, poids: 10 },
      ],
    })
    expect(result.completed).toBe(true)
  })

  it('devrait calculer nbChecked correctement', () => {
    const result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 },
        { checked: false, repetitions: 10, poids: 10 },
        { checked: true, repetitions: 10, poids: 10 },
      ],
    })
    expect(result.nbChecked).toBe(2)

    // Séries indéfinies
    const resultUndef = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(resultUndef.nbChecked).toBe(0)
  })

  it('devrait calculer total correctement', () => {
    const result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 }, // 100
        { checked: true, repetitions: 5, poids: 20 }, // 100
      ],
    })
    expect(result.total).toBe(200)

    // Séries indéfinies
    const resultUndef = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(resultUndef.total).toBe(0)
  })

  it('devrait trouver la série max correctement', () => {
    const result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 }, // 100
        { checked: true, repetitions: 5, poids: 30 }, // 150
      ],
    })
    expect(result.max).not.toBeNull()
    expect(result.max?.total).toBe(150)

    // Séries indéfinies
    const resultUndef = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(resultUndef.max).toBeNull()

    // Séries vides
    const resultEmpty = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [],
    })
    expect(resultEmpty.max).toBeNull()
  })
})
