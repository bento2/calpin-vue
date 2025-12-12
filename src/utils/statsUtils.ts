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
      // Ensure we have series to look at
      if (!exercice.series || exercice.series.length === 0) return

      // Find the best series in this specific exercise instance based on criteria
      // Note: original logic used `exercice.max`, which was likely a pre-calculated property.
      // If we want to be pure, we should verify if we strictly rely on `exercice.series` or `exercice.max`.
      // Looking at the original code:
      // if (exercice.series && exercice.max) { ... uses exercice.max ... }
      // So it assumes `exercice.max` is already populated correctly on the session object.
      // If we want to calculate it from scratch from series, we would iterate series.
      // However, to keep behavior identical to original logic which trusted `exercice.max`,
      // we should probably stick to that if available, OR iterate series if we want to be more robust.
      // The original code:
      // if (exercice.series && exercice.max) {
      //   ...
      //   statsExercices.value.set(exercice.id, exercice.max)
      // }
      // So it takes `exercice.max`. Let's assume `exercice.max` is the source of truth for "best of that session".

      if (exercice.max) {
        const currentMax = exercice.max

        if (statsExercices.has(exercice.id)) {
          const recordedBest = statsExercices.get(exercice.id)!

          let isBetter = false
          if (criteria === 'MAX_TOTAL') {
            // Safe access to total getter if it exists, otherwise calculate
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
