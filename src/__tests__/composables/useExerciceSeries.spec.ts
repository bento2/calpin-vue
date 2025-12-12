import { describe, it, expect } from 'vitest'
import { isCompleted, nbChecked } from '@/composables/useExerciceSeries'
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
    it('devrait retourner true quand toutes les séries sont cochées', () => {
      const exercice = createExercice([{ checked: true }, { checked: true }])
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(true)
    })

    it('devrait retourner false quand certaines séries ne sont pas cochées', () => {
      const exercice = createExercice([{ checked: true }, { checked: false }])
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })

    it("devrait retourner false quand aucune série n'est cochée", () => {
      const exercice = createExercice([{ checked: false }, { checked: false }])
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })

    it('devrait retourner false quand les séries sont vides', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
        series: [],
      })
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })

    it('devrait retourner false quand les séries sont indéfinies', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
      })
      const completed = isCompleted(exercice)
      expect(completed.value).toBe(false)
    })
  })

  describe('nbChecked', () => {
    it('devrait retourner le nombre correct de séries cochées', () => {
      const exercice = createExercice([{ checked: true }, { checked: false }, { checked: true }])
      const count = nbChecked(exercice)
      expect(count.value).toBe(2)
    })

    it("devrait retourner 0 quand aucune série n'est cochée", () => {
      const exercice = createExercice([{ checked: false }, { checked: false }])
      const count = nbChecked(exercice)
      expect(count.value).toBe(0)
    })

    it('devrait retourner 0 quand les séries sont vides', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
        series: [],
      })
      const count = nbChecked(exercice)
      expect(count.value).toBe(0)
    })

    it('devrait retourner 0 quand les séries sont indéfinies', () => {
      const exercice = ExerciceSeriesSchema.parse({
        id: '1',
        name: 'Ex 1',
      })
      const count = nbChecked(exercice)
      expect(count.value).toBe(0)
    })
  })
})
