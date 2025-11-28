import { describe, it, expect } from 'vitest'
import { isCompleted, nbChecked } from '../composables/useExerciceSeries'
import { ExerciceSeriesSchema, type ExerciceSeries } from '@/types/ExerciceSeriesSchema'

describe('useExerciceSeries', () => {
  const createExercice = (seriesData: { checked: boolean }[]): ExerciceSeries => {
    return ExerciceSeriesSchema.parse({
      id: '1',
      name: 'Exercice Test',
      series: seriesData.map((s) => ({
        poids: 10,
        repetitions: 10,
        checked: s.checked,
      })),
    })
  }

  describe('isCompleted', () => {
    it('should return true when all series are checked', () => {
      const exercice = createExercice([{ checked: true }, { checked: true }])
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(true)
    })

    it('should return false when some series are unchecked', () => {
      const exercice = createExercice([{ checked: true }, { checked: false }])
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })

    it('should return false when all series are unchecked', () => {
      const exercice = createExercice([{ checked: false }, { checked: false }])
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })

    it('should return false when series is empty', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
        series: [],
      })
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })

    it('should return false when series is undefined', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
      })
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })
  })

  describe('nbChecked', () => {
    it('should return the correct count of checked series', () => {
      const exercice = createExercice([{ checked: true }, { checked: false }, { checked: true }])
      const count = nbChecked(exercice)
      expect(count.value).toBe(2)
    })

    it('should return 0 when no series are checked', () => {
      const exercice = createExercice([{ checked: false }, { checked: false }])
      const count = nbChecked(exercice)
      expect(count.value).toBe(0)
    })

    it('should return 0 when series is empty', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
        series: [],
      })
      const count = nbChecked(exercice)
      expect(count.value).toBe(0)
    })

    it('should return 0 when series is undefined', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
      })
      const count = nbChecked(exercice)
      expect(count.value).toBe(0)
    })
  })
})
