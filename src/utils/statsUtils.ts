import type { Session } from '@/types/SessionSchema'
import type { Serie } from '@/types/SerieSchema'

export type StatsCriteria = 'MAX_TOTAL' | 'MAX_WEIGHT'

/**
 * Calculates the best stats for each exercise across all sessions.
 * definition of "best" depends on the criteria:
 * - MAX_TOTAL: The series with the highest total volume (weight * reps).
 * - MAX_WEIGHT: The series with the highest weight.
 *
 * @param sessions List of sessions to analyze
 * @param criteria Criteria to determine the best series (default: MAX_TOTAL)
 * @returns A Map where keys are exercise IDs and values are the best Serie found
 */
export function calculateExerciseStats(
  sessions: Session[],
  criteria: StatsCriteria = 'MAX_TOTAL',
): Map<string, Serie> {
  const statsExercices = new Map<string, Serie>()

  sessions.forEach((session) => {
    session.exercices.forEach((exercice) => {
      if (exercice.max) {
        const currentMax = exercice.max

        if (statsExercices.has(exercice.id)) {
          const recordedBest = statsExercices.get(exercice.id)!

          let isBetter = false
          if (criteria === 'MAX_TOTAL') {
            const currentTotal =
              currentMax.total ?? (currentMax.poids || 0) * (currentMax.repetitions || 0)
            const recordedTotal =
              recordedBest.total ?? (recordedBest.poids || 0) * (recordedBest.repetitions || 0)

            if (currentTotal > recordedTotal) {
              isBetter = true
            }
          } else {
            // MAX_WEIGHT
            const currentWeight = currentMax.poids || 0
            const recordedWeight = recordedBest.poids || 0
            if (currentWeight > recordedWeight) {
              isBetter = true
            }
          }

          if (isBetter) {
            statsExercices.set(exercice.id, currentMax)
          }
        } else {
          statsExercices.set(exercice.id, currentMax)
        }
      }
    })
  })

  return statsExercices
}
