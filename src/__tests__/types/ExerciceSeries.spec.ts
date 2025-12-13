import { describe, it, expect } from 'vitest'
import { ExerciceSeriesSchema } from '@/types/ExerciceSeriesSchema'

describe('ExerciceSeriesSchema', () => {
  const baseExercice = {
    id: '1',
    name: 'Ex 1',
    series: [],
  }

  it('should calculate completed correctly', () => {
    // Empty series
    let result = ExerciceSeriesSchema.parse(baseExercice)
    expect(result.completed).toBe(false)

    // Unchecked series
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [{ checked: false, repetitions: 10, poids: 10 }],
    })
    expect(result.completed).toBe(false)

    // Mixed series
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 },
        { checked: false, repetitions: 10, poids: 10 },
      ],
    })
    expect(result.completed).toBe(false)

    // Undefined series
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(result.completed).toBe(false)

    // All checked
    result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 },
        { checked: true, repetitions: 10, poids: 10 },
      ],
    })
    expect(result.completed).toBe(true)
  })

  it('should calculate nbChecked correctly', () => {
    const result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 },
        { checked: false, repetitions: 10, poids: 10 },
        { checked: true, repetitions: 10, poids: 10 },
      ],
    })
    expect(result.nbChecked).toBe(2)

    // Undefined series
    const resultUndef = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(resultUndef.nbChecked).toBe(0)
  })

  it('should calculate total correctly', () => {
    const result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 }, // 100
        { checked: true, repetitions: 5, poids: 20 }, // 100
      ],
    })
    expect(result.total).toBe(200)

    // Undefined series
    const resultUndef = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(resultUndef.total).toBe(0)
  })

  it('should find max series correctly', () => {
    const result = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [
        { checked: true, repetitions: 10, poids: 10 }, // 100
        { checked: true, repetitions: 5, poids: 30 }, // 150
      ],
    })
    expect(result.max).not.toBeNull()
    expect(result.max?.total).toBe(150)

    // Undefined series
    const resultUndef = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: undefined,
    })
    expect(resultUndef.max).toBeNull()

    // Empty series
    const resultEmpty = ExerciceSeriesSchema.parse({
      ...baseExercice,
      series: [],
    })
    expect(resultEmpty.max).toBeNull()
  })
})
