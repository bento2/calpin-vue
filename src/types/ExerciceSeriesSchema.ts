import { z } from 'zod'
import { SerieSchema } from '@/types/SerieSchema.ts'
import { addExerciceGetters, BaseExerciceSchema } from '@/types/ExerciceSchema.ts'

export const ExerciceSeriesSchema = BaseExerciceSchema.extend({
  series: z.array(SerieSchema).optional(),
}).transform((data) => {
  const base = addExerciceGetters(data)
  return {
    ...base,
    get completed() {
      if (!data.series || data.series.length === 0) return false
      return data.series.every((serie) => serie.checked === true)
    },
  }
})

export type ExerciceSeries = z.infer<typeof ExerciceSeriesSchema>
