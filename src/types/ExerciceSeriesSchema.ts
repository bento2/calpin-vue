import { z } from 'zod'
import { SerieSchema } from '@/types/SerieSchema.ts'
import { ExerciceSchema } from '@/types/ExerciceSchema.ts'

export const ExerciceSeriesSchema = ExerciceSchema.extend({
  series: z.array(SerieSchema).optional(),
});


export type ExerciceSeries = z.infer<typeof ExerciceSeriesSchema>;
