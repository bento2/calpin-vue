// composables/useExerciceSeries.ts
import { computed } from 'vue'
import type { ExerciceSeries } from '@/types/ExerciceSeriesSchema.ts'

// version pure : retourne un computed basé sur le paramètre
export const isCompleted = (exercice: ExerciceSeries) => {
  return computed(() => (exercice.series?.length ? exercice.series.every((s) => s.checked) : false))
}

export const nbChecked = (exercice: ExerciceSeries) => {
  return computed(() => exercice.series?.filter((s) => s.checked).length ?? 0)
}
