import { describe, it, expect } from 'vitest'
import { calculateExerciseStats } from '@/utils/statsUtils'
import type { Session } from '@/types/SessionSchema'
import type { Serie } from '@/types/SerieSchema'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema'

// Helper pour créer une session minimale
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

// Helper pour créer une série
function createSerie(poids: number, repetitions: number): Serie {
  // Nous imitons le comportement du getter pour le total
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
    it('devrait retourner des stats vides pour des sessions vides', () => {
      const stats = calculateExerciseStats([])
      expect(stats.size).toBe(0)
    })

    it("devrait retourner des stats vides si aucun exercice n'a de max défini", () => {
      const session = createSession('s1', [{ id: 'ex1', series: [], max: null }])
      const stats = calculateExerciseStats([session])
      expect(stats.size).toBe(0)
    })

    it('devrait trouver des stats pour une seule session', () => {
      const maxSerie = createSerie(10, 10) // total 100
      const session = createSession('s1', [{ id: 'ex1', series: [maxSerie], max: maxSerie }])

      const stats = calculateExerciseStats([session])
      expect(stats.get('ex1')).toEqual(maxSerie)
    })

    describe('Critère MAX_TOTAL (défaut)', () => {
      it('devrait garder la série avec le total le plus élevé', () => {
        const serie1 = createSerie(10, 10) // total 100
        const serie2 = createSerie(12, 10) // total 120 (meilleur)

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serie1 }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serie2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_TOTAL')
        expect(stats.get('ex1')).toEqual(serie2)
      })

      it('devrait garder le max existant si le nouveau a un total inférieur', () => {
        const serie1 = createSerie(12, 10) // total 120 (meilleur)
        const serie2 = createSerie(10, 10) // total 100

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serie1 }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serie2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_TOTAL')
        expect(stats.get('ex1')).toEqual(serie1)
      })

      it("devrait gérer l'absence de getter total en toute sécurité", () => {
        // Littéral d'objet sans getter
        const serie1 = { poids: 10, repetitions: 10, checked: true } as Serie
        const serie2 = { poids: 20, repetitions: 10, checked: true } as Serie // Total plus élevé implicite

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serie1 }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serie2 }]),
        ]

        const stats = calculateExerciseStats(sessions) // le défaut est MAX_TOTAL
        expect(stats.get('ex1')).toEqual(serie2)
      })
    })

    describe('Critère MAX_WEIGHT', () => {
      it('devrait garder la série avec le poids le plus élevé indépendamment du total', () => {
        // Volume élevé, poids faible
        const serieVolume = createSerie(10, 20) // weight 10, total 200
        // Volume faible, poids élevé
        const serieWeight = createSerie(50, 1) // weight 50, total 50

        const sessions = [
          createSession('s1', [{ id: 'ex1', series: [], max: serieVolume }]),
          createSession('s2', [{ id: 'ex1', series: [], max: serieWeight }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_WEIGHT')
        // Devrait choisir serieWeight car 50 > 10
        expect(stats.get('ex1')).toEqual(serieWeight)
      })

      it('devrait mettre à jour si une charge plus lourde est trouvée plus tard', () => {
        const s1 = createSerie(100, 1)
        const s2 = createSerie(105, 1) // New PR

        const sessions = [
          createSession('s1', [{ id: 'bench', max: s1 }]),
          createSession('s2', [{ id: 'bench', max: s2 }]),
        ]

        const stats = calculateExerciseStats(sessions, 'MAX_WEIGHT')
        expect(stats.get('bench')).toEqual(s2)
      })

      it('ne devrait pas mettre à jour si une charge plus légère est trouvée plus tard', () => {
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
